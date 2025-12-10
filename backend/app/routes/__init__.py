# ---------------- Import all blueprints ----------------
from .auth_routes import auth_bp
from .cart_routes import cart_bp
from app.routes.admin_products import admin_products
from .product_routes import products_bp
from app.routes.admin_auth import admin_auth_bp
from app.routes.admin_dashboard import admin_dashboard_bp

# ---------------- Central list of all blueprints ----------------
all_blueprints = [
    auth_bp,
    cart_bp,
    admin_products,
    products_bp,
    admin_auth_bp,
    admin_dashboard_bp,
]
