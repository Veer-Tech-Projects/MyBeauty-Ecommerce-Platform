# backend/app/middlewares/admin_auth_middleware.py
from functools import wraps
from flask import request, g, current_app, jsonify, make_response
from app.utils.session_utils import get_session
from app.services.admin_auth_service import get_current_admin
from app.logger import get_logger

log = get_logger(__name__)

def require_admin_auth(f):
    """
    Decorator for admin-protected routes.
    - Reads `admin_session_id` cookie
    - Validates session (Redis + DB fallback)
    - Attaches `g.admin`, `g.session_id`
    - Auto-refreshes last_seen (sliding 30 min)
    - Returns 401 if invalid
    """
    @wraps(f)
    def decorator(*args, **kwargs):
        session_id = request.cookies.get('admin_session_id')
        if not session_id:
            log.info("admin_access_denied", extra={"reason": "no_cookie", "path": request.path})
            resp = make_response(jsonify({"error": "Authentication required"}), 401)
            resp.delete_cookie('admin_session_id', path='/api/admin')
            return resp

        session = get_session(session_id)
        if not session:
            log.info("admin_access_denied", extra={"reason": "invalid_session", "session_id": session_id})
            resp = make_response(jsonify({"error": "Session expired or invalid"}), 401)
            resp.delete_cookie('admin_session_id', path='/api/admin')
            return resp

        # Optional: IP/UA binding (strict mode)
        client_ip = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0].strip()
        if session['login_ip'] != client_ip:
            log.warning("admin_ip_mismatch", extra={
                "session_id": session_id,
                "stored_ip": session['login_ip'],
                "client_ip": client_ip
            })
            # For now: allow (future: force re-login)

        # Attach to Flask's `g`
        g.session_id = session_id
        g.admin = {
            "admin_id": session["admin_id"],
            "username": session.get("username"),
            "name": session.get("name"),
            "role": session.get("role")
        }

        log.debug("admin_request_authorized", extra={
            "admin_id": g.admin["admin_id"],
            "session_id": session_id,
            "path": request.path,
            "method": request.method
        })

        return f(*args, **kwargs)
    return decorator