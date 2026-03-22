from uuid import UUID
from fastapi import APIRouter, status, HTTPException

from app.core.deps import Database, CurrentUser
from app.services.provider import StorageService
from app.config.settings import get_settings
from app.schemas.provider import (
    ProviderCreate,
    ProviderTestConnection,
    ProviderListResponse,
    ProviderResponse,
    ProviderUpdate,
    ProviderUsageResponse
)
from app.schemas.common import APIResponse
from app.config.logger import get_logger, get_db_logger, log_error, log_db_operation

settings = get_settings()
logger = get_logger(__name__)
db_logger = get_db_logger()

router = APIRouter(prefix="/providers", tags=["providers"])


@router.post("/test-connection")
async def test_provider_connection(
    connection_data: ProviderTestConnection,
    current_user: CurrentUser,
    db: Database
):
    """Test provider connection without saving"""
    service = StorageService(db)
    result = await service.test_provider_connection(connection_data.dict())
    return result


@router.get(
    "/dropdown",
    response_model=APIResponse,
    summary="Get all storage providers for the current user",
    status_code=status.HTTP_200_OK
)
async def list_providers_dropdown(
    current_user: CurrentUser,
    db: Database,
    is_active: bool = None
):
    """API Endpoint to list all the providers of the user"""
    service = StorageService(db)
    providers = await service.list(user_id=current_user.id, is_active=is_active)

    # Convert to response models
    provider_responses = [ProviderResponse.from_orm(
        provider) for provider in providers]

    return APIResponse(
        status=True,
        message="Providers retrieved successfully",
        data=provider_responses
    )


@router.post(
    "/",
    status_code=201,
    summary="Create a new storage provider",
    response_model=APIResponse
)
async def create_provider(
    provider_data: ProviderCreate,
    current_user: CurrentUser,
    db: Database
):
    """Create a new storage provider"""
    service = StorageService(db)
    provider = await service.create_with_out_tests(user_id=current_user.id, provider_data=provider_data)

    provider_response = ProviderResponse.from_orm(provider)

    return APIResponse(
        status=True,
        message="Provider created successfully",
        data=provider_response
    )


@router.get(
    "/",
    response_model=APIResponse,
    summary="Get all storage providers for the current user",
    status_code=status.HTTP_200_OK
)
async def list_providers(
    current_user: CurrentUser,
    db: Database,
    is_active: bool = None
):
    """API Endpoint to list all the providers of the user"""
    service = StorageService(db)
    providers = await service.list_with_usage(user_id=current_user.id, is_active=is_active)

    # Convert to response models
    provider_responses = [ProviderUsageResponse.from_orm(provider) for provider in providers]

    return APIResponse(
        status=True,
        message="Providers retrieved successfully",
        data=provider_responses
    )


@router.get(
    "/{provider_id}/usage/",
    response_model=APIResponse,
    status_code=status.HTTP_200_OK
)
async def get_provider_usage(
    provider_id: UUID,
    current_user: CurrentUser,
    db: Database
):
    """Get storage usage metrics for a specific provider"""
    
    service = StorageService(db)
    usage_data = await service.get_provider_storage_usage(user_id=current_user.id, provider_id=provider_id)
    
    return APIResponse(
        status=True,
        message="Provider usage retrieved successfully",
        data=usage_data
    )


@router.put(
    "/{provider_id}/activate",
    summary="Activate a storage provider",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse
)
async def activate_provider(
    provider_id: UUID,
    current_user: CurrentUser,
    db: Database
):
    """API Endpoint to activate a provider"""
    service = StorageService(db)
    await service.activate(user_id=current_user.id, provider_id=provider_id)

    return APIResponse(
        status=True,
        message="Provider activated successfully"
    )


@router.put(
    "/{provider_id}/deactivate",
    status_code=200,
    summary="Deactivate a storage provider",
    response_model=APIResponse
)
async def deactivate_provider(
    provider_id: UUID,
    current_user: CurrentUser,
    db: Database
):
    """API Endpoint to deactivate a provider"""
    service = StorageService(db)
    await service.deactivate(user_id=current_user.id, provider_id=provider_id)

    return APIResponse(
        status=True,
        message="Provider deactivated successfully"
    )


@router.get("/{provider_id}", response_model=APIResponse)
async def get_provider(
    provider_id: UUID,
    current_user: CurrentUser,
    db: Database
):
    """Get specific provider details"""
    service = StorageService(db)

    try:
        provider = await service.get_by_id(
            user_id=current_user.id,
            provider_id=provider_id,
            raise_exception=True
        )

        provider_response = ProviderResponse.from_orm(provider)

        return APIResponse(
            status=True,
            message="Provider retrieved successfully",
            data=provider_response
        )
    except HTTPException:
        raise


@router.put("/{provider_id}", response_model=APIResponse)
async def update_provider(
    provider_id: UUID,
    provider_data: ProviderUpdate,
    current_user: CurrentUser,
    db: Database
):
    """Update provider settings"""
    service = StorageService(db)
    provider = await service.update_provider(
        user_id=current_user.id,
        provider_id=provider_id,
        provider_data=provider_data
    )

    provider_response = ProviderResponse.from_orm(provider)

    return APIResponse(
        status=True,
        message="Provider updated successfully",
        data=provider_response
    )


@router.delete("/{provider_id}", response_model=APIResponse)
async def delete_provider(
    provider_id: UUID,
    current_user: CurrentUser,
    db: Database
):
    """Delete provider"""
    service = StorageService(db)

    await service.delete(user_id=current_user.id, provider_id=provider_id)

    return APIResponse(
        status=True,
        message="Provider deleted successfully"
    )
