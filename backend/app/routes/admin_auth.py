# backend/app/routes/admin_auth.py
from flask import Blueprint, request, jsonify, make_response, g
from app.services.admin_auth_service import login, logout, get_current_admin
from app.utils.session_utils import refresh_session
from app.logger import get_logger
from app.middlewares.admin_auth_middleware import require_admin_auth

log = get_logger(__name__)
admin_auth_bp = Blueprint('admin_auth', __name__, url_prefix='/api/admin')

@admin_auth_bp.route('/login', methods=['POST'])
def admin_login():
    data = request.get_json(silent=True) or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    ip = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0].strip()
    user_agent = request.headers.get('User-Agent', '')

    success, admin_data, session_id_or_msg = login(username, password, ip, user_agent)

    if not success:
        return jsonify({"error": session_id_or_msg}), 401

    resp = make_response(jsonify({
        "message": "Login successful",
        "admin": admin_data
    }), 200)
    resp.set_cookie(
        'admin_session_id',
        session_id_or_msg,
        httponly=True,
        secure= False, #True,  # Set False in local dev
        samesite='Lax',
        path= '/', #'/api/admin',
        max_age=24 * 3600
    )
    return resp

@admin_auth_bp.route('/logout', methods=['POST'])
@require_admin_auth
def admin_logout():
    logout(g.session_id)
    resp = make_response(jsonify({"message": "Logged out"}), 200)
    resp.delete_cookie('admin_session_id', path='/api/admin')
    return resp

@admin_auth_bp.route('/session', methods=['GET'])
@require_admin_auth
def admin_session():
    admin = get_current_admin()
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"admin": g.admin})

@admin_auth_bp.route('/refresh', methods=['POST'])
@require_admin_auth
def admin_refresh():
    try:
        refresh_session(g.session_id)
        return jsonify({"message": "Session refreshed"})
    except Exception as e:
        log.error("refresh_failed", extra={"error": str(e)})
        return jsonify({"error": "Refresh failed"}), 500
