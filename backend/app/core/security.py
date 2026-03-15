from passlib.context import CryptContext
from cryptography.fernet import Fernet
from app.config.settings import get_settings
import secrets

settings = get_settings()

# Use argon2 instead of bcrypt to avoid 72-byte limitation
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__rounds=4,
    argon2__memory_cost=65536,
    argon2__parallelism=1
)


def generate_encryption_key() -> bytes:
    """Generate Fernet encryption key."""
    return Fernet.generate_key()


def hash_password(password: str) -> str:
    """Hash password using argon2."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using argon2."""
    return pwd_context.verify(plain_password, hashed_password)


def encrypt_secret(value: str, key: bytes) -> str:
    """Encrypt a sensitive string using Fernet."""
    f = Fernet(key)
    return f.encrypt(value.encode()).decode()


def decrypt_secret(encrypted_value: str, key: bytes) -> str:
    """Decrypt a Fernet-encrypted string."""
    f = Fernet(key)
    return f.decrypt(encrypted_value.encode()).decode()


def generate_secure_token(length: int = 32) -> str:
    """Generate a secure random token."""
    return secrets.token_urlsafe(length)


def generate_api_key() -> str:
    """Generate API key."""
    return f"ak_{generate_secure_token(24)}"