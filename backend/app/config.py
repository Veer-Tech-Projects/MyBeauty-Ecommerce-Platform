# backend/app/config.py
import os
from dataclasses import dataclass
from typing import Optional

try:
    # optional: won’t error if not installed; useful locally
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass


@dataclass(frozen=True)
class Settings:
    # App
    APP_ENV: str = os.getenv("APP_ENV", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # DB (MySQL/MariaDB)
    DB_HOST: str = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_NAME: str = os.getenv("DB_NAME", "ecommerce")
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")

    # Razorpay
    RAZORPAY_KEY_ID: Optional[str] = os.getenv("RAZORPAY_KEY_ID") or None
    RAZORPAY_KEY_SECRET: Optional[str] = os.getenv("RAZORPAY_KEY_SECRET") or None

    # Delhivery
    DELHIVERY_API_KEY: Optional[str] = os.getenv("DELHIVERY_API_KEY") or None
    DELHIVERY_API_URL: str = os.getenv("DELHIVERY_API_URL", "https://api.delhivery.com")

    # Webhook secrets (Razorpay)
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = os.getenv("RAZORPAY_WEBHOOK_SECRET") or None

    # Security / idempotency
    IDEMPOTENCY_TTL_SEC: int = int(os.getenv("IDEMPOTENCY_TTL_SEC", "86400"))

    # Connection pool
    DB_POOL_NAME: str = os.getenv("DB_POOL_NAME", "app_pool")
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "10"))

    # Misc
    REQUEST_LOG_SAMPLE_RATE: float = float(os.getenv("REQUEST_LOG_SAMPLE_RATE", "1.0"))
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL") or None

settings = Settings()

