# backend/app/celery_worker.py
from app import create_app

# 1. Initialize Flask App
flask_app = create_app()

# 2. Expose Celery instance for the worker CLI
# The worker process looks for this variable named 'celery'
celery = flask_app.celery

if __name__ == "__main__":
    # Windows/Memurai Support
    print("----------------------------------------------------------------")
    print(" STARTING CELERY WORKER (Windows/Memurai Mode) ")
    print(" Ensure Memurai is running: redis-cli ping")
    print("----------------------------------------------------------------")
    
    # We use argv to simulate the command line arguments for debugging if run directly
    import sys
    sys.argv = [
        'celery', 
        '-A', 'app.celery_worker.celery', 
        'worker', 
        '--pool=solo',  # CRITICAL FOR WINDOWS
        '--loglevel=info'
    ]
    
    from celery.__main__ import main
    main()