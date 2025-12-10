# backend/app/routes/admin_dashboard.py
from flask import Blueprint, jsonify, g
from app.middlewares.admin_auth_middleware import require_admin_auth
from app.logger import get_logger

log = get_logger(__name__)
admin_dashboard_bp = Blueprint('admin_dashboard', __name__, url_prefix='/api/admin')

@admin_dashboard_bp.route('/dashboard', methods=['GET'])
@require_admin_auth
def get_dashboard():
    admin = g.admin
    return jsonify({
        "message": "Welcome to Admin Dashboard",
        "admin": {
            "id": admin["admin_id"],
            "username": admin["username"],
            "name": admin["name"],
            "role": admin["role"]
        },
        "features": ["orders", "products", "analytics", "settings"]
    }), 200