import logging
from pythonjsonlogger import jsonlogger
from logging.handlers import QueueHandler
from queue import Queue

# Global logger
logger = logging.getLogger('app')
logger.setLevel(logging.DEBUG)  # Lower to DEBUG for development

# Queue for non-blocking logging
log_queue = Queue(maxsize=10000)  # Buffer 10k events
handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    fmt='%(asctime)s %(levelname)s %(name)s %(message)s %(request_id)s %(user_id)s %(event_type)s %(status)s %(extra)s %(error)s %(trace)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
handler.setFormatter(formatter)
handler.setLevel(logging.DEBUG)  # Ensure handler captures DEBUG logs
queue_handler = QueueHandler(log_queue)
queue_handler.setLevel(logging.DEBUG)  # Ensure queue captures DEBUG logs
logger.addHandler(queue_handler)

def get_logger(name):
    return logging.getLogger(name)