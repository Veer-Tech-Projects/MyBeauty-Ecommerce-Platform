from app import create_app
from app.celery_app import make_celery

flask_app = create_app()
celery = make_celery(flask_app)

if __name__ == '__main__':
    # Windows safe: --pool=solo (single-thread, no spawn crash)
    # Run worker: celery -A app.celery_worker.celery worker --loglevel=info --pool=solo
    # Run beat: celery -A app.celery_worker.celery beat --loglevel=info
    celery.worker_main(['celery', '-A', 'app.celery_worker.celery', 'worker', '--loglevel=INFO', '--pool=solo'])