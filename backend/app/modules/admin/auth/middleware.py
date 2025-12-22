from functools import wraps
from flask import request, g, jsonify, make_response
from .services import AdminAuthService

def require_admin_auth(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        # 1. Cookie Check (Session)
        session_id = request.cookies.get('admin_session_id')
        if not session_id:
            return _unauthorized("Authentication required")

        # 2. Session Validation
        session = AdminAuthService.get_session(session_id)
        if not session:
            resp = make_response(jsonify({"error": "Session expired"}))
            resp.status_code = 401
            # Clean up dead cookies
            resp.delete_cookie('admin_session_id', path='/')
            resp.delete_cookie('admin_csrf_token', path='/')
            return resp

        # 3. CSRF Check (Double-Submit Cookie Pattern)
        # AUDIT FIX: Explicitly exempt the login endpoint to avoid Chicken-Egg problem
        CSRF_EXEMPT_PATHS = ["/api/admin/login"]

        # Only enforce on mutating methods (POST, PUT, DELETE, PATCH)
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            # Skip check if path is in exempt list
            if request.path not in CSRF_EXEMPT_PATHS:
                header_token = request.headers.get('X-CSRF-TOKEN')
                cookie_token = request.cookies.get('admin_csrf_token')
                
                # Strict Match: Header must equal Cookie
                if not header_token or not cookie_token or header_token != cookie_token:
                     return _unauthorized("CSRF Validation Failed")

        # 4. Attach to Context
        g.admin = session
        g.session_id = session_id
        
        return f(*args, **kwargs)
    return decorator

def _unauthorized(msg):
    return jsonify({"error": msg}), 401