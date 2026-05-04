from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field

class FolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    parent_id: Optional[UUID] = None

class FolderCreate(FolderBase):
    pass

class FolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    parent_id: Optional[UUID] = None

class FolderResponse(FolderBase):
    id: UUID
    user_id: UUID
    provider_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BreadcrumbItem(BaseModel):
    id: UUID
    name: str

class FolderBreadcrumbsResponse(BaseModel):
    breadcrumbs: List[BreadcrumbItem]
