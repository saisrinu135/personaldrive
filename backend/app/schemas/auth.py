from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from app.schemas.user import UserResponse

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class LoginResponse(TokenResponse):
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="Refresh token")

class LogoutRequest(BaseModel):
    refresh_token: str = Field(..., description="Refresh token to invalidate")

class TokenPayload(BaseModel):
    user_id: str
    user_role: str
    exp: int
    type: str