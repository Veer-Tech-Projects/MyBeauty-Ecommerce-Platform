import os
import logging
import pymysql
from pymysql.cursors import DictCursor  # ✅ Required for cursorclass
from werkzeug.utils import secure_filename

# ✅ Create uploads folder if not exists
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_db_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "veer@3815"),
        database=os.getenv("DB_NAME", "ecommerce"),
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )

def allowed_image(filename):
    allowed_exts = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_exts

def format_user(user):
    if not user:
        return None
    return {
        'id': user['id'],
        'username': user['username'],
        'email': user.get('email'),
        'phone': user.get('phone'),
        'profile_pic': f"/uploads/{user['profile_pic']}" if user.get('profile_pic') else None,
        'is_admin': bool(user.get('is_admin', 0))
    }

def log_error(context, exception):
    logging.exception(f"[{context}] {str(exception)}")
