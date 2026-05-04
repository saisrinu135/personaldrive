from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Query

from app.core.deps import Database, CurrentUser
from app.services.folders import FolderService
from app.schemas.folders import FolderCreate, FolderUpdate, FolderResponse, FolderBreadcrumbsResponse
from app.schemas.common import APIResponse

router = APIRouter(prefix="/folders", tags=["Folders"])


@router.post("/", response_model=APIResponse, status_code=201)
async def create_folder(
    provider_id: UUID,
    payload: FolderCreate,
    current_user: CurrentUser,
    db: Database
):
    """Create a new folder"""
    service = FolderService(db)
    folder = await service.create_folder(
        user_id=current_user.id,
        provider_id=provider_id,
        folder_data=payload
    )

    return APIResponse(
        status=True,
        message="Folder created successfully",
        data=FolderResponse.from_orm(folder)
    )


@router.get("/", response_model=APIResponse)
async def list_folders(
    current_user: CurrentUser,
    db: Database,
    provider_id: UUID,
    parent_id: Optional[UUID] = None
):
    """List subfolders in a specific location"""
    service = FolderService(db)
    folders = await service.list_folders(
        user_id=current_user.id,
        provider_id=provider_id,
        parent_id=parent_id
    )

    return APIResponse(
        status=True,
        message="Folders retrieved successfully",
        data=[FolderResponse.from_orm(f) for f in folders]
    )


@router.put("/{folder_id}", response_model=APIResponse)
async def update_folder(
    folder_id: UUID,
    payload: FolderUpdate,
    current_user: CurrentUser,
    db: Database
):
    """Rename or move a folder"""
    service = FolderService(db)
    folder = await service.update_folder(
        user_id=current_user.id,
        folder_id=folder_id,
        update_data=payload
    )

    return APIResponse(
        status=True,
        message="Folder updated successfully",
        data=FolderResponse.from_orm(folder)
    )


@router.delete("/{folder_id}", response_model=APIResponse)
async def delete_folder(
    folder_id: UUID,
    current_user: CurrentUser,
    db: Database
):
    """Delete a folder and all its contents"""
    service = FolderService(db)
    await service.delete_folder(current_user.id, folder_id)

    return APIResponse(
        status=True,
        message="Folder deleted successfully"
    )


@router.get("/{folder_id}/breadcrumbs", response_model=APIResponse)
async def get_breadcrumbs(
    folder_id: UUID,
    current_user: CurrentUser,
    db: Database
):
    """Get the path from root to this folder"""
    service = FolderService(db)
    breadcrumbs = await service.get_breadcrumbs(current_user.id, folder_id)

    return APIResponse(
        status=True,
        message="Breadcrumbs retrieved successfully",
        data={"breadcrumbs": breadcrumbs}
    )
