import os
from datetime import datetime
import uuid
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, exists, func

from fastapi import HTTPException, status, UploadFile
import math

from app.models.object import Object
from app.models.provider import StorageProvider
from app.services.provider import StorageService
from app.services.folders import FolderService
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

    async def _check_key_exists(self, user_id: UUID, provider_id: UUID, new_key: str) -> bool:
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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid filename"
            )

        # Limit filename length
        if len(filename) > 255:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename too long (max 255 characters)"
            )

        return filename

    async def _get_storage_client(self, provider: StorageProvider):
        """Get the appropriate storage client based on provider type"""
        decrypted_secret = decrypt_secret(
            provider.secret_key, self.encryption_secret_key)
        client = StorageClientFactory.create_client(
            provider.provider_type,
            provider.endpoint_url,
            decrypt_secret(provider.access_key, self.encryption_secret_key),
            decrypted_secret,
            provider.bucket_name,
            provider.region
        )
        return client

    async def upload_object(
        self,
        user_id: UUID,
        provider_id: UUID,
        file: UploadFile,
        folder_id: Optional[UUID] = None,
        meta: Optional[Dict[str, Any]] = None
    ) -> Object:
        """Upload an object to storage"""

        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No filename provided"
            )

        # Get the provider
        provider = await self.storage_service.get_by_id(
            user_id=user_id,
            provider_id=provider_id,
            raise_exception=True
        )

        if not provider.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot upload to inactive provider"
            )

        # Get folder path for s3_key
        folder_service = FolderService(self.db)
        folder_path = await folder_service.get_folder_path_string(user_id, folder_id)

        # Sanitize and create S3 key
        clean_name = self._sanitize_filename(file.filename)
        # Using UUID for uniqueness in S3 key to avoid rename issues, 
        # but keep folder path for context if desired. Let's use a hybrid:
        # folder_path/random_uuid.ext or folder_path/clean_name
        s3_key = f"{folder_path}/{clean_name}" if folder_path else clean_name

        # Check for existing object
        if await self._check_key_exists(user_id=user_id, provider_id=provider_id, new_key=s3_key):
            # To prevent conflict, append a short UUID
            import uuid
            name_parts = clean_name.rsplit('.', 1)
            if len(name_parts) == 2:
                clean_name = f"{name_parts[0]}_{str(uuid.uuid4())[:8]}.{name_parts[1]}"
            else:
                clean_name = f"{clean_name}_{str(uuid.uuid4())[:8]}"
            s3_key = f"{folder_path}/{clean_name}" if folder_path else clean_name

        # Read file content
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot upload empty file"
            )

        # Get storage client
        client = await self._get_storage_client(provider)

        # Upload to storage
        upload_result = await client.upload_object(
            key=s3_key,
            data=content,
            content_type=file.content_type
        )

        # Create database record
        obj = Object(
            user_id=user_id,
            provider_id=provider_id,
            folder_id=folder_id,
            s3_key=s3_key,
            filename=file.filename,
            content_type=file.content_type,
            etag=upload_result.get('ETag', '').strip('"'),
            size_bytes=len(content),
            meta=meta or {}
        )

        self.db.add(obj)
        await self.db.flush()
        await self.db.commit()
        await self.db.refresh(obj)

        return obj

    async def list_objects(
        self,
        user_id: UUID,
        provider_id: Optional[UUID] = None,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        folder_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """List user's objects with pagination"""

        # Validate pagination
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 20

        # If provider_id is specified, validate it belongs to user
        if provider_id:
            await self.storage_service.get_by_id(
                user_id=user_id,
                provider_id=provider_id,
                raise_exception=True
            )

        offset = (page - 1) * limit

        # Build query
        query = select(Object).where(Object.user_id == user_id)
        count_query = select(func.count(Object.id)).where(
            Object.user_id == user_id)

        if provider_id:
            query = query.where(Object.provider_id == provider_id)
            count_query = count_query.where(Object.provider_id == provider_id)

        if search:
            search_filter = Object.filename.ilike(f"%{search}%")
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        query = query.where(Object.folder_id == folder_id)
        count_query = count_query.where(Object.folder_id == folder_id)

        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get objects
        query = query.order_by(Object.uploaded_at.desc()
                               ).offset(offset).limit(limit)
        result = await self.db.execute(query)
        objects = result.scalars().all()

        total_pages = math.ceil(total / limit) if total > 0 else 0

        return {
            "objects": objects,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }

    async def get_user_stats(self, user_id: UUID) -> Dict[str, Any]:
        """Get aggregate statistics for user's objects natively via PostgreSQL"""
        query = select(
            Object.content_type,
            func.count(Object.id).label('count'),
            func.sum(Object.size_bytes).label('size')
        ).where(Object.user_id == user_id).group_by(Object.content_type)

        result = await self.db.execute(query)
        rows = result.all()

        total_count = 0
        total_size = 0
        by_type = []

        for row in rows:
            content_type = row.content_type or 'unknown'
            count = row.count or 0
            size = row.size or 0

            total_count += count
            total_size += size
            by_type.append({
                "content_type": content_type,
                "count": count,
                "size_bytes": size
            })

        return {
            "total_count": total_count,
            "total_size_bytes": total_size,
            "by_type": by_type
        }

    async def get_object(self, user_id: UUID, object_id: UUID) -> Object:
        """Get object by ID"""
        query = select(Object).where(
            and_(Object.id == object_id, Object.user_id == user_id)
        )
        result = await self.db.execute(query)
        obj = result.scalar_one_or_none()

        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Object not found"
            )

        return obj

    async def delete_object(self, user_id: UUID, object_id: UUID) -> bool:
        """Delete an object"""
        obj = await self.get_object(user_id, object_id)

        # Get provider
        provider = await self.storage_service.get_by_id(
            user_id=user_id,
            provider_id=obj.provider_id,
            raise_exception=True
        )

        # Get storage client
        client = await self._get_storage_client(provider)

        try:
            # Delete from storage
            await client.delete_object(obj.s3_key)
        except Exception as e:
            # Log the error but continue with database deletion
            # This handles cases where the file was already deleted from storage
            pass

        # Delete from database
        await self.db.delete(obj)
        await self.db.commit()

        return True

    async def download_object(self, user_id: UUID, object_id: UUID) -> tuple[bytes, Object]:
        """Download object content"""
        obj = await self.get_object(user_id, object_id)

        # Get provider
        provider = await self.storage_service.get_by_id(
            user_id=user_id,
            provider_id=obj.provider_id,
            raise_exception=True
        )

        if not provider.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot download from inactive provider"
            )

        # Get storage client
        client = await self._get_storage_client(provider)

        try:
            # Download from storage
            content = await client.download_object(obj.s3_key)
            return content, obj
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found in storage"
            )

    async def get_presigned_url(self, user_id: UUID, object_id: UUID, inline: bool = True, expiration: int = 3600) -> str:
        """Generate a presigned URL for an object"""
        obj = await self.get_object(user_id, object_id)

        # Get provider
        provider = await self.storage_service.get_by_id(
            user_id=user_id,
            provider_id=obj.provider_id,
            raise_exception=True
        )

        if not provider.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot generate URL for inactive provider"
            )

        # Get storage client
        client = await self._get_storage_client(provider)

        try:
            disposition = f"inline; filename=\"{obj.filename}\"" if inline else f"attachment; filename=\"{obj.filename}\""
            url = await client.generate_presigned_url(
                key=obj.s3_key,
                expiration=expiration,
                response_content_disposition=disposition
            )
            return url
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate presigned URL: {str(e)}"
            )

    async def init_multipart_upload(
        self,
        user_id: UUID,
        provider_id: UUID,
        filename: str,
        content_type: str = None,
        folder_id: Optional[UUID] = None
    ) -> Dict[str, str]:
        """Initiate a multipart upload"""
        if not filename:
            raise HTTPException(status_code=400, detail="No filename provided")

        provider = await self.storage_service.get_by_id(
            user_id=user_id, provider_id=provider_id, raise_exception=True
        )
        if not provider.is_active:
            raise HTTPException(
                status_code=400, detail="Cannot upload to inactive provider")

        folder_service = FolderService(self.db)
        folder_path = await folder_service.get_folder_path_string(user_id, folder_id)

        clean_name = self._sanitize_filename(filename)
        s3_key = f"{folder_path}/{clean_name}" if folder_path else clean_name

        if await self._check_key_exists(user_id=user_id, provider_id=provider_id, new_key=s3_key):
            import uuid
            name_parts = clean_name.rsplit('.', 1)
            if len(name_parts) == 2:
                clean_name = f"{name_parts[0]}_{str(uuid.uuid4())[:8]}.{name_parts[1]}"
            else:
                clean_name = f"{clean_name}_{str(uuid.uuid4())[:8]}"
            s3_key = f"{folder_path}/{clean_name}" if folder_path else clean_name

        client = await self._get_storage_client(provider)
        upload_id = await client.create_multipart_upload(key=s3_key, content_type=content_type)

        return {"upload_id": upload_id, "s3_key": s3_key, "filename": filename}

    async def upload_part(
        self,
        user_id: UUID,
        provider_id: UUID,
        s3_key: str,
        upload_id: str,
        part_number: int,
        file: UploadFile
    ) -> Dict[str, Any]:
        """Upload a part for a multipart upload"""
        provider = await self.storage_service.get_by_id(
            user_id=user_id, provider_id=provider_id, raise_exception=True
        )
        client = await self._get_storage_client(provider)

        content = await file.read()
        part_info = await client.upload_part(
            key=s3_key,
            upload_id=upload_id,
            part_number=part_number,
            data=content
        )
        return part_info

    async def complete_multipart_upload(
        self,
        user_id: UUID,
        provider_id: UUID,
        s3_key: str,
        upload_id: str,
        parts: list,
        filename: str,
        size_bytes: int,
        content_type: str = None,
        folder_id: Optional[UUID] = None,
        meta: Optional[Dict[str, Any]] = None
    ) -> Object:
        """Complete a multipart upload and save to db"""
        provider = await self.storage_service.get_by_id(
            user_id=user_id, provider_id=provider_id, raise_exception=True
        )
        client = await self._get_storage_client(provider)

        result = await client.complete_multipart_upload(
            key=s3_key,
            upload_id=upload_id,
            parts=parts
        )

        obj = Object(
            user_id=user_id,
            provider_id=provider_id,
            folder_id=folder_id,
            s3_key=s3_key,
            filename=filename,
            content_type=content_type,
            etag=result.get('ETag', '').strip('"'),
            size_bytes=size_bytes,
            meta=meta or {}
        )

        self.db.add(obj)
        await self.db.flush()
        await self.db.commit()
        await self.db.refresh(obj)

        return obj

    async def abort_multipart_upload(
        self,
        user_id: UUID,
        provider_id: UUID,
        s3_key: str,
        upload_id: str
    ) -> bool:
        """Abort a multipart upload"""
        provider = await self.storage_service.get_by_id(
            user_id=user_id, provider_id=provider_id, raise_exception=True
        )
        client = await self._get_storage_client(provider)
        return await client.abort_multipart_upload(key=s3_key, upload_id=upload_id)
