# backend/app/services/admin_auth_service.py
from datetime import datetime, timedelta
from typing import Optional, Tuple
import uuid
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from flask import request, g, current_app
from app.db import transaction, fetch_one, execute, fetch_all
from app.utils.session_utils import (
    set_session, get_session, delete_session, refresh_session, generate_session_id
)
from app.logger import get_logger
from redis import Redis
from redis.exceptions import ConnectionError as RedisConnectionError

log = get_logger(__name__)
ph = PasswordHasher(time_cost=2, memory_cost=102400, parallelism=8)

# Rate limit config
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_SEC = 15 * 60  # 15 min
RATE_LIMIT_KEY_IP = "admin:login:attempt:ip:{ip}"
RATE_LIMIT_KEY_USER = "admin:login:attempt:user:{username}"
LOCKOUT_KEY = "admin:login:lock:{username}"

def get_redis() -> Optional[Redis]:
    try:
        return current_app.extensions.get('redis', None) or Redis.from_url(
            current_app.config.get('REDIS_URL', 'redis://localhost:6379/0'),
            decode_responses=True
        )
    except:
        return None

def _record_login_attempt(
    username: Optional[str],
    admin_id: Optional[int],
    ip: str,
    success: bool
) -> None:
    """Record login attempt in DB (audit)"""
    try:
        execute(
            """INSERT INTO admin_login_attempts 
               (admin_id, username, ip_address, success) 
               VALUES (%s, %s, %s, %s)""",
            (admin_id, username, ip, int(success))
        )
    except Exception as e:
        log.error("login_attempt_record_failed", extra={"error": str(e)})

def _check_rate_limit(ip: str, username: str) -> Tuple[bool, Optional[int]]:
    """
    Returns (allowed: bool, retry_after: int or None)
    """
    redis = get_redis()
    allowed = True
    retry_after = None

    try:
        if redis:
            # Per IP
            ip_key = RATE_LIMIT_KEY_IP.format(ip=ip)
            ip_count = redis.incr(ip_key)
            if ip_count == 1:
                redis.expire(ip_key, LOCKOUT_DURATION_SEC)

            # Per username
            user_key = RATE_LIMIT_KEY_USER.format(username=username)
            user_count = redis.incr(user_key)
            if user_count == 1:
                redis.expire(user_key, LOCKOUT_DURATION_SEC)

            # Lockout check
            lock_key = LOCKOUT_KEY.format(username=username)
            if redis.get(lock_key):
                ttl = redis.ttl(lock_key)
                return False, int(ttl)

            # Enforce limit
            if ip_count > MAX_LOGIN_ATTEMPTS or user_count > MAX_LOGIN_ATTEMPTS:
                redis.setex(lock_key, LOCKOUT_DURATION_SEC, "1")
                return False, LOCKOUT_DURATION_SEC

    except RedisConnectionError:
        log.warning("redis_rate_limit_failed", extra={"ip": ip, "username": username})

    # Fallback: DB-based rate limiting (last 15 min, only failed attempts)
    cutoff = datetime.utcnow() - timedelta(minutes=15)
    count = fetch_one(
        """SELECT COUNT(*) as cnt FROM admin_login_attempts 
           WHERE ip_address = %s AND attempted_at > %s AND success = 0""",
        (ip, cutoff)
    )['cnt']

    if count >= MAX_LOGIN_ATTEMPTS:
        return False, LOCKOUT_DURATION_SEC

    return True, None


def login(username: str, password: str, ip: str, user_agent: str) -> Tuple[bool, Optional[dict], str]:
    """
    Returns (success, admin_data or None, message)
    """
    username = username.strip().lower()

    # 1. Rate limit check
    allowed, retry_after = _check_rate_limit(ip, username)
    if not allowed:
        _record_login_attempt(username, None, ip, False)
        log.warning("admin_login_rate_limited", extra={"ip": ip, "username": username, "retry_after": retry_after})
        return False, None, f"Too many attempts. Try again in {retry_after // 60} minutes."

    # 2. Find admin
    admin = fetch_one(
        "SELECT id, username, password_hash, name, role, is_active FROM admins WHERE username = %s",
        (username,)
    )
    if not admin:
        _record_login_attempt(username, None, ip, False)
        log.info("admin_login_failed", extra={"username": username, "ip": ip, "reason": "user_not_found"})
        return False, None, "Invalid credentials."

    if not admin['is_active']:
        _record_login_attempt(username, admin['id'], ip, False)
        return False, None, "Account is disabled."

    # 3. Verify password (Argon2)
    try:
        ph.verify(admin['password_hash'], password)
    except VerifyMismatchError:
        _record_login_attempt(username, admin['id'], ip, False)
        log.info("admin_login_failed", extra={"admin_id": admin['id'], "ip": ip, "reason": "wrong_password"})
        return False, None, "Invalid credentials."

    # 4. Success → create session
    session_id = generate_session_id()
    try:
        set_session(session_id, admin['id'], ip, user_agent)
        _record_login_attempt(username, admin['id'], ip, True)
        log.info(
            "admin_login_success",
            extra={
                "admin_id": admin['id'],
                "username": username,
                "session_id": session_id,
                "ip": ip
            }
        )
        return True, {
            "admin_id": admin['id'],
            "username": admin['username'],
            "name": admin['name'],
            "role": admin['role']
        }, session_id
    except Exception as e:
        log.error("session_create_failed_during_login", extra={"error": str(e), "admin_id": admin['id']})
        return False, None, "Login failed. Please try again."

def logout(session_id: str) -> bool:
    """Revoke session"""
    try:
        delete_session(session_id)
        log.info("admin_logout_success", extra={"session_id": session_id})
        return True
    except Exception as e:
        log.error("logout_failed", extra={"session_id": session_id, "error": str(e)})
        return False

def get_current_admin() -> Optional[dict]:
    """Helper for middleware"""
    session_id = g.get('session_id')
    if not session_id:
        return None
    session = get_session(session_id)
    if not session:
        return None
    return {
        "admin_id": session["admin_id"],
        "username": session.get("username"),
        "name": session.get("name"),
        "role": session.get("role")
    }