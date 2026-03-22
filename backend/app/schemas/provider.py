from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, validator
from typing import Optional, List

from app.models.provider import ProviderType
from app.schemas.common import APIResponse

class ProviderBase(BaseModel):
    name: str = Field(description="name of the storage provider")
    provider_type: ProviderType
    provider_name: Optional[str] = Field(default=None, description="Name of the provider if type does not exist")
    is_default: Optional[bool] = False
    endpoint_url: str = Field(description="endpoint url for the provider")
    access_key: str = Field(description="access key for the provider")
    secret_key: str = Field(description="secret key for the provider")
    bucket_name: str = Field(description="bucket name for the provider")
    region: str = Field(description="region for the provider")
    storage_limit_gb: Optional[float] = Field(default=None, description="Storage limit in GB")
    notes: Optional[str] = Field(default=None, description="Notes about the provider")


class ProviderCreate(ProviderBase):
    pass

class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    provider_name: Optional[str] = None
    is_default: Optional[bool] = None
    endpoint_url: Optional[str] = None
    access_key: Optional[str] = None
    secret_key: Optional[str] = None
    bucket_name: Optional[str] = None
    region: Optional[str] = None
    storage_limit_gb: Optional[float] = None
    notes: Optional[str] = None


class ProviderResponse(BaseModel):
    id: UUID
    name: str
    provider_type: ProviderType
    provider_name: Optional[str] = Field(default="")
    is_default: Optional[bool]
    endpoint_url: str
    bucket_name: str
    region: Optional[str]
    storage_limit_gb: Optional[float] = Field(default=0.0)
    is_active: bool = Field(default=False)
    created_at: datetime
    updated_at: Optional[datetime]  =Field(default=None, description="Updated time")

    class Config:
        from_attributes = True


class ProviderUsageResponse(ProviderResponse):
    usage: dict = {}
    
class ProviderListResponse(APIResponse):
    data: Optional[List[ProviderResponse]] = []


class ProviderListUsage(APIResponse):
    data: List[ProviderUsageResponse]


class ProviderTestConnection(BaseModel):
    """Schema for testing provider connection without saving"""
    provider_type: ProviderType = Field(..., description="Type of storage provider")
    endpoint_url: str = Field(..., description="S3 endpoint URL")
    access_key: str = Field(..., min_length=1, description="Access key for authentication")
    secret_key: str = Field(..., min_length=1, description="Secret key for authentication")
    bucket_name: str = Field(..., min_length=1, description="Bucket name to test access")
    region: Optional[str] = Field(None, description="Region (optional, defaults to us-east-1)")

    @validator('endpoint_url')
    def validate_endpoint_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('Endpoint URL must start with http:// or https://')
        return v.rstrip('/')  # Remove trailing slash