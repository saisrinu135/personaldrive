import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from typing import Optional

from app.config.settings import get_settings

settings = get_settings()

# Create logs directory if it doesn't exist
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

# Define log format
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

def setup_logging():
    """Setup logging configuration for the application"""
    
    # Set root logger level
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Create formatter
    formatter = logging.Formatter(LOG_FORMAT, DATE_FORMAT)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # File handler for general logs
    file_handler = RotatingFileHandler(
        LOGS_DIR / "app.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)
    
    # Error file handler
    error_handler = RotatingFileHandler(
        LOGS_DIR / "error.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    root_logger.addHandler(error_handler)
    
    # API access log handler
    api_handler = RotatingFileHandler(
        LOGS_DIR / "api.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    api_handler.setLevel(logging.INFO)
    api_handler.setFormatter(formatter)
    
    # Create API logger
    api_logger = logging.getLogger("api")
    api_logger.addHandler(api_handler)
    api_logger.setLevel(logging.INFO)
    api_logger.propagate = False  # Don't propagate to root logger
    
    # Database logger
    db_handler = RotatingFileHandler(
        LOGS_DIR / "database.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    db_handler.setLevel(logging.INFO)
    db_handler.setFormatter(formatter)
    
    db_logger = logging.getLogger("database")
    db_logger.addHandler(db_handler)
    db_logger.setLevel(logging.INFO)
    db_logger.propagate = False
    
    # Storage operations logger
    storage_handler = RotatingFileHandler(
        LOGS_DIR / "storage.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    storage_handler.setLevel(logging.INFO)
    storage_handler.setFormatter(formatter)
    
    storage_logger = logging.getLogger("storage")
    storage_logger.addHandler(storage_handler)
    storage_logger.setLevel(logging.INFO)
    storage_logger.propagate = False
    
    # Suppress some noisy loggers in production
    if not settings.DEBUG:
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    # Force AWS/S3 dependencies to only emit ERRORs to clear up the terminal
    for noisy_logger in ["boto3", "botocore", "urllib3", "s3transfer"]:
        logging.getLogger(noisy_logger).setLevel(logging.ERROR)

def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the specified name"""
    return logging.getLogger(name)

def get_api_logger() -> logging.Logger:
    """Get the API logger instance"""
    return logging.getLogger("api")

def get_db_logger() -> logging.Logger:
    """Get the database logger instance"""
    return logging.getLogger("database")

def get_storage_logger() -> logging.Logger:
    """Get the storage logger instance"""
    return logging.getLogger("storage")

# Utility functions for structured logging
def log_api_request(logger: logging.Logger, method: str, path: str, user_id: Optional[str] = None, **kwargs):
    """Log API request with structured data"""
    extra_data = {
        "method": method,
        "path": path,
        "user_id": user_id,
        **kwargs
    }
    logger.info(f"API Request: {method} {path}", extra=extra_data)

def log_api_response(logger: logging.Logger, method: str, path: str, status_code: int, 
                    response_time: float, user_id: Optional[str] = None, **kwargs):
    """Log API response with structured data"""
    extra_data = {
        "method": method,
        "path": path,
        "status_code": status_code,
        "response_time": response_time,
        "user_id": user_id,
        **kwargs
    }
    logger.info(f"API Response: {method} {path} - {status_code} ({response_time:.3f}s)", extra=extra_data)

def log_error(logger: logging.Logger, error: Exception, context: str = "", **kwargs):
    """Log error with context and structured data"""
    extra_data = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "context": context,
        **kwargs
    }
    logger.error(f"Error in {context}: {type(error).__name__}: {str(error)}", extra=extra_data, exc_info=True)

def log_storage_operation(logger: logging.Logger, operation: str, provider_id: str, 
                         user_id: str, file_key: Optional[str] = None, **kwargs):
    """Log storage operations"""
    extra_data = {
        "operation": operation,
        "provider_id": provider_id,
        "user_id": user_id,
        "file_key": file_key,
        **kwargs
    }
    logger.info(f"Storage Operation: {operation} - Provider: {provider_id}", extra=extra_data)

def log_db_operation(logger: logging.Logger, operation: str, table: str, 
                    user_id: Optional[str] = None, **kwargs):
    """Log database operations"""
    extra_data = {
        "operation": operation,
        "table": table,
        "user_id": user_id,
        **kwargs
    }
    logger.info(f"DB Operation: {operation} on {table}", extra=extra_data)