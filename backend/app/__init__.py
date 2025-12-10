import os
from datetime import timedelta
from decimal import Decimal
from flask import Flask
from flask_cors import CORS
from flask_session import Session
from flask_jwt_extended import JWTManager
import firebase_admin
from firebase_admin import credentials
from app.routes import all_blueprints
from flask.json.provider import DefaultJSONProvider
from .celery_app import make_celery
from app.logger import get_logger, log_queue, handler
from logging.handlers import QueueListener
import logging

class CustomJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

def create_app():
    app = Flask(__name__, static_url_path="/static", static_folder="static")
    app.config['DEBUG'] = True
    app.config.update(
        SECRET_KEY=os.getenv("FLASK_SECRET_KEY", "fallback-secret-key"),
        SESSION_TYPE="filesystem",
        JWT_SECRET_KEY=os.getenv("JWT_SECRET", "super-secret-key"),
        JWT_TOKEN_LOCATION=["headers"],
        JWT_HEADER_NAME="Authorization",
        JWT_HEADER_TYPE="Bearer",
        JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=30),
        RAZORPAY_KEY_ID=os.getenv("RAZORPAY_KEY_ID"),
        RAZORPAY_KEY_SECRET=os.getenv("RAZORPAY_KEY_SECRET"),
    )
    
    # Extensions
    Session(app)
    JWTManager(app)

    # Firebase
    if not firebase_admin._apps:
        cred_path = os.getenv("FIREBASE_CRED_PATH", "firebase-adminsdk.json")
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

    # CORS
    CORS(
        app,
        resources={r"/api/*": {"origins": "http://localhost:5173"}},
        supports_credentials=True,
        expose_headers=["Authorization"],
        allow_headers=["Content-Type", "Authorization", "Idempotency-Key", "X-Razorpay-Signature"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # JSON Provider
    app.json_provider_class = CustomJSONProvider

    # Register Blueprints
    for bp in all_blueprints:
        app.register_blueprint(bp)

    celery = make_celery(app)
    app.celery = celery

    # Logging Setup
    log = get_logger(__name__)
    if app.debug:
        try:
            listener = QueueListener(log_queue, handler, respect_handler_level=True)
            listener.start()
            log.info("QueueListener started for dev logging", extra={"listener_mode": "dev"})
            # Ensure listener stops gracefully on app shutdown
            import atexit
            atexit.register(listener.stop)
        except Exception as e:
            log.error("QueueListener start failed – using direct handler", extra={"error": str(e)})
            logger = logging.getLogger('app')
            logger.addHandler(handler)  # Fallback to direct StreamHandler
    else:
        log.info("Production mode: Logs drained via Celery", extra={"listener_mode": "prod"})

    return app