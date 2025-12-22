from flask import Blueprint, request, jsonify, make_response, g
from .schema import AdminLoginSchema
from .services import AdminAuthService
from .middleware import require_admin_auth
from app.shared.config import settings

auth_bp = Blueprint('admin_auth_v2', __name__, url_prefix='/api/admin')

@auth_bp.route('/login', methods=['POST'])
def login():
    # 1. Validate Input
    try:
        data = AdminLoginSchema(**request.get_json())
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    ip = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0].strip()
    ua = request.headers.get('User-Agent', 'unknown')

    # 2. Attempt Login
    success, session, msg = AdminAuthService.login(data.username, data.password, ip, ua)
    
    if not success:
        return jsonify({"error": msg}), 401

    # 3. Set Cookies (The Security Payload)
    resp = make_response(jsonify({
        "message": "Login successful",
        "admin": {k:v for k,v in session.items() if k in ['username', 'name', 'role']}
    }))

    # Cookie 1: Session (HttpOnly)
    resp.set_cookie(
        'admin_session_id',
        session['session_id'],
        httponly=True,
        secure=settings.APP_ENV == 'production', # True in Prod
        samesite='Lax',
        path='/',
        max_age=86400
    )

    # Cookie 2: CSRF (Readable by JS)
    resp.set_cookie(
        'admin_csrf_token',
        session['csrf_token'],
        httponly=False, # Must be readable by JS to send in header
        secure=settings.APP_ENV == 'production',
        samesite='Lax',
        path='/',
        max_age=86400
    )

    return resp

@auth_bp.route('/session', methods=['GET'])
@require_admin_auth
def get_session_info():
    return jsonify({"admin": g.admin})

@auth_bp.route('/logout', methods=['POST'])
@require_admin_auth
def logout():
    AdminAuthService.logout(g.session_id)
    resp = make_response(jsonify({"message": "Logged out"}))
    resp.delete_cookie('admin_session_id', path='/')
    resp.delete_cookie('admin_csrf_token', path='/')
    return resp