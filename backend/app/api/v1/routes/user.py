from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.config.database import get_db
from app.services.user import UserService
from app.core.deps import CurrentUser, CurrentAdminUser
from app.schemas.user import (
    RegisterRequest, UserResponse, UserUpdateRequest, 
    AdminUserCreateRequest, ChangePasswordRequest
)
from app.schemas.common import APIResponse

router = APIRouter(prefix="/users", tags=["Users"])

# Public endpoints
@router.post("/register", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register new user"""
    user_service = UserService(db)
    user = await user_service.register(request)
    user_data = UserResponse.from_orm(user)
    
    return APIResponse(
        status=True,
        message="User registered successfully",
        data=user_data
    )

# User endpoints (authenticated)
@router.get("/profile", response_model=APIResponse)
async def get_my_profile(current_user: CurrentUser):
    """Get current user profile"""
    user_data = UserResponse.from_orm(current_user)
    return APIResponse(
        status=True,
        message="Profile retrieved successfully",
        data=user_data
    )

@router.put("/profile", response_model=APIResponse)
async def update_my_profile(
    request: UserUpdateRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db)
):
    """Update current user profile"""
    user_service = UserService(db)
    user = await user_service.update_user(str(current_user.id), request, current_user)
    user_data = UserResponse.from_orm(user)
    
    return APIResponse(
        status=True,
        message="Profile updated successfully",
        data=user_data
    )

@router.put("/change-password", response_model=APIResponse)
async def change_my_password(
    request: ChangePasswordRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db)
):
    """Change current user password"""
    user_service = UserService(db)
    result = await user_service.change_password(str(current_user.id), request, current_user)
    
    return APIResponse(
        status=True,
        message=result["message"],
        data=None
    )

# Admin endpoints
@router.get("/", response_model=APIResponse)
async def list_users(
    current_user: CurrentAdminUser,
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None)
):
    """List all users (Admin only)"""
    user_service = UserService(db)
    result = await user_service.list_users(page, limit, search)
    
    # Convert users to schema
    users_data = [UserResponse.from_orm(user) for user in result["users"]]
    
    return APIResponse(
        status=True,
        message="Users retrieved successfully",
        data={
            "users": users_data,
            "total": result["total"],
            "page": result["page"],
            "limit": result["limit"],
            "total_pages": result["total_pages"]
        }
    )

@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: AdminUserCreateRequest,
    current_user: CurrentAdminUser,
    db: AsyncSession = Depends(get_db)
):
    """Create user (Admin only)"""
    user_service = UserService(db)
    user = await user_service.create_user_by_admin(request)
    user_data = UserResponse.from_orm(user)
    
    return APIResponse(
        status=True,
        message="User created successfully",
        data=user_data
    )

@router.get("/{user_id}", response_model=APIResponse)
async def get_user(
    user_id: str,
    current_user: CurrentAdminUser,
    db: AsyncSession = Depends(get_db)
):
    """Get user by ID (Admin only)"""
    user_service = UserService(db)
    user = await user_service.get_user_profile(user_id, current_user)
    user_data = UserResponse.from_orm(user)
    
    return APIResponse(
        status=True,
        message="User retrieved successfully",
        data=user_data
    )

@router.put("/{user_id}", response_model=APIResponse)
async def update_user(
    user_id: str,
    request: UserUpdateRequest,
    current_user: CurrentAdminUser,
    db: AsyncSession = Depends(get_db)
):
    """Update user (Admin only)"""
    user_service = UserService(db)
    user = await user_service.update_user(user_id, request, current_user)
    user_data = UserResponse.from_orm(user)
    
    return APIResponse(
        status=True,
        message="User updated successfully",
        data=user_data
    )

@router.put("/{user_id}/activate", response_model=APIResponse)
async def activate_user(
    user_id: str,
    current_user: CurrentAdminUser,
    db: AsyncSession = Depends(get_db)
):
    """Activate user (Admin only)"""
    user_service = UserService(db)
    user = await user_service.activate_user(user_id)
    user_data = UserResponse.from_orm(user)
    
    return APIResponse(
        status=True,
        message="User activated successfully",
        data=user_data
    )

@router.put("/{user_id}/deactivate", response_model=APIResponse)
async def deactivate_user(
    user_id: str,
    current_user: CurrentAdminUser,
    db: AsyncSession = Depends(get_db)
):
    """Deactivate user (Admin only)"""
    user_service = UserService(db)
    user = await user_service.deactivate_user(user_id)
    user_data = UserResponse.from_orm(user)
    
    return APIResponse(
        status=True,
        message="User deactivated successfully",
        data=user_data
    )

@router.delete("/{user_id}", response_model=APIResponse)
async def delete_user(
    user_id: str,
    current_user: CurrentAdminUser,
    db: AsyncSession = Depends(get_db)
):
    """Delete user (Admin only)"""
    user_service = UserService(db)
    result = await user_service.delete_user(user_id)
    
    return APIResponse(
        status=True,
        message=result["message"],
        data=None
    )

@router.put("/{user_id}/change-password", response_model=APIResponse)
async def change_user_password(
    user_id: str,
    request: ChangePasswordRequest,
    current_user: CurrentAdminUser,
    db: AsyncSession = Depends(get_db)
):
    """Change user password (Admin only)"""
    user_service = UserService(db)
    result = await user_service.change_password(user_id, request, current_user)
    
    return APIResponse(
        status=True,
        message=result["message"],
        data=None
    )