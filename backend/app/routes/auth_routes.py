from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from firebase_admin import auth as firebase_auth
from app.utils.utils import format_user, allowed_image, log_error, UPLOAD_FOLDER
import uuid, os
from app.db import get_db_connection

auth_bp = Blueprint("auth", __name__)

# --- REGISTER ---
@auth_bp.route('/api/register', methods=['POST'])
def register():
    try:
        username = request.form.get('username')
        phone = request.form.get('phone')
        password = request.form.get('password')
        file = request.files.get('profile_pic')

        if not username or not phone or not password:
            return jsonify({'error': 'Missing required fields'}), 400

        if file and not allowed_image(file.filename):
            return jsonify({'error': 'Invalid profile picture'}), 400

        filename = ''
        if file:
            filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
            file.save(os.path.join(UPLOAD_FOLDER, filename))

        hashed_password = generate_password_hash(password)

        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM users WHERE phone = %s", (phone,))
                if cursor.fetchone():
                    return jsonify({'message': 'User already exists'}), 409

                cursor.execute("""
                    INSERT INTO users (username, phone, password_hash, profile_pic)
                    VALUES (%s, %s, %s, %s)
                """, (username, phone, hashed_password, filename))
                conn.commit()

                cursor.execute("SELECT * FROM users WHERE phone = %s", (phone,))
                user = cursor.fetchone()

        user = format_user(user)
        token = create_access_token(identity=str(user['id']))  # Convert to string
        return jsonify({'user': user, 'token': token}), 200

    except Exception as e:
        log_error("Register", e)
        return jsonify({'error': 'Internal server error'}), 500

# --- LOGIN ---
@auth_bp.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        phone = data.get('phone')
        password = data.get('password')

        if not phone or not password:
            return jsonify({'message': 'Phone and password required'}), 400

        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE phone = %s", (phone,))
                user = cursor.fetchone()

                if not user or not check_password_hash(user['password_hash'], password):
                    return jsonify({'message': 'Invalid credentials'}), 401

        user = format_user(user)
        token = create_access_token(identity=str(user['id']))  # Convert to string
        return jsonify({'user': user, 'token': token}), 200

    except Exception as e:
        log_error("Login", e)
        return jsonify({'error': 'Internal server error'}), 500

# --- GOOGLE LOGIN ---
@auth_bp.route('/api/google-login', methods=['POST'])
def google_login():
    try:
        data = request.get_json()
        id_token = data.get('idToken')
        username = data.get('username')
        email = data.get('email')
        google_id = data.get('google_id')
        profile_pic = data.get('profile_pic', '')

        if not id_token:
            return jsonify({'error': 'Missing Firebase ID token'}), 400

        decoded_token = firebase_auth.verify_id_token(id_token)
        if decoded_token.get('uid') != google_id or decoded_token.get('email') != email:
            return jsonify({'error': 'Token mismatch'}), 401

        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE google_id = %s", (google_id,))
                user = cursor.fetchone()

                if not user:
                    cursor.execute("""
                        INSERT INTO users (username, email, google_id, profile_pic)
                        VALUES (%s, %s, %s, %s)
                    """, (username, email, google_id, profile_pic))
                    conn.commit()
                    cursor.execute("SELECT * FROM users WHERE google_id = %s", (google_id,))
                    user = cursor.fetchone()

        user = format_user(user)
        token = create_access_token(identity=str(user['id']))  # Convert to string
        return jsonify({'user': user, 'token': token}), 200

    except Exception as e:
        log_error("Google Login", e)
        return jsonify({'error': 'Internal server error'}), 500

# --- GET PROFILE ---
@auth_bp.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
                user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'User not found'}), 404

        return jsonify({'user': format_user(user)}), 200

    except Exception as e:
        log_error("Get Profile", e)
        return jsonify({'error': 'Internal server error'}), 500


# --- UPDATE PROFILE ---
@auth_bp.route('/api/update-profile', methods=['POST'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        username = request.form.get('username')
        file = request.files.get('profile_pic')

        if not username:
            return jsonify({'error': 'Username is required'}), 400

        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                if file and allowed_image(file.filename):
                    filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
                    file.save(os.path.join(UPLOAD_FOLDER, filename))
                    cursor.execute(
                        "UPDATE users SET username=%s, profile_pic=%s WHERE id=%s",
                        (username, filename, user_id)
                    )
                else:
                    cursor.execute("UPDATE users SET username=%s WHERE id=%s", (username, user_id))

                conn.commit()
                cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
                user = cursor.fetchone()

        return jsonify({'user': format_user(user)}), 200

    except Exception as e:
        log_error("Update Profile", e)
        return jsonify({'error': 'Internal server error'}), 500


# --- LOGOUT (Placeholder for token expiry if needed) ---
@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out'}), 200
