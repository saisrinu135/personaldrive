from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.user import UserService
from app.core.security import verify_password
from app.config.settings import get_settings

settings = get_settings()

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_service = UserService(db)

    def create_access_token(self, user_id: str, is_admin: bool) -> str:
        """Create JWT access token"""
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "user_id": str(user_id),
            "is_admin": is_admin,
            "exp": expire,
            "type": "access"
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def create_refresh_token(self, user_id: str, is_admin: bool) -> str:
        """Create JWT refresh token"""
        expire = datetime.utcnow() + timedelta(hours=settings.REFRESH_TOKEN_EXPIRY_HOURS)
        payload = {
            "user_id": str(user_id),
            "is_admin": is_admin,
            "exp": expire,
            "type": "refresh"
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def verify_token(self, token: str, token_type: str = "access") -> dict:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("type") != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

    async def authenticate(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user and return tokens"""
        user = await self.user_service.get_by_email(email, raise_exception=False)
        if not user or not verify_password(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )

        access_token = self.create_access_token(user.id, user.is_admin)
        refresh_token = self.create_refresh_token(user.id, user.is_admin)
        user.last_login = datetime.utcnow()
        self.db.add(user)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": user
        }

    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Generate new access token from refresh token"""
        payload = self.verify_token(refresh_token, "refresh")
        user = await self.user_service.get_by_id(payload["user_id"])
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )

        access_token = self.create_access_token(user.id, user.is_admin)
        new_refresh_token = self.create_refresh_token(user.id, user.is_admin)

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

    async def get_user_from_token(self, token: str):
        """Get user from access token - used by dependency"""
        payload = self.verify_token(token, "access")
        user = await self.user_service.get_by_id(payload["user_id"])
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        return user