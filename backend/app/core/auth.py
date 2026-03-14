from datetime import datetime, timedelta
from typing import Optional

from fastapi.security import HTTPBearer
from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from jwt import PyJWT, PyJWTError


from app.services.user import UserService
from app.config.settings import get_settings
from app.config.database import get_db

from app.services.auth import AuthService

settings = get_settings()


class TokenService(HTTPBearer):
    def __init__(self):
        super().__init__(auto_error=False)
        self.jwt = PyJWT()
    
    def _create_token(self, user_id: int, user_role: str, exp: datetime, type: str):
        payload = {
            "user_id": user_id,
            "user_role": user_role,
            "exp": exp.timestamp(),
            "type": type
        }
        return self.jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    def create_access_token(self, user_id: int, user_role: str):
        """
        Creates an access token for the given user
        """
        exp = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return self._create_token(user_id, user_role, exp, "access")

    def create_refresh_token(self, user_id: int, user_role: str):
        """
        Creates a refresh token for the given user
        """
        exp = datetime.utcnow() + timedelta(hours=settings.REFRESH_TOKEN_EXPIRY_HOURS)
        return self._create_token(user_id, user_role, exp, "refresh")

    def _verify_token(self, token: str):
        try:
            payload = self.jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id: int = payload.get("user_id")
            user_role: str = payload.get("user_role")
            token_type: str = payload.get("type")
            if user_id is None or user_role is None or token_type is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
            return {"user_id": user_id, "user_role": user_role, "type": token_type}
        except PyJWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    

    def verify_access_token(self, token: str):
        """
        Verify the access token and return the payload
        """
        payload = self._verify_token(token)
        if payload["type"] != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        return payload

    def verify_refresh_token(self, token: str):
        """
        Verify the refresh token and return the payload
        """
        payload = self._verify_token(token)
        if payload["type"] != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        return payload