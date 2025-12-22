import logging
import sys
from pythonjsonlogger import jsonlogger
from app.shared.config import settings

def configure_logging():
    """Configures the root logger with JSON formatting."""
    logger = logging.getLogger()
    
    # Remove default handlers
    for handler in logger.handlers:
        logger.removeHandler(handler)
    
    # Set level based on config
    logger.setLevel(settings.LOG_LEVEL)

    # Console Handler with JSON formatting
    handler = logging.StreamHandler(sys.stdout)
    
    formatter = jsonlogger.JsonFormatter(
        fmt='%(asctime)s %(levelname)s %(name)s %(message)s %(pathname)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    # Suppress noisy libraries
    logging.getLogger("werkzeug").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)

    return logger

# ✅ NEW: Add this helper function so imports work
def get_logger(name):
    """Factory function to get a logger with the module name."""
    return logging.getLogger(name)