from flask import jsonify, Response
from typing import Any, Optional

def success_response(message: str, data: Any = None, status_code: int = 200) -> Response:
    """Standard success response format."""
    payload = {
        "status": "success",
        "message": message,
        "data": data
    }
    return jsonify(payload), status_code

def error_response(message: str, error_code: str = "ERROR", status_code: int = 400, details: Any = None) -> Response:
    """Standard error response format."""
    payload = {
        "status": "error",
        "error_code": error_code,
        "message": message,
        "details": details
    }
    return jsonify(payload), status_code