import uuid
import json
import secrets
from datetime import datetime, timedelta
from typing import Tuple, Optional, Dict
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from flask import current_app

from app.shared.redis_client import RedisClient
from app.shared.config import settings
from .repository import AdminRepository

ph = PasswordHasher(time_cost=2, memory_cost=102400, parallelism=8)

class AdminAuthService:
    # Constants
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION = 900 # 15 min
    SESSION_IDLE_TTL = 1800 # 30 min
    SESSION_ABSOLUTE_TTL = 86400 # 24 hours
    
    @staticmethod
    def _get_redis():
        try:
            return RedisClient.get_client()
        except:
            return None

    @staticmethod
    def _check_rate_limit(ip: str, username: str) -> Tuple[bool, Optional[str]]:
        redis = AdminAuthService._get_redis()
        if redis:
            try:
                # Redis-based limiting (Fast)
                ip_key = f"admin:login:attempt:ip:{ip}"
                user_key = f"admin:login:attempt:user:{username}"
                
                # Check Lockout
                if redis.get(f"admin:login:lock:{username}"):
                    return False, "Account temporarily locked"

                # Increment
                ip_count = redis.incr(ip_key)
                if ip_count == 1: redis.expire(ip_key, AdminAuthService.LOCKOUT_DURATION)
                
                user_count = redis.incr(user_key)
                if user_count == 1: redis.expire(user_key, AdminAuthService.LOCKOUT_DURATION)
                
                if ip_count > AdminAuthService.MAX_LOGIN_ATTEMPTS or user_count > AdminAuthService.MAX_LOGIN_ATTEMPTS:
                    redis.setex(f"admin:login:lock:{username}", AdminAuthService.LOCKOUT_DURATION, "1")
                    return False, "Too many attempts. Try again in 15 minutes!."
                
                return True, None
            except Exception:
                pass # Fallback to DB

        # DB Fallback
        count = AdminRepository.get_recent_failed_attempts(ip)
        if count >= AdminAuthService.MAX_LOGIN_ATTEMPTS:
            return False, "Too many attempts. Try again in 15 minutes!."
        
        return True, None

    @staticmethod
    def login(username: str, password: str, ip: str, user_agent: str) -> Tuple[bool, Optional[Dict], str]:
        # 1. Rate Limit
        allowed, msg = AdminAuthService._check_rate_limit(ip, username)
        if not allowed:
            AdminRepository.record_login_attempt(None, username, ip, False)
            return False, None, msg

        # 2. Verify User
        admin = AdminRepository.get_admin_by_username(username)
        if not admin or not admin['is_active']:
            AdminRepository.record_login_attempt(admin['id'] if admin else None, username, ip, False)
            return False, None, "Invalid credentials"

        # 3. Verify Password
        try:
            ph.verify(admin['password_hash'], password)
        except VerifyMismatchError:
            AdminRepository.record_login_attempt(admin['id'], username, ip, False)
            return False, None, "Invalid credentials"

        # 4. Create Session
        session_id = str(uuid.uuid4())
        csrf_token = secrets.token_urlsafe(32)
        
        expires_at = datetime.utcnow() + timedelta(seconds=AdminAuthService.SESSION_ABSOLUTE_TTL)
        
        session_data = {
            "session_id": session_id,
            "admin_id": admin['id'],
            "username": admin['username'],
            "name": admin['name'],
            "role": admin['role'],
            "login_ip": ip,
            "user_agent": user_agent,
            "created_at": datetime.utcnow().isoformat(),
            "last_seen": datetime.utcnow().isoformat(),
            "expires_at": expires_at.isoformat(),
            "csrf_token": csrf_token # Store CSRF in session for validation
        }

        # Persist to DB
        try:
            AdminRepository.create_session({
                **session_data,
                "expires_at": expires_at # Pass datetime object to DB
            })
            AdminRepository.record_login_attempt(admin['id'], username, ip, True)
            
            # Cache in Redis
            redis = AdminAuthService._get_redis()
            if redis:
                redis.setex(
                    f"admin:session:{session_id}", 
                    AdminAuthService.SESSION_ABSOLUTE_TTL, 
                    json.dumps(session_data)
                )
                
            return True, session_data, "Login successful"
        except Exception as e:
            print(f"CRITICAL LOGIN ERROR: {str(e)}")
            return False, None, "Login failed due to system error"

    @staticmethod
    def get_session(session_id: str) -> Optional[Dict]:
        redis = AdminAuthService._get_redis()
        key = f"admin:session:{session_id}"

        # Try Redis
        if redis:
            try:
                raw = redis.get(key)
                if raw:
                    data = json.loads(raw)
                    # Idle Timeout Check
                    last_seen = datetime.fromisoformat(data['last_seen'])
                    if datetime.utcnow() - last_seen > timedelta(seconds=AdminAuthService.SESSION_IDLE_TTL):
                        AdminAuthService.logout(session_id)
                        return None
                    
                    # Slide window
                    data['last_seen'] = datetime.utcnow().isoformat()
                    redis.setex(key, AdminAuthService.SESSION_ABSOLUTE_TTL, json.dumps(data))
                    return data
            except Exception:
                pass # Fallback

        # Try DB
        session = AdminRepository.get_session(session_id)
        if session and redis:
            # Re-populate Redis
            # Note: We reconstruct the dict slightly differently for cache vs DB return
            cache_data = {
                "session_id": session['session_id'],
                "admin_id": session['admin_id'],
                "username": session['username'],
                "role": session['role'],
                "name": session['name'],
                "last_seen": datetime.utcnow().isoformat(),
                # Note: CSRF token isn't stored in DB table usually, unless we add a column.
                # For this design, we trust the DB session is valid, but CSRF might be lost on Redis flush.
                # STRATEGY: If Redis is lost, we accept the session but CSRF validation might fail if we relied on Redis storage.
                # BETTER: For strict CSRF, we regenerate it or it must be in DB. 
                # Since we are not migrating DB, we will skip CSRF storage in DB and rely on Cookie == Header stateless check.
            }
            # redis.setex(key, ...) 
        
        return session

    @staticmethod
    def logout(session_id: str):
        AdminRepository.revoke_session(session_id)
        redis = AdminAuthService._get_redis()
        if redis:
            redis.delete(f"admin:session:{session_id}")