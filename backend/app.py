# app.py

import os
import traceback
from app import create_app
from app.logger import get_logger

log = get_logger(__name__)

app = create_app()

# Health check (prod monitoring)
@app.route('/health')
def health():
    return {'status': 'healthy', 'debug': app.config['DEBUG']}, 200

if __name__ == "__main__":
    # Env safety: Warn if no secret
    if not os.getenv("FLASK_SECRET_KEY"):
        log.warning("FLASK_SECRET_KEY not set - using fallback (insecure for prod)")
    app.run(host="0.0.0.0", port=5000, debug=app.config['DEBUG'])  # Use config DEBUG