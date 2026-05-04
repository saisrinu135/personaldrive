from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class ObjectUpload(BaseModel):
    """Schema for object upload request"""
    filename: str = Field(..., description="Original filename")
    content_type: Optional[str] = Field(None, description="MIME content type")
    folder_id: Optional[UUID] = Field(None, description="Folder ID")
    meta: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")

class ObjectResponse(BaseModel):
    """Schema for object response"""
    id: UUID
    provider_id: UUID
    user_id: UUID
    folder_id: Optional[UUID]
    s3_key: str
    filename: str
    content_type: Optional[str]
    etag: Optional[str]
    size_bytes: int
    meta: Optional[Dict[str, Any]]
    uploaded_at: datetime
    last_modified: Optional[datetime]
    
    class Config:
        from_attributes = True

class ObjectListResponse(BaseModel):
    """Schema for object list response"""
    objects: List[ObjectResponse]
    total: int
    page: int
    limit: int
    total_pages: int

class ObjectDownloadResponse(BaseModel):
    """Schema for object download URL response"""
    download_url: str
    expires_in: int
    filename: str
    content_type: Optional[str]
    size_bytes: int

class MultipartUploadInit(BaseModel):
    """Schema for initializing a multipart upload"""
    filename: str = Field(..., description="Original filename")
    content_type: Optional[str] = Field(None, description="MIME content type")
    folder_id: Optional[UUID] = Field(None, description="Folder ID")

class MultipartUploadPart(BaseModel):
    """Schema for completing a multipart upload"""
    PartNumber: int
    ETag: str

class MultipartUploadComplete(BaseModel):
    """Schema for completing a multipart upload"""
    parts: List[MultipartUploadPart]
    size_bytes: int = Field(..., description="Total size of the file in bytes")
    meta: Optional[Dict[str, Any]] = Field(default_factory=dict)

