import os
from datetime import datetime
import uuid
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, exists

from fastapi import HTTPException, status, UploadFile
import math

from app.models.object import Object
from app.models.provider import StorageProvider
from app.services.provider import StorageService
from app.schemas.objects import ObjectUpload, ObjectResponse, ObjectListResponse
from app.clients.factory import StorageClientFactory
from app.core.security import decrypt_secret
from app.config.settings import get_settings

settings = get_settings()


class ObjectService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.storage_service = StorageService(db)
        self.encryption_secret_key = settings.ENCRYPTION_KEY.encode()
    

    async def _check_key_exists(self, user_id, provider_id, new_key):
        """Check if the generated S3 key already exists for the user and provider"""
        
        stmt = select(exists().where(
            and_(
                Object.user_id == user_id,
                Object.provider_id == provider_id,
                Object.s3_key == new_key
            )
        ))
        result = await self.db.execute(stmt)
        return result.scalar()
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for safe storage"""
        import re
        
        # Remove or replace unsafe characters
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        
        # Remove leading/trailing spaces and dots
        filename = filename.strip(' .')
        
        # Ensure filename is not empty
        if not filename:
            filename = f"file_{int(datetime.now().timestamp())}"
        
        # Limit filename length
        if len(filename) > 255:
            name, ext = os.path.splitext(filename)
            max_name_length = 255 - len(ext)
            filename = name[:max_name_length] + ext
        
        return filename
    
    async def get_storage_client(self, provider: StorageProvider):
        """Get the appropriate storage client based on provider type"""
        decrypted_secret = decrypt_secret(provider.encrypted_secret, self.encryption_secret_key)
        client = StorageClientFactory.create_client(
            provider.provider_type,
            provider.endpoint_url,
            provider.access_key,
            decrypted_secret,
            provider.bucket_name,
            provider.region
        )
        return client
    
    
    async def upload_object(
    self,
    user_id: UUID,
    provider_id:UUID,
    file: UploadFile,
    folder_path: str = "",
    meta: Optional[Dict[str, Any]] = None
) -> Object:
        """Upload an object to storage"""
        
        # Get the provider
        provider = await self.storage_service.get_by_id(user_id=user_id, provider_id=provider_id)
        if not provider.is_active:
            raise HTTPException(status_code=400, detail="Cannot upload to inactive provider")
        
        clean_name = self._sanitize_filename(file.filename)
        s3_key = f"{folder_path.strip('/')}/{clean_name}" if folder_path else clean_name

        # Check for existing object
        if self._check_key_exists(user_id=user_id, provider_id=provider_id, new_key=s3_key):
            raise HTTPException(status_code=400, detail="An object with the same name already exists in this location")
        
        # Read file content
        content = await file.read()

        # Get storage client
        client = self.get_storage_client(provider)

        # Upload to storage
        upload_result = await client.upload_object(
            key=s3_key,
            data=content,
            content_type=file.content_type,
            meta=meta
        )

        