# app/celery_app.py
from celery import Celery, Task
import os
from app.logger import get_logger

log = get_logger(__name__)

def make_celery(app=None):
    """
    Create Celery instance. If `app` (Flask app) is provided, tasks will run inside Flask app context.
    If app is None, Celery is still created and usable (no Flask context will be entered automatically).
    """
    broker = os.getenv("CELERY_BROKER_URL") or os.getenv("REDIS_URL") or "redis://localhost:6379/0"
    backend = os.getenv("CELERY_RESULT_BACKEND") or broker
    name = app.import_name if app else "app"
    celery = Celery(name, broker=broker, backend=backend, include=['app.tasks'])

    celery.conf.update({
        "task_serializer": "json",
        "accept_content": ["json"],
        "result_serializer": "json",
        "timezone": "UTC",
        "enable_utc": True,
        # beat schedule can be set here when desired
        "beat_schedule": {
            #"sweep-expired-reservations-every-5-mins": {"task": "app.tasks.sweep_expired_reservations", "schedule": 300.0},
            "sweep-payment-attempts-every-hour": {"task": "app.tasks.sweep_payment_attempts", "schedule": 3600.0}, 
            "drain-log-queue-every-5min": {"task": "app.tasks.drain_log_queue", "schedule": 300.0},
            "sweep-admin-sessions-every-5min": {
                "task": "app.tasks.admin_session_sweep.sweep_expired_admin_sessions",
                "schedule": 300.0  # 5 minutes
            },
            "cleanup-admin-sessions-daily": {
                "task": "app.tasks.admin_cleanup.cleanup_old_admin_sessions",
                "schedule": 86400.0,  # Daily at ~2 AM UTC
            },
            "cleanup-login-attempts-daily": {
                "task": "app.tasks.admin_cleanup.cleanup_old_login_attempts",
                "schedule": 86400.0,
            }
        }
    })

    class ContextTask(Task):
        """Optional Flask context wrapper; will use app.app_context() only if app provided."""
        def __call__(self, *args, **kwargs):
            if app:
                with app.app_context():
                    return self.run(*args, **kwargs)
            return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery
