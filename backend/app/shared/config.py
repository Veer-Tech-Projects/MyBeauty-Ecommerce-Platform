import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import validator

class Settings(BaseSettings):
    # --- Application Core ---
    APP_ENV: str = "development"
    DEBUG: bool = True
    FLASK_SECRET_KEY: str  # Required. App will fail if missing.
    LOG_LEVEL: str = "INFO"
    UPLOAD_FOLDER: str = os.path.join(os.getcwd(), "uploads")

    # NEW: CORS & External Configs
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    FIREBASE_CRED_PATH: str = "credentials.json"

    # --- Database (MySQL) ---
    DB_HOST: str = "localhost"
    DB_USER: str = "root"
    DB_PASSWORD: str = "veer@3815"
    DB_NAME: str = "ecommerce"
    DB_PORT: int = 3306
    DB_POOL_SIZE: int = 5
    DB_POOL_RECYCLE: int = 3600

    # --- Authentication (JWT) ---
    JWT_SECRET_KEY: str  # Required
    JWT_TOKEN_LOCATION: List[str] = ["cookies"]
    JWT_COOKIE_SECURE: bool = False  # Set to True in Production
    JWT_COOKIE_CSRF_PROTECT: bool = True
    JWT_ACCESS_TOKEN_EXPIRES: int = 3600  # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES: int = 2592000  # 30 days

    # --- Redis & Celery ---
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None

    # --- Third-Party Integrations ---
    # Razorpay
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = None
    
    # Delhivery
    DELHIVERY_API_KEY: Optional[str] = None
    DELHIVERY_API_URL: str = "https://api.delhivery.com"

    # --- Email Settings (SendGrid) ---
    SMTP_HOST: str = "smtp.sendgrid.net"
    SMTP_PORT: int = 587
    SMTP_USER: str = "apikey"
    SMTP_PASSWORD: str  # Mandatory from .env
    EMAILS_FROM_EMAIL: str = "no-reply@em506.derivedcampus.com" # Change this to your verified sender
    EMAILS_FROM_NAME: str = "Ecommerce Security"
    
    # Frontend URL for the link
    FRONTEND_URL: str = "http://localhost:5173"

    # --- Business Logic Constants ---
    IDEMPOTENCY_TTL_SEC: int = 86400  # 24 hours

    @validator("CELERY_BROKER_URL", pre=True, always=True)
    def set_celery_broker(cls, v, values):
        """Default Celery Broker to Redis URL if not set."""
        return v or values.get("REDIS_URL")

    @validator("CELERY_RESULT_BACKEND", pre=True, always=True)
    def set_celery_backend(cls, v, values):
        """Default Celery Backend to Redis URL if not set."""
        return v or values.get("REDIS_URL")

    class Config:
        env_file = ".env"
        case_sensitive = True

# Initialize Singleton
settings = Settings()