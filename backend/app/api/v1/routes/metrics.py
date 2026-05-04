from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from typing import List

from app.core.deps import get_current_user, get_db, CurrentUser, Database
from app.models.user import User
from app.models.provider import StorageProvider
from app.models.object import Object
from app.schemas.common import StorageMetrics, ProviderMetrics

router = APIRouter()

@router.get("/storage", response_model=StorageMetrics)
async def get_storage_metrics(
    current_user: CurrentUser,
    db: Database
):
    """Get overall storage metrics for the current user"""
    
    # Get total storage and file count
    total_query = await db.execute(
        select(
            func.coalesce(func.sum(Object.size_bytes), 0).label('total_size'),
            func.count(Object.id).label('total_files')
        ).where(Object.user_id == current_user.id)
    )
    total_result = total_query.first()
    
    # Get storage by provider
    provider_query = await db.execute(
        select(
            StorageProvider.id,
            StorageProvider.name,
            StorageProvider.provider_type,
            func.coalesce(func.sum(Object.size_bytes), 0).label('storage_used'),
            func.count(Object.id).label('file_count')
        ).select_from(
            StorageProvider.__table__.outerjoin(Object.__table__)
        ).where(
            StorageProvider.user_id == current_user.id,
            StorageProvider.is_active == True
        ).group_by(
            StorageProvider.id,
            StorageProvider.name,
            StorageProvider.provider_type
        )
    )
    provider_metrics = provider_query.all()
    
    # Get file type breakdown
    type_query = await db.execute(
        select(
            Object.content_type,
            func.count(Object.id).label('count'),
            func.coalesce(func.sum(Object.size_bytes), 0).label('size_bytes')
        ).where(Object.user_id == current_user.id).group_by(Object.content_type)
    )
    type_breakdown = type_query.all()
    
    return StorageMetrics(
        total_size_bytes=total_result.total_size or 0,
        total_count=total_result.total_files or 0,
        by_provider=[
            ProviderMetrics(
                provider_id=str(p.id),
                provider_name=p.name,
                provider_type=p.provider_type,
                storage_used_bytes=p.storage_used or 0,
                file_count=p.file_count or 0
            ) for p in provider_metrics
        ],
        by_type=[
            {
                "content_type": t.content_type,
                "count": t.count,
                "size_bytes": t.size_bytes
            } for t in type_breakdown
        ]
    )

@router.get("/providers/{provider_id}", response_model=ProviderMetrics)
async def get_provider_metrics(
    provider_id: str,
    current_user: CurrentUser,
    db: Database
):
    """Get metrics for a specific provider"""
    
    provider_query = await db.execute(
        select(StorageProvider).where(
            StorageProvider.id == provider_id,
            StorageProvider.user_id == current_user.id
        )
    )
    provider = provider_query.scalar_one_or_none()
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    metrics_query = await db.execute(
        select(
            func.coalesce(func.sum(Object.size_bytes), 0).label('storage_used'),
            func.count(Object.id).label('file_count')
        ).where(
            Object.provider_id == provider_id,
            Object.user_id == current_user.id
        )
    )
    metrics = metrics_query.first()
    
    return ProviderMetrics(
        provider_id=str(provider.id),
        provider_name=provider.name,
        provider_type=provider.provider_type,
        storage_used_bytes=metrics.storage_used or 0,
        file_count=metrics.file_count or 0
    )