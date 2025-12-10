from app.celery_app import make_celery
from app.db import get_db_connection, transaction,fetch_all, execute
from app.config import settings
from app.logger import get_logger
import time
import logging
import json
from logging.handlers import QueueListener
from redis import Redis
import os
import uuid
from app.utils.session_utils import delete_session
from datetime import datetime, timedelta

log = get_logger(__name__)
celery = make_celery(app=None)
redis_client = Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))

@celery.task(bind=True, max_retries=3)
def sweep_payment_attempts(self):
    ttl_sec = settings.IDEMPOTENCY_TTL_SEC
    cutoff = 'DATE_SUB(NOW(), INTERVAL %s SECOND)' % ttl_sec
    try:
        with get_db_connection() as conn, conn.cursor() as cur:
            cur.execute(f"DELETE FROM payment_attempts WHERE created_at < {cutoff}")
            deleted = cur.rowcount
            conn.commit()
        log.info("Payment attempts sweep completed", extra={"deleted_count": deleted, "ttl_sec": ttl_sec})
        return deleted
    except Exception as e:
        log.error("Sweep failed", extra={"error": str(e)})
        raise self.retry(countdown=60 * (2 ** self.request.retries))

@celery.task(bind=True, max_retries=3)
def retry_webhook_processing(self, event_id, payload_str, rzp_order_id):
    try:
        payload = json.loads(payload_str)
        event_type = payload.get('event')
        log_id = int(event_id.split('_')[-1]) if '_' in event_id else event_id
        if event_type == 'payment.captured':
            process_captured_event(payload, rzp_order_id, log_id)
        elif event_type == 'payment.failed':
            process_failed_event(payload, rzp_order_id, log_id)
        else:
            log.info("Unsupported retry event", extra={"event_type": event_type})
        log.info("Webhook retry success", extra={"event_id": event_id})
    except Exception as e:
        log.error("Webhook retry failed", extra={"event_id": event_id, "error": str(e)})
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60 * (2 ** self.request.retries))
        else:
            log.error("Webhook retry exhausted", extra={"event_id": event_id})

@celery.task(bind=True, max_retries=3)
def release_stock_task(self, order_id, sub_order_id):
    try:
        with transaction() as (conn, cur):
            cur.execute("""
                SELECT product_id, variant_id, size, quantity
                FROM order_items
                WHERE sub_order_id = %s
            """, (sub_order_id,))
            items = cur.fetchall()
            for item in items:
                product_id = item['product_id']
                variant_id = item['variant_id']
                size = item['size']
                quantity = item['quantity']
                cur.execute("""
                    SELECT reserved_quantity, size_stock
                    FROM inventory
                    WHERE product_id = %s AND seller_id = (SELECT seller_id FROM sub_orders WHERE id = %s) AND variant_id <=> %s FOR UPDATE
                """, (product_id, sub_order_id, variant_id))
                stock = cur.fetchone()
                if stock and stock['reserved_quantity'] >= quantity:
                    size_stock = json.loads(stock['size_stock'] or '{}')
                    if size and size_stock:
                        size_stock[size] += quantity
                    cur.execute("""
                        UPDATE inventory
                        SET reserved_quantity = reserved_quantity - %s,
                            size_stock = %s
                        WHERE product_id = %s AND seller_id = (SELECT seller_id FROM sub_orders WHERE id = %s) AND variant_id <=> %s
                    """, (quantity, json.dumps(size_stock) if size_stock else None, product_id, sub_order_id, variant_id))
                    cur.execute("""
                        INSERT INTO stock_transactions (order_id, sub_order_id, product_id, seller_id, variant_id, size, quantity, action, request_id)
                        VALUES (%s, %s, %s, (SELECT seller_id FROM sub_orders WHERE id = %s), %s, %s, %s, 'released', %s)
                    """, (order_id, sub_order_id, product_id, sub_order_id, variant_id, size, quantity, str(uuid.uuid4())))
                    if variant_id:
                        cur.execute("""
                            UPDATE product_variants
                            SET stock = stock + %s,
                                size_stock = %s
                            WHERE id = %s
                        """, (quantity, json.dumps(size_stock) if size_stock else None, variant_id))
                    else:
                        cur.execute("""
                            UPDATE products
                            SET stock = stock + %s,
                                size_stock = %s
                            WHERE id = %s
                        """, (quantity, json.dumps(size_stock) if size_stock else None, product_id))
                    cache_key = f"stock:{product_id}:{seller_id}:{variant_id or 'null'}:{size or 'null'}"
                    redis_client.delete(cache_key)
            cur.execute("UPDATE orders SET status = 'failed' WHERE id = %s", (order_id,))
            cur.execute("UPDATE sub_orders SET status = 'failed' WHERE id = %s", (sub_order_id,))
            conn.commit()
            log.info("Stock released due to timeout", extra={"order_id": order_id, "sub_order_id": sub_order_id})
    except Exception as e:
        log.error("Stock release failed", extra={"order_id": order_id, "error": str(e)})
        raise self.retry(countdown=60 * (2 ** self.request.retries))

@celery.task(bind=True, max_retries=3)
def drain_log_queue(self):
    try:
        from app.logger import log_queue, handler
        listener = QueueListener(log_queue, handler)
        listener.start()
        start_time = time.time()
        drained = 0
        while not log_queue.empty() and (time.time() - start_time) < 30:
            time.sleep(0.1)
            drained += 1
        listener.stop()
        log.info("Log queue drained", extra={"drained_events": drained, "queue_size": log_queue.qsize()})
    except Exception as e:
        log.error("Drain fail", extra={"error": str(e)})
        raise self.retry(countdown=60 * (2 ** self.request.retries))
    
    
    # {----------------------- Admin Auth Tasks------------------------------- } 
    
@celery.task(bind=True, max_retries=3)
def sweep_expired_admin_sessions(self):
    """
    Runs every 5 minutes.
    - Finds expired sessions (DB)
    - Revokes in DB + Redis
    - Logs count
    """
    try:
        # Find expired but not revoked
        expired = fetch_all("""
            SELECT session_id FROM admin_sessions
            WHERE expires_at < NOW() AND revoked_at IS NULL
            LIMIT 1000
        """)

        revoked_count = 0
        for row in expired:
            session_id = row['session_id']
            try:
                delete_session(session_id)
                revoked_count += 1
            except Exception as e:
                log.error("session_sweep_delete_failed", extra={"session_id": session_id, "error": str(e)})

        log.info(
            "admin_session_sweep_completed",
            extra={"revoked_count": revoked_count, "checked_count": len(expired)}
        )
        return revoked_count

    except Exception as e:
        log.error("admin_session_sweep_failed", extra={"error": str(e)})
        raise self.retry(countdown=60 * (2 ** self.request.retries))
    
@celery.task(bind=True, max_retries=3)
def cleanup_old_admin_sessions(self):
    """
    Deletes revoked admin sessions older than 30 days.
    Safe: Only touches sessions with revoked_at set.
    """
    cutoff = datetime.utcnow() - timedelta(days=30)
    try:
        with transaction() as (conn, cur):
            result = execute(
                """DELETE FROM admin_sessions 
                   WHERE revoked_at IS NOT NULL 
                   AND revoked_at < %s""",
                (cutoff,)
            )
            conn.commit()

        log.info(
            "admin_sessions_cleanup",
            extra={
                "deleted_count": result,
                "retention_days": 30,
                "cutoff": cutoff.isoformat()
            }
        )
        return result

    except Exception as e:
        log.error("admin_sessions_cleanup_failed", extra={"error": str(e)})
        raise self.retry(countdown=300)


@celery.task(bind=True, max_retries=3)
def cleanup_old_login_attempts(self):
    """
    Deletes login attempts older than 14 days.
    Safe: Rate limiting uses Redis + recent DB rows.
    """
    cutoff = datetime.utcnow() - timedelta(days=14)
    try:
        with transaction() as (conn, cur):
            result = execute(
                "DELETE FROM admin_login_attempts WHERE attempted_at < %s",
                (cutoff,)
            )
            conn.commit()

        log.info(
            "login_attempts_cleanup",
            extra={
                "deleted_count": result,
                "retention_days": 14,
                "cutoff": cutoff.isoformat()
            }
        )
        return result

    except Exception as e:
        log.error("login_attempts_cleanup_failed", extra={"error": str(e)})
        raise self.retry(countdown=300)