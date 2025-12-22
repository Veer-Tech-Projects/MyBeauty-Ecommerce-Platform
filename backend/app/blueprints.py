# backend/app/blueprints.py
import logging
from flask import Flask

log = logging.getLogger(__name__)

def register_blueprints(app: Flask):
    """
    Centralized blueprint registration.
    """
    
    # --- 1. Register NEW Enterprise Modules ---
    try:
        from app.modules.auth.controllers import auth_bp
        app.register_blueprint(auth_bp)
        log.info("Registered Enterprise Module: Auth")
    except ImportError as e:
        log.critical(f"Failed to register Auth Module: {e}")
        raise e
    
    try:
        from app.modules.user.controller import user_bp
        app.register_blueprint(user_bp)
        log.info("Registered Enterprise Module: User Profile")
    except ImportError as e:
        log.critical(f"Failed to register User Profile: {e}")
        raise e
    
    try:
        from app.modules.user.address import address_bp
        app.register_blueprint(address_bp, url_prefix='/api/addresses')
        log.info("Registered Enterprise Module: Addresses")
    except ImportError as e:
        log.critical(f"Failed to register Addresses: {e}")
        raise e
    
    try:
        from app.modules.admin.auth import auth_bp as admin_auth_bp
        app.register_blueprint(admin_auth_bp)
        log.info("Registered Enterprise Module: Admin Auth")
    except ImportError as e:
        log.critical(f"Failed to register Admin Auth: {e}")
        raise e

    # --- 2. Register Legacy Routes ---
    # We removed the try/except block so we can SEE errors if they happen
    
    legacy_modules = [
        ('app.routes.cart_routes', 'cart_bp'),
        ('app.routes.product_routes', 'products_bp'),
        ('app.routes.admin_products', 'admin_products'),
        ('app.routes.admin_dashboard', 'admin_dashboard_bp'),
    ]

    for module_path, bp_name in legacy_modules:
        mod = __import__(module_path, fromlist=[bp_name])
        bp = getattr(mod, bp_name)
        app.register_blueprint(bp)
        log.info(f"Registered Legacy Blueprint: {bp_name}")