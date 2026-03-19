from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from fastapi import HTTPException, status

from app.models.provider import ProviderType, StorageProvider
from app.core.security import encrypt_secret, decrypt_secret
from app.config.settings import get_settings

from app.schemas.provider import ProviderCreate
from app.clients.factory import StorageClientFactory

from app.models.object import Object


settings = get_settings()

class StorageService:
    def __init__(self, db: AsyncSession):
        """
        Initialize StorageService.
        
        Args:
            db (AsyncSession): Database session for async operations
        """
        self.db = db
        self.encryption_secret_key = settings.ENCRYPTION_KEY.encode()
    

    async def get_provider(
            self,
            user_id: UUID,
            provider_type: Optional[ProviderType] = None,
            provider_name: Optional[str] = None, raise_exception: bool = True):
        """
        Get a storage provider by user_id and optional filters
        Args:
            user_id: uuid = ID of the user
            provider_type: Optional[ProviderType] = Type of the provider (e.g. S3, GCS, Azure)
            provider_name: Optional[str] = Name of the provider (used when provider_type is OTHER)
            raise_exception: bool  = Whether to raise an exception if provider is not found
        Returns:
            StorageProvider = The storage provider matching the criteria
        Raises:
            HTTPException: 404 if provider not found
        """
        query = select(StorageProvider).where(StorageProvider.user_id == user_id)
        if provider_type:
            query = query.where(StorageProvider.provider_type == provider_type)
        elif provider_name:
            query = query.where(StorageProvider.provider_name == provider_name)
        
        result = await self.db.execute(query)
        provider = result.scalar_one_or_none()
        
        if not provider and raise_exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
        
        return provider

    async def _create_provider(self, user_id: UUID, provider_data: ProviderCreate):
        """
        Internal method to create a storage provider.
        
        Args:
            user_id (UUID): ID of the user
            provider_data (ProviderCreate): Provider creation data
            
        Returns:
            StorageProvider: The created storage provider
            
        Raises:
            HTTPException: 409 if provider with same name already exists
        """
        # Check if the user has provider with the same name
        existing_provider = await self.get_provider(
            user_id=user_id,
            provider_name=provider_data.provider_name,
            provider_type=provider_data.provider_type,
            raise_exception=False
        )

        if existing_provider:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Provider with the same name already exists for this user"
            )
        provider = StorageProvider(
            user_id=user_id,
            name=provider_data.name,
            provider_type=provider_data.provider_type,
            provider_name=provider_data.provider_name,
            is_default=provider_data.is_default,
            endpoint_url=provider_data.endpoint_url,
            access_key=encrypt_secret(provider_data.access_key, self.encryption_secret_key),
            secret_key=encrypt_secret(provider_data.secret_key, self.encryption_secret_key),
            bucket_name=provider_data.bucket_name,
            region=provider_data.region,
            storage_limit_gb=provider_data.storage_limit_gb,
            notes=provider_data.notes
        )

        self.db.add(provider)
        await self.db.flush()
        await self.db.refresh(provider)

        return provider
    
    async def list(self, user_id: UUID, is_active: bool = True) -> List[StorageProvider]:
        """
        List storage providers for a user.
        
        Args:
            user_id (UUID): ID of the user
            is_active (bool): Filter by active status, defaults to True
            
        Returns:
            List[StorageProvider]: List of storage providers
        """
        query = select(StorageProvider).where(StorageProvider.user_id == user_id)
        
        if is_active:
            query = query.where(StorageProvider.is_active == is_active)
        
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_id(self, user_id: UUID, provider_id: UUID, raise_exception: bool = True):
        """
        Get a storage provider by user_id and provider_id.
        
        Args:
            user_id (UUID): ID of the user
            provider_id (UUID): ID of the provider
            raise_exception (bool): Whether to raise exception if not found, defaults to True
            
        Returns:
            StorageProvider: The storage provider or None if not found
            
        Raises:
            HTTPException: 404 if provider not found and raise_exception is True
        """
        query = select(StorageProvider).where(
            and_(
                StorageProvider.user_id == user_id,
                StorageProvider.id == provider_id
            )
        )
        result = await self.db.execute(query)
        provider = result.scalar_one_or_none()

        if not provider and raise_exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
        
        return provider


    async def delete(self, user_id: UUID, provider_id: UUID):
        """
        Delete a storage provider.
        
        Args:
            user_id (UUID): ID of the user
            provider_id (UUID): ID of the provider to delete
            
        Returns:
            bool: True if deletion successful
            
        Raises:
            HTTPException: 404 if provider not found
        """
        provider = await self.get_by_id(user_id=user_id, provider_id=provider_id, raise_exception=True)
        await self.db.delete(provider)
        return True

    async def deactivate(self, user_id: UUID, provider_id: UUID):
        """
        Deactivate a storage provider.
        
        Args:
            user_id (UUID): ID of the user
            provider_id (UUID): ID of the provider to deactivate
            
        Returns:
            StorageProvider: The deactivated storage provider
            
        Raises:
            HTTPException: 404 if provider not found
        """
        provider = await self.get_by_id(user_id=user_id, provider_id=provider_id, raise_exception=True)
        provider.is_active = False
        return provider

    async def activate(self, user_id: UUID, provider_id: UUID):
        """
        Activate a storage provider.
        
        Args:
            user_id (UUID): ID of the user
            provider_id (UUID): ID of the provider to activate
            
        Returns:
            StorageProvider: The activated storage provider
            
        Raises:
            HTTPException: 404 if provider not found
        """
        provider = await self.get_by_id(user_id=user_id, provider_id=provider_id, raise_exception=True)
        provider.is_active = True
        return provider
    
    async def test_provider_connection(self, provider_data: dict) -> dict:
        """
        Test provider connection before saving.
        
        Args:
            provider_data (dict): Provider configuration data
            
        Returns:
            dict: Connection test result with success, message, details, and error_code
        """
        try:
            client = StorageClientFactory.create_client(
                provider_type=provider_data["provider_type"],
                endpoint_url=provider_data["endpoint_url"],
                access_key=provider_data["access_key"],
                secret_key=provider_data["secret_key"],
                bucket_name=provider_data["bucket_name"],
                region=provider_data.get("region")
            )
            
            result = await client.test_connection()
            return {
                "success": result.success,
                "message": result.message,
                "details": result.details,
                "error_code": result.error_code
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Connection test failed: {str(e)}",
                "error_code": "TEST_ERROR"
            }
    

    async def create(self, user_id: UUID, provider_data: ProviderCreate):
        """
        Create a new storage provider with connection testing.
        
        Args:
            user_id (UUID): ID of the user
            provider_data (ProviderCreate): Provider creation data
            
        Returns:
            StorageProvider: The created storage provider
            
        Raises:
            HTTPException: 400 if connection test fails, 409 if provider already exists
        """
        test_result = await self.test_provider_connection(provider_data.dict())
        if not test_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Provider connection test failed: {test_result['message']}"
            )
        
        return await self._create_provider(user_id=user_id, provider_data=provider_data)
    
    async def create_with_out_tests(self, user_id: UUID, provider_data: ProviderCreate):
        """
        Create provider without testing connection (used for seeding data).
        
        Args:
            user_id (UUID): ID of the user
            provider_data (ProviderCreate): Provider creation data
            
        Returns:
            StorageProvider: The created storage provider
            
        Raises:
            HTTPException: 409 if provider with same name already exists
        """
        return await self._create_provider(user_id=user_id, provider_data=provider_data)
    
    
    # async def get_provider_storage_usage(self, user_id: UUID, provider_id: UUID) -> Dict[str, Any]:
    #     """Get storage usage for a specific provider"""
    #     provider = await self.get_by_id(user_id, provider_id, raise_exception=True)
        
    #     # Query objects for this provider
    #     query = select(func.sum(Object.size_bytes), func.count(Object.id)).where(
    #         and_(Object.user_id == user_id, Object.provider_id == provider_id)
    #     )
        
    #     result = await self.db.execute(query)
    #     total_size, total_count = result.first()
        
    #     usage_data = {
    #         "provider_name": provider.name,
    #         "total_size_bytes": total_size or 0,
    #         "total_objects": total_count or 0,
    #         "storage_limit_gb": provider.storage_limit_gb,
    #         "usage_percentage": None
    #     }
        
    #     if provider.storage_limit_gb:
    #         usage_gb = (total_size or 0) / (1024 * 1024 * 1024)
    #         usage_data["usage_percentage"] = round((usage_gb / provider.storage_limit_gb) * 100, 2)
        
    #     return usage_data
