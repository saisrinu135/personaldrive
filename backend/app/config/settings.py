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
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "cloudstorage_user")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "cloudstorage_pass")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "cloudstorage")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"  

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRY_HOURS: int = 24

    # Encryption
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY")

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

@lru_cache()
def get_settings() -> Settings:
    return Settings()