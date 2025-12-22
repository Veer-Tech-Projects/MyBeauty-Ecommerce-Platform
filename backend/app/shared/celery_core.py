from celery import Celery, Task
from flask import Flask
from app.shared.config import settings

def make_celery(app: Flask) -> Celery:
    """
    Initializes Celery with Flask Context.
    """
    celery = Celery(
        app.import_name,
        broker=settings.REDIS_URL,
        backend=settings.REDIS_URL,
        # Enterprise: Explicitly include task modules so workers find them
        include=['app.jobs.maintenance', 'app.jobs.email_tasks'] 
    )

    # 1. Apply Standard Config
    celery.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        broker_connection_retry_on_startup=True,
    )

    # 2. Flask Context Task Wrapper
    # This ensures every task has access to 'app.config', 'current_app', etc.
    class ContextTask(Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask

    # 3. Define Periodic Tasks (Cron)
    # We define them here centrally for visibility
    celery.conf.beat_schedule = {
        
        "cleanup-admin-sessions-daily": {
            "task": "app.jobs.maintenance.cleanup_admin_sessions",
            "schedule": 86400.0, # 24 hours
        },
        "cleanup-login-attempts-daily": {
            "task": "app.jobs.maintenance.cleanup_login_attempts",
            "schedule": 86400.0, # 24 hours
        }
    }

    return celery