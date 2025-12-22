from celery import shared_task
from datetime import datetime, timedelta
from app.shared.database import get_cursor
from app.shared.config import settings
import logging

log = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def cleanup_admin_sessions(self):
    """
    Hard deletes revoked admin sessions older than 30 days.
    """
    cutoff_days = 30
    sql = "DELETE FROM admin_sessions WHERE revoked_at IS NOT NULL AND revoked_at < DATE_SUB(NOW(), INTERVAL %s DAY)"

    try:
        with get_cursor(commit=True) as cursor:
            cursor.execute(sql, (cutoff_days,))
            deleted_count = cursor.rowcount
            
        log.info(f"Cleanup: Removed {deleted_count} old admin sessions.")
        return deleted_count
    except Exception as e:
        log.error(f"Cleanup Failed: cleanup_admin_sessions - {str(e)}")
        raise self.retry(exc=e, countdown=300)

@shared_task(bind=True, max_retries=3)
def cleanup_login_attempts(self):
    """
    Deletes login audit logs older than 14 days.
    """
    cutoff_days = 14
    sql = "DELETE FROM admin_login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL %s DAY)"

    try:
        with get_cursor(commit=True) as cursor:
            cursor.execute(sql, (cutoff_days,))
            deleted_count = cursor.rowcount
            
        log.info(f"Cleanup: Removed {deleted_count} old login logs.")
        return deleted_count
    except Exception as e:
        log.error(f"Cleanup Failed: cleanup_login_attempts - {str(e)}")
        raise self.retry(exc=e, countdown=300)