from typing import Optional
from app.clients.base import BaseStorageClient
from .s3_client import S3StorageClient
from app.models.provider import ProviderType

class StorageClientFactory:
    """Factory to create storage clients based on provider type"""
    
    @staticmethod
    def create_client(
        provider_type: ProviderType,
        endpoint_url: str,
        access_key: str,
        secret_key: str,
        bucket_name: str,
        region: Optional[str] = None
    ) -> BaseStorageClient:
        """Create a storage client based on provider type"""
        
        # All current providers use S3-compatible API
        if provider_type in [ProviderType.aws, ProviderType.cloudflare, ProviderType.oracle, ProviderType.others]:
            return S3StorageClient(
                endpoint_url=endpoint_url,
                access_key=access_key,
                secret_key=secret_key,
                bucket_name=bucket_name,
                region=region
            )
        else:
            raise ValueError(f"Unsupported provider type: {provider_type}")
