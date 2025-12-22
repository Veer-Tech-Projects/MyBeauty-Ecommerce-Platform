from typing import Optional, Dict, Any
from datetime import datetime
from app.shared.database import get_cursor

class AdminRepository:
    
    @staticmethod
    def get_admin_by_username(username: str) -> Optional[Dict]:
        with get_cursor() as cursor:
            cursor.execute(
                "SELECT id, username, password_hash, name, role, is_active FROM admins WHERE username = %s",
                (username,)
            )
            return cursor.fetchone()

    @staticmethod
    def get_admin_by_id(admin_id: int) -> Optional[Dict]:
        with get_cursor() as cursor:
            cursor.execute(
                "SELECT username, name, role FROM admins WHERE id = %s",
                (admin_id,)
            )
            return cursor.fetchone()

    @staticmethod
    def record_login_attempt(admin_id: Optional[int], username: Optional[str], ip: str, success: bool):
        try:
            with get_cursor(commit=True) as cursor:
                cursor.execute(
                    """INSERT INTO admin_login_attempts 
                       (admin_id, username, ip_address, success) 
                       VALUES (%s, %s, %s, %s)""",
                    (admin_id, username, ip, int(success))
                )
        except Exception:
            # Audit logging should not crash the app
            pass

    @staticmethod
    def get_recent_failed_attempts(ip: str, minutes: int = 15) -> int:
        with get_cursor() as cursor:
            cursor.execute(
                """SELECT COUNT(*) as cnt FROM admin_login_attempts 
                   WHERE ip_address = %s 
                   AND attempted_at > NOW() - INTERVAL %s MINUTE 
                   AND success = 0""",
                (ip, minutes)
            )
            return cursor.fetchone()['cnt']

    @staticmethod
    def create_session(data: Dict):
        with get_cursor(commit=True) as cursor:
            cursor.execute(
                """INSERT INTO admin_sessions 
                   (session_id, admin_id, login_ip, user_agent, expires_at)
                   VALUES (%s, %s, %s, %s, %s)""",
                (data['session_id'], data['admin_id'], data['login_ip'], data['user_agent'], data['expires_at'])
            )

    @staticmethod
    def get_session(session_id: str) -> Optional[Dict]:
        with get_cursor() as cursor:
            # Join with admins to get current role/name status
            cursor.execute(
                """SELECT s.*, a.username, a.role, a.name 
                   FROM admin_sessions s
                   JOIN admins a ON s.admin_id = a.id
                   WHERE s.session_id = %s AND s.revoked_at IS NULL
                   AND s.expires_at > NOW()""",
                (session_id,)
            )
            return cursor.fetchone()

    @staticmethod
    def revoke_session(session_id: str):
        with get_cursor(commit=True) as cursor:
            cursor.execute(
                "UPDATE admin_sessions SET revoked_at = NOW() WHERE session_id = %s AND revoked_at IS NULL",
                (session_id,)
            )

    @staticmethod
    def extend_session(session_id: str, new_expires: datetime):
        with get_cursor(commit=True) as cursor:
            cursor.execute(
                "UPDATE admin_sessions SET expires_at = %s WHERE session_id = %s AND revoked_at IS NULL",
                (new_expires, session_id)
            )