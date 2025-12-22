import os
import uuid
from flask import Blueprint, request, make_response, current_app
from flask_jwt_extended import (
    jwt_required, get_jwt_identity, 
    set_access_cookies, set_refresh_cookies, unset_jwt_cookies
)
from werkzeug.utils import secure_filename

from app.modules.auth.services import AuthService
from app.modules.auth.repository import UserRepository
from app.shared.response import success_response, error_response
from app.shared.config import settings
from app.shared.exceptions import AppError

from app.modules.auth.schemas import ForgotPasswordSchema, ResetPasswordSchema

auth_bp = Blueprint('auth_v2', __name__, url_prefix='/api/auth')

def attach_tokens_to_response(resp_json, status, access_token, refresh_token):
    """
    Helper to attach cookies using Flask-JWT-Extended.
    This automatically handles CSRF cookies if configured.
    """
    resp = make_response(resp_json, status)
    set_access_cookies(resp, access_token)
    set_refresh_cookies(resp, refresh_token)
    return resp

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        file = request.files.get('profile_pic')
        filename = None
        if file:
            ext = os.path.splitext(file.filename)[1]
            if ext.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                # 1. Generate unique name
                safe_name = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
                
                # 2. FIX: Calculate Absolute Path to 'app/static/uploads/avatars'
                # This ensures it goes to the correct internal folder
                save_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'avatars')
                
                # Ensure directory exists
                os.makedirs(save_dir, exist_ok=True)
                
                # 3. Save file
                save_path = os.path.join(save_dir, safe_name)
                print(f"DEBUG: Saving registration avatar to {save_path}") # Debug print
                file.save(save_path)
                
                # 4. Database path (Relative for URL)
                filename = f"avatars/{safe_name}"

        data = request.form.to_dict()
        result = AuthService.register(data, filename)
        
        json_payload, status = success_response("Registration successful", {"user": result['user']})
        return attach_tokens_to_response(json_payload, status, result['access_token'], result['refresh_token'])

    except AppError as e:
        return error_response(e.message, status_code=e.status_code)
    except Exception as e:
        return error_response(str(e), status_code=500)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        result = AuthService.login(data)
        
        json_payload, status = success_response("Login successful", {"user": result['user']})
        return attach_tokens_to_response(json_payload, status, result['access_token'], result['refresh_token'])

    except AppError as e:
        return error_response(e.message, status_code=e.status_code)
    except Exception as e:
        return error_response("Login failed", details={"error": str(e)}, status_code=500)

@auth_bp.route('/google-login', methods=['POST'])
def google_login():
    try:
        data = request.get_json()
        result = AuthService.google_login(data)
        
        json_payload, status = success_response("Google Login successful", {"user": result['user']})
        return attach_tokens_to_response(json_payload, status, result['access_token'], result['refresh_token'])

    except AppError as e:
        return error_response(e.message, status_code=e.status_code)
    except Exception as e:
        return error_response(str(e), status_code=500)

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = UserRepository.get_by_id(user_id)
        if not user:
            return error_response("User not found", status_code=404)
        
        # Security: Sanitize even here
        safe_user = AuthService._sanitize_user(user)
        return success_response("User profile", {"user": safe_user})
    except Exception as e:
        return error_response(str(e), status_code=500)

@auth_bp.route('/logout', methods=['POST'])
def logout():
    json_payload, status = success_response("Logged out successfully")
    resp = make_response(json_payload, status)
    unset_jwt_cookies(resp)
    return resp

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        
        # Get Real IP (handles Proxy/Nginx headers if present)
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        
        AuthService.forgot_password(data, ip_address)
        
        return success_response("If an account exists with this email, a reset link has been sent.")
    except AppError as e:
        return error_response(e.message, status_code=e.status_code)
    except Exception as e:
        return error_response(str(e), status_code=500)

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        AuthService.reset_password(data)
        return success_response("Password updated successfully. You can now login.")
    except AppError as e:
        return error_response(e.message, status_code=e.status_code)
    except Exception as e:
        return error_response(str(e), status_code=500)