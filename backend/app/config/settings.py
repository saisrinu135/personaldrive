from pydantic_settings import BaseSettings
from typing import List
from dotenv import load_dotenv
from functools import lru_cache
import os

load_dotenv()

class Settings(BaseSettings):
    class Config:
        env_file = '.env'
        case_sensitive = True
    
    # App
    APP_NAME: str = "CloudVault"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://cloudstorage_user:cloudstorage_pass@localhost:5432/cloudstorage_db")

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRY_HOURS: int = 24

    # Encryption
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "your-encryption-key-32-chars-long")

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

@lru_cache()
def get_settings() -> Settings:
    return Settings()