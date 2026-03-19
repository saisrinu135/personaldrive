from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import Optional
import io

from app.core.deps import Database, CurrentUser
from app.services.objects import ObjectService
from app.schemas.objects import ObjectResponse
from app.schemas.common import APIResponse

router = APIRouter(prefix="/objects", tags=["Objects"])


@router.post("/upload", response_model=APIResponse, status_code=201)
async def upload_object(
    provider_id: UUID,
    file: UploadFile = File(...),
    folder_path: Optional[str] = "",
    current_user: CurrentUser = Depends(),
    db: Database = Depends()
):
    """Upload a file to storage"""
    service = ObjectService(db)

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )

    obj = await service.upload_object(
        user_id=current_user.id,
        provider_id=provider_id,
        file=file,
        folder_path=folder_path or ""
    )

    obj_response = ObjectResponse.from_orm(obj)

    return APIResponse(
        status=True,
        message="File uploaded successfully",
        data=obj_response
    )


@router.get("/", response_model=APIResponse)
async def list_objects(
    provider_id: Optional[UUID] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    folder_path: Optional[str] = None,
    current_user: CurrentUser = Depends(),
    db: Database = Depends()
):
    """List user's objects"""
    service = ObjectService(db)

    result = await service.list_objects(
        user_id=current_user.id,
        provider_id=provider_id,
        page=page,
        limit=limit,
        search=search,
        folder_path=folder_path
    )

    objects_response = [ObjectResponse.from_orm(
        obj) for obj in result["objects"]]

    return APIResponse(
        status=True,
        message="Objects retrieved successfully" if objects_response else "No objects found",
        data={
            "objects": objects_response,
            "total": result["total"],
            "page": result["page"],
            "limit": result["limit"],
            "total_pages": result["total_pages"]
        }
    )


@router.get("/{object_id}", response_model=APIResponse)
async def get_object(
    object_id: UUID,
    current_user: CurrentUser = Depends(),
    db: Database = Depends()
):
    """Get object details"""
    service = ObjectService(db)

    obj = await service.get_object(current_user.id, object_id)
    obj_response = ObjectResponse.from_orm(obj)

    return APIResponse(
        status=True,
        message="Object retrieved successfully",
        data=obj_response
    )


@router.get("/{object_id}/download")
async def download_object(
    object_id: UUID,
    current_user: CurrentUser = Depends(),
    db: Database = Depends()
):
    """Download object"""
    service = ObjectService(db)

    content, obj = await service.download_object(current_user.id, object_id)

    return StreamingResponse(
        io.BytesIO(content),
        media_type=obj.content_type or "application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={obj.filename}"}
    )


@router.delete("/{object_id}", response_model=APIResponse)
async def delete_object(
    object_id: UUID,
    current_user: CurrentUser = Depends(),
    db: Database = Depends()
):
    """Delete object"""
    service = ObjectService(db)

    await service.delete_object(current_user.id, object_id)

    return APIResponse(
        status=True,
        message="Object deleted successfully"
    )
