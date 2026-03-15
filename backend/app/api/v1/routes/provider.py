from uuid import UUID
from fastapi import APIRouter


from app.core.deps import Database, CurrentUser
from app.services.provider import StorageService
from app.services.provider import StorageService
from app.config.settings import get_settings
from app.schemas.provider import ProviderCreate, ProviderTestConnection, ProviderListResponse, ProviderResponse

from app.schemas.common import APIResponse

settings = get_settings()

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
    summary="Get all storage providers for the current user"
)
async def list_providers(
    current_user: CurrentUser,
    db: Database,
    is_active: bool = None
):
    """API Endpoint to list all the providers of the user"""
    service = StorageService(db)
    providers = await service.list(user_id=current_user.id, is_active=is_active)
    
    # Convert to response models
    provider_responses = [ProviderResponse.from_orm(provider) for provider in providers]
    
    return APIResponse(
        status=True,
        message="Providers retrieved successfully",
        data=provider_responses
    )

@router.put(
    "/{provider_id}/activate",
    summary="Activate a storage provider",
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
