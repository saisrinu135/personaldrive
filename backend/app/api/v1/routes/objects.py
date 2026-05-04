import io
from uuid import UUID
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Query, HTTPException, status
from fastapi.responses import StreamingResponse

from app.core.deps import Database, CurrentUser
from app.services.objects import ObjectService
from app.schemas.objects import ObjectResponse, MultipartUploadInit, MultipartUploadComplete
from app.schemas.common import APIResponse

router = APIRouter(prefix="/objects", tags=["Objects"])


@router.post("/upload", response_model=APIResponse, status_code=201)
async def upload_object(
    provider_id: UUID,
    current_user: CurrentUser,
    db: Database,
    file: UploadFile = File(...),
    folder_id: Optional[UUID] = None
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
        folder_id=folder_id
    )

    obj_response = ObjectResponse.from_orm(obj)

    return APIResponse(
        status=True,
        message="File uploaded successfully",
        data=obj_response
    )


@router.get("/", response_model=APIResponse)
async def list_objects(
    current_user: CurrentUser,
    db: Database,
    provider_id: Optional[UUID] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    folder_id: Optional[UUID] = None
):
    """List user's objects"""
    service = ObjectService(db)

    result = await service.list_objects(
        user_id=current_user.id,
        provider_id=provider_id,
        page=page,
        limit=limit,
        search=search,
        folder_id=folder_id
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


@router.get("/stats", response_model=APIResponse)
async def get_object_stats(
    current_user: CurrentUser,
    db: Database
):
    """Get user storage statistics natively via PostgreSQL"""
    service = ObjectService(db)
    stats = await service.get_user_stats(current_user.id)

    return APIResponse(
        status=True,
        message="Storage statistics retrieved successfully",
        data=stats
    )


@router.get("/{object_id}", response_model=APIResponse)
async def get_object(
    object_id: UUID,
    current_user: CurrentUser,
    db: Database
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
    current_user: CurrentUser,
    db: Database
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
    current_user: CurrentUser,
    db: Database
):
    """Delete object"""
    service = ObjectService(db)

    await service.delete_object(current_user.id, object_id)

    return APIResponse(
        status=True,
        message="Object deleted successfully"
    )


@router.get("/{object_id}/preview", response_model=APIResponse)
async def get_object_preview(
    object_id: UUID,
    current_user: CurrentUser,
    db: Database
):
    """Get a presigned URL for inline preview"""
    service = ObjectService(db)

    url = await service.get_presigned_url(current_user.id, object_id, inline=True)

    return APIResponse(
        status=True,
        message="Preview URL generated successfully",
        data={"url": url}
    )


@router.get("/{object_id}/direct-link", response_model=APIResponse)
async def get_direct_link(
    object_id: UUID,
    current_user: CurrentUser,
    db: Database,
    ttl: int = Query(3600, ge=300, le=86400,
                     description="Time to live in seconds (5 minutes to 24 hours)")
):
    """Get a direct, time-limited download link for an object"""
    service = ObjectService(db)

    # Generate presigned URL with longer expiration for direct access
    url = await service.get_presigned_url(
        user_id=current_user.id,
        object_id=object_id,
        inline=False,
        expiration=ttl
    )

    return APIResponse(
        status=True,
        message="Direct link generated successfully",
        data={
            "url": url,
            "expires_in": ttl,
            "expires_at": datetime.utcnow() + timedelta(seconds=ttl)
        }
    )


@router.post("/multipart/init", response_model=APIResponse)
async def init_multipart_upload(
    provider_id: UUID,
    payload: MultipartUploadInit,
    current_user: CurrentUser,
    db: Database
):
    """Initiate a multipart upload"""
    service = ObjectService(db)
    result = await service.init_multipart_upload(
        user_id=current_user.id,
        provider_id=provider_id,
        filename=payload.filename,
        content_type=payload.content_type,
        folder_id=payload.folder_id
    )
    return APIResponse(status=True, message="Multipart upload initiated", data=result)


@router.post("/multipart/part", response_model=APIResponse)
async def upload_part(
    current_user: CurrentUser,
    db: Database,
    provider_id: UUID,
    s3_key: str = Query(...),
    upload_id: str = Query(...),
    part_number: int = Query(...),
    file: UploadFile = File(...),
):
    """Upload a part for a multipart upload"""
    service = ObjectService(db)
    result = await service.upload_part(
        user_id=current_user.id,
        provider_id=provider_id,
        s3_key=s3_key,
        upload_id=upload_id,
        part_number=part_number,
        file=file
    )
    return APIResponse(status=True, message="Part uploaded successfully", data=result)


@router.post("/multipart/complete", response_model=APIResponse)
async def complete_multipart_upload(
    current_user: CurrentUser,
    db: Database,
    provider_id: UUID,
    s3_key: str = Query(...),
    upload_id: str = Query(...),
    filename: str = Query(...),
    content_type: Optional[str] = Query(None),
    folder_id: Optional[UUID] = Query(None),
    payload: MultipartUploadComplete = None
):
    """Complete a multipart upload"""
    service = ObjectService(db)

    parts_dict = [part.dict() for part in payload.parts]

    obj = await service.complete_multipart_upload(
        user_id=current_user.id,
        provider_id=provider_id,
        s3_key=s3_key,
        upload_id=upload_id,
        parts=parts_dict,
        filename=filename,
        size_bytes=payload.size_bytes,
        content_type=content_type,
        folder_id=folder_id,
        meta=payload.meta
    )

    return APIResponse(
        status=True,
        message="File uploaded successfully",
        data=ObjectResponse.from_orm(obj)
    )


@router.post("/multipart/abort", response_model=APIResponse)
async def abort_multipart_upload(
    current_user: CurrentUser,
    db: Database,
    provider_id: UUID,
    s3_key: str = Query(...),
    upload_id: str = Query(...),
):
    """Abort a multipart upload"""
    service = ObjectService(db)
    await service.abort_multipart_upload(
        user_id=current_user.id,
        provider_id=provider_id,
        s3_key=s3_key,
        upload_id=upload_id
    )
    return APIResponse(status=True, message="Upload cancelled successfully")
