"""DateTime utility functions."""

from datetime import datetime, timezone
from typing import Optional


def get_current_utc() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)


def get_current_timestamp() -> int:
    """Get current UTC timestamp."""
    return int(get_current_utc().timestamp())


def format_datetime(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """Format datetime to string."""
    return dt.strftime(format_str)


def parse_datetime(date_str: str, format_str: str = "%Y-%m-%d %H:%M:%S") -> Optional[datetime]:
    """Parse string to datetime."""
    try:
        return datetime.strptime(date_str, format_str)
    except ValueError:
        return None


def to_iso_format(dt: datetime) -> str:
    """Convert datetime to ISO format string."""
    return dt.isoformat()