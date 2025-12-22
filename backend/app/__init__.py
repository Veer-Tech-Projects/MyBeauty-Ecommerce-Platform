import logging
import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask.json.provider import DefaultJSONProvider
from decimal import Decimal
import firebase_admin
from firebase_admin import credentials

from app.shared.config import settings
from app.shared.logging_config import configure_logging
from app.blueprints import register_blueprints
from app.shared.celery_core import make_celery
from flask import send_from_directory

class CustomJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

def create_app():
    # 1. Initialize Logging
    configure_logging()
    log = logging.getLogger(__name__)

    # 2. Create Flask App
    app = Flask(__name__, static_url_path="/static", static_folder="static")
    
    # 3. Load Config
    app.config["DEBUG"] = settings.DEBUG
    app.config["SECRET_KEY"] = settings.FLASK_SECRET_KEY
    app.config["JWT_SECRET_KEY"] = settings.JWT_SECRET_KEY
    app.config["JWT_TOKEN_LOCATION"] = settings.JWT_TOKEN_LOCATION
    app.config["JWT_COOKIE_SECURE"] = settings.JWT_COOKIE_SECURE
    app.config["JWT_COOKIE_CSRF_PROTECT"] = settings.JWT_COOKIE_CSRF_PROTECT
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = settings.JWT_ACCESS_TOKEN_EXPIRES
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = settings.JWT_REFRESH_TOKEN_EXPIRES
    
    # 4. Initialize Extensions
    # Enterprise Fix: Load Origins from Config
    CORS(
        app,
        resources={r"/api/*": {"origins": settings.CORS_ORIGINS}},
        supports_credentials=True,
        expose_headers=["Content-Type","Authorization", "X-CSRF-TOKEN"],
        allow_headers=["Content-Type", "Authorization", "Idempotency-Key", "X-Razorpay-Signature", "X-CSRF-TOKEN"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )
    
    JWTManager(app)
    app.json_provider_class = CustomJSONProvider
    app.celery = make_celery(app)

    # 5. Initialize Firebase
    # Enterprise Fix: Load Path from Config
    if not firebase_admin._apps:
        try:
            cred_path = settings.FIREBASE_CRED_PATH
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                log.info("Firebase initialized successfully")
            else:
                log.warning(f"Firebase credentials not found at {cred_path}. Auth relying on Firebase will fail.")
        except Exception as e:
             log.error(f"Failed to initialize Firebase: {e}")

    # 6. Register Blueprints
    register_blueprints(app)

    # 7. Health Check
    @app.route('/health')
    def health():
        return {"status": "healthy", "env": settings.APP_ENV}, 200

    log.info(f"Application starting in {settings.APP_ENV} mode")

    @app.route('/static/uploads/<path:filename>')
    def serve_uploads(filename):
        # This points to your actual upload folder. 
        # Adjust 'static/uploads' if your folder is named differently in config.
        # We assume settings.UPLOAD_FOLDER points here.
        upload_folder = os.path.join(app.root_path, 'static', 'uploads')
        return send_from_directory(upload_folder, filename)
    
    return app