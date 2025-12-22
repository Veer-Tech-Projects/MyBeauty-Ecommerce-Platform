from app.shared.database import get_cursor
from typing import Optional, Dict

class UserRepository:
    # Enterprise Security: Whitelist allowed columns for updates
    ALLOWED_UPDATE_FIELDS = {'username', 'email', 'google_id', 'profile_pic', 'phone', 'is_phone_verified'}

    @staticmethod
    def get_by_phone(phone: str) -> Optional[Dict]:
        with get_cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE phone = %s", (phone,))
            return cursor.fetchone()

    @staticmethod
    def get_by_email(email: str) -> Optional[Dict]:
        with get_cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            return cursor.fetchone()

    @staticmethod
    def get_by_google_id(google_id: str) -> Optional[Dict]:
        with get_cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE google_id = %s", (google_id,))
            return cursor.fetchone()

    @staticmethod
    def get_by_id(user_id: int) -> Optional[Dict]:
        with get_cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            return cursor.fetchone()

    @staticmethod
    def create_user(username: str, phone: Optional[str] = None, password_hash: Optional[str] = None, 
                    email: Optional[str] = None, google_id: Optional[str] = None, 
                    profile_pic: Optional[str] = None) -> int:
        with get_cursor(commit=True) as cursor:
            sql = """
                INSERT INTO users 
                (username, phone, email, password_hash, google_id, profile_pic, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
            """
            cursor.execute(sql, (username, phone, email, password_hash, google_id, profile_pic))
            return cursor.lastrowid

    @staticmethod
    def update_profile(user_id: int, updates: Dict) -> None:
        if not updates:
            return

        # Security Fix: Filter updates against whitelist
        safe_updates = {k: v for k, v in updates.items() if k in UserRepository.ALLOWED_UPDATE_FIELDS}
        
        if not safe_updates:
            return

        set_clauses = []
        params = []
        for key, value in safe_updates.items():
            set_clauses.append(f"{key} = %s")
            params.append(value)
        
        params.append(user_id)
        # Safe because keys are checked against the hardcoded whitelist set above
        sql = f"UPDATE users SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s"

        with get_cursor(commit=True) as cursor:
            cursor.execute(sql, tuple(params))

    
    @staticmethod
    def update_password(user_id: int, password_hash: str) -> None:
        with get_cursor(commit=True) as cursor:
            # Updates password AND invalidates all sessions (optional logic) if you track token versions
            sql = "UPDATE users SET password_hash = %s, updated_at = NOW() WHERE id = %s"
            cursor.execute(sql, (password_hash, user_id))