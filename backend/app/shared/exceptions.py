class AppError(Exception):
    """Base class for all application errors."""
    def __init__(self, message: str, status_code: int = 500, details: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}

class AuthError(AppError):
    def __init__(self, message="Authentication failed", details=None):
        super().__init__(message, status_code=401, details=details)

class ValidationError(AppError):
    def __init__(self, message="Invalid input", details=None):
        super().__init__(message, status_code=400, details=details)

class DatabaseError(AppError):
    def __init__(self, message="Database operation failed", details=None):
        super().__init__(message, status_code=500, details=details)

class NotFoundError(AppError):
    def __init__(self, message="Resource not found", details=None):
        super().__init__(message, status_code=404, details=details)