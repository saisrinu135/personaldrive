from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.services.auth import AuthService
from app.core.deps import CurrentUser
from app.schemas.auth import LoginRequest, RefreshTokenRequest, LogoutRequest
from app.schemas.user import UserResponse
from app.schemas.common import APIResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=APIResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """User login"""
    auth_service = AuthService(db)
    result = await auth_service.authenticate(request.email, request.password)

    # Convert user to schema
    user_data = UserResponse.from_orm(result["user"])

    return APIResponse(
        status=True,
        message="Login successful",
        data={
            "access_token": result["access_token"],
            "refresh_token": result["refresh_token"],
            "token_type": result["token_type"],
            "expires_in": result["expires_in"],
            "user": user_data
        }
    )


@router.post("/refresh", response_model=APIResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token"""
    auth_service = AuthService(db)
    result = await auth_service.refresh_token(request.refresh_token)

    return APIResponse(
        status=True,
        message="Token refreshed successfully",
        data=result
    )


@router.post("/logout", response_model=APIResponse)
async def logout(request: LogoutRequest):
    """User logout (client should discard tokens)"""
    # In a production app, you might want to blacklist the refresh token
    return APIResponse(
        status=True,
        message="Successfully logged out",
        data=None
    )


@router.get("/me", response_model=APIResponse)
async def get_current_user_info(current_user: CurrentUser):
    """Get current user information"""
    user_data = UserResponse.from_orm(current_user)
    return APIResponse(
        status=True,
        message="User information retrieved successfully",
        data=user_data
    )
