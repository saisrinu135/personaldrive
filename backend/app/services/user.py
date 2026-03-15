"""
UserService - Complete user management operations
"""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from typing import Optional, Dict, Any
import math

from app.models.user import User
from app.schemas.user import RegisterRequest, UserUpdateRequest, AdminUserCreateRequest, ChangePasswordRequest
from app.core.security import hash_password, verify_password

class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, user_id: str, raise_exception: bool = True) -> Optional[User]:
        """Get user by ID"""
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if raise_exception and not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found"
            )
        return user

    async def get_by_email(self, email: str, raise_exception: bool = True) -> Optional[User]:
        """Get user by email"""
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if raise_exception and not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found"
            )
        return user

    async def register(self, payload: RegisterRequest) -> User:
        """Register new user"""
        # Check if email already exists
        existing_user = await self.get_by_email(payload.email, raise_exception=False)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        user = User(
            email=payload.email,
            name=payload.name,
            password=hash_password(payload.password)
        )
        
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        
        return user

    async def create_user_by_admin(self, payload: AdminUserCreateRequest) -> User:
        """Create user by admin"""
        # Check if email already exists
        existing_user = await self.get_by_email(payload.email, raise_exception=False)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        user = User(
            email=payload.email,
            name=payload.name,
            password=hash_password(payload.password),
            is_admin=payload.is_admin,
            is_active=payload.is_active
        )
        
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        
        return user

    async def list_users(self, page: int = 1, limit: int = 10, search: Optional[str] = None) -> Dict[str, Any]:
        """List all users with pagination"""
        offset = (page - 1) * limit
        
        # Build query
        query = select(User)
        count_query = select(func.count(User.id))
        
        if search:
            search_filter = User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)
        
        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # Get users
        query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(query)
        users = result.scalars().all()
        
        total_pages = math.ceil(total / limit)
        
        return {
            "users": users,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }

    async def update_user(self, user_id: str, payload: UserUpdateRequest, current_user: User) -> User:
        """Update user profile"""
        user = await self.get_by_id(user_id)
        
        # Check permissions
        if not current_user.is_admin and current_user.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Check email uniqueness if updating email
        if payload.email and payload.email != user.email:
            existing_user = await self.get_by_email(payload.email, raise_exception=False)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        # Update fields
        update_data = {}
        if payload.name is not None:
            update_data["name"] = payload.name
        if payload.email is not None:
            update_data["email"] = payload.email
        
        if update_data:
            await self.db.execute(
                update(User).where(User.id == user_id).values(**update_data)
            )
            self.db.add(user)
        
        return user

    async def change_password(self, user_id: str, payload: ChangePasswordRequest, current_user: User) -> Dict[str, str]:
        """Change user password"""
        user = await self.get_by_id(user_id)
        
        # Check permissions
        if not current_user.is_admin and current_user.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Verify current password (skip for admin)
        if not current_user.is_admin or current_user.id == user.id:
            if not verify_password(payload.current_password, user.password):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Current password is incorrect"
                )
        
        # Update password
        await self.db.execute(
            update(User).where(User.id == user_id).values(
                password=hash_password(payload.new_password)
            )
        )
        self.db.add(user)
        
        return {"message": "Password updated successfully"}

    async def activate_user(self, user_id: str) -> User:
        """Activate user account"""
        user = await self.get_by_id(user_id)
        
        await self.db.execute(
            update(User).where(User.id == user_id).values(is_active=True)
        )
        self.db.add(User)
        
        return user

    async def deactivate_user(self, user_id: str) -> User:
        """Deactivate user account"""
        user = await self.get_by_id(user_id)
        
        await self.db.execute(
            update(User).where(User.id == user_id).values(is_active=False)
        )
        self.db.add(user)
        
        return user

    async def delete_user(self, user_id: str) -> Dict[str, str]:
        """Delete user account"""
        user = await self.get_by_id(user_id)
        await self.db.delete(user)
        await self.db.commit()
        return {"message": "User deleted successfully"}

    async def get_user_profile(self, user_id: str, current_user: User) -> User:
        """Get user profile"""
        user = await self.get_by_id(user_id)
        
        # Check permissions
        if not current_user.is_admin and current_user.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        return user