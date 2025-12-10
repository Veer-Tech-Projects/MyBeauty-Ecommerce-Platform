# backend/app/utils/session_utils.py
import uuid
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from flask import g, request, current_app
from app.db import transaction, fetch_one, execute
from app.config import settings
from app.logger import get_logger
from redis import Redis
from redis.exceptions import ConnectionError as RedisConnectionError

log = get_logger(__name__)

# Redis client (singleton)
_redis_client: Optional[Redis] = None

def get_redis() -> Redis:
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = Redis.from_url(
                settings.REDIS_URL or "redis://localhost:6379/0",
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            # Test connection
            _redis_client.ping()
        except Exception as e:
            log.warning("redis_init_failed", extra={"error": str(e)})
            _redis_client = None  # Fallback to DB-only
    return _redis_client

# Session config
SESSION_IDLE_TTL = 30 * 60      # 30 min
SESSION_ABSOLUTE_TTL = 24 * 3600  # 24 h
SESSION_KEY_PREFIX = "admin:session:"

def generate_session_id() -> str:
    return str(uuid.uuid4())

def _build_session_key(session_id: str) -> str:
    return f"{SESSION_KEY_PREFIX}{session_id}"

def set_session(
    session_id: str,
    admin_id: int,
    login_ip: str,
    user_agent: str
) -> None:
    """
    Creates session in Redis + MySQL (atomic) with full admin info.
    """
    redis = get_redis()
    expires_at = datetime.utcnow() + timedelta(seconds=SESSION_ABSOLUTE_TTL)
    last_seen = datetime.utcnow()

    # Fetch admin info from DB
    admin = fetch_one(
        "SELECT username, name, role FROM admins WHERE id = %s",
        (admin_id,)
    )
    if not admin:
        raise ValueError(f"Admin with id {admin_id} not found")

    session_data = {
        "admin_id": admin_id,
        "username": admin["username"],
        "name": admin["name"],
        "role": admin["role"],
        "login_ip": login_ip,
        "user_agent": user_agent,
        "created_at": datetime.utcnow().isoformat(),
        "last_seen": last_seen.isoformat(),
        "expires_at": expires_at.isoformat(),
    }

    try:
        with transaction() as (conn, cur):
            # Insert audit row
            execute(
                """INSERT INTO admin_sessions 
                   (session_id, admin_id, login_ip, user_agent, expires_at)
                   VALUES (%s, %s, %s, %s, %s)""",
                (session_id, admin_id, login_ip, user_agent, expires_at)
            )
            # Store in Redis (if available)
            if redis:
                key = _build_session_key(session_id)
                redis.setex(key, SESSION_ABSOLUTE_TTL, json.dumps(session_data))
            conn.commit()
    except Exception as e:
        log.error("session_create_failed", extra={"session_id": session_id, "error": str(e)})
        raise

    log.info(
        "admin_session_created",
        extra={"session_id": session_id, "admin_id": admin_id, "ip": login_ip}
    )

def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Returns session dict or None.
    Falls back to DB if Redis down.
    """
    redis = get_redis()
    key = _build_session_key(session_id)

    try:
        if redis:
            raw = redis.get(key)
            if raw:
                data = json.loads(raw)
                # Update last_seen (sliding window)
                now = datetime.utcnow()
                last_seen = datetime.fromisoformat(data["last_seen"])
                if (now - last_seen).total_seconds() > SESSION_IDLE_TTL:
                    delete_session(session_id)
                    return None
                data["last_seen"] = now.isoformat()
                redis.setex(key, SESSION_ABSOLUTE_TTL, json.dumps(data))
                return data
    except RedisConnectionError:
        log.warning("redis_down_session_fallback", extra={"session_id": session_id})
    except Exception as e:
        log.error("redis_get_failed", extra={"session_id": session_id, "error": str(e)})

    # Fallback: DB check
    row = fetch_one(
        """SELECT s.*, a.username, a.role, a.name 
           FROM admin_sessions s
           JOIN admins a ON s.admin_id = a.id
           WHERE s.session_id = %s AND s.revoked_at IS NULL
           AND s.expires_at > NOW()""",
        (session_id,)
    )
    if not row:
        return None

    # Rebuild in Redis if possible
    if redis:
        try:
            data = {
                "admin_id": row["admin_id"],
                "login_ip": row["login_ip"],
                "user_agent": row["user_agent"],
                "created_at": row["created_at"].isoformat(),
                "last_seen": datetime.utcnow().isoformat(),
                "expires_at": row["expires_at"].isoformat(),
                "username": row["username"],   # <--- add
                "role": row["role"],           # <--- add
                "name": row["name"],           # <--- add
            }
            redis.setex(key, SESSION_ABSOLUTE_TTL, json.dumps(data))
        except Exception as e:
            log.error("redis_set_failed", extra={"session_id": session_id, "error": str(e)})

            pass

    return {
        "admin_id": row["admin_id"],
        "login_ip": row["login_ip"],
        "user_agent": row["user_agent"],
        "created_at": row["created_at"].isoformat(),
        "last_seen": datetime.utcnow().isoformat(),
        "expires_at": row["expires_at"].isoformat(),
        "username": row["username"],
        "role": row["role"],
        "name": row["name"],
    }

def delete_session(session_id: str) -> None:
    """
    Revoke session in DB + Redis.
    """
    redis = get_redis()
    try:
        with transaction() as (conn, cur):
            execute(
                "UPDATE admin_sessions SET revoked_at = NOW() WHERE session_id = %s AND revoked_at IS NULL",
                (session_id,)
            )
            if redis:
                redis.delete(_build_session_key(session_id))
            conn.commit()
    except Exception as e:
        log.error("session_delete_failed", extra={"session_id": session_id, "error": str(e)})
        raise

    log.info("admin_session_revoked", extra={"session_id": session_id})

def refresh_session(session_id: str) -> None:
    """
    Extend absolute TTL (used on refresh endpoint).
    """
    redis = get_redis()
    new_expires = datetime.utcnow() + timedelta(seconds=SESSION_ABSOLUTE_TTL)
    try:
        with transaction() as (conn, cur):
            execute(
                "UPDATE admin_sessions SET expires_at = %s WHERE session_id = %s AND revoked_at IS NULL",
                (new_expires, session_id)
            )
            if redis:
                key = _build_session_key(session_id)
                raw = redis.get(key)
                if raw:
                    data = json.loads(raw)
                    data["expires_at"] = new_expires.isoformat()
                    redis.setex(key, SESSION_ABSOLUTE_TTL, json.dumps(data))
            conn.commit()
    except Exception as e:
        log.error("session_refresh_failed", extra={"session_id": session_id, "error": str(e)})
        raise