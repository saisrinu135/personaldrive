from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class ConnectionTestResult:
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None
    error_code: Optional[str] = None

class BaseStorageClient(ABC):
    """Base class for all storage clients"""
    
    def __init__(self, endpoint_url: str, access_key: str, secret_key: str, 
                 bucket_name: str, region: Optional[str] = None):
        self.endpoint_url = endpoint_url
        self.access_key = access_key
        self.secret_key = secret_key
        self.bucket_name = bucket_name
        self.region = region or "us-east-1"
    
    @abstractmethod
    async def test_connection(self) -> ConnectionTestResult:
        """Test the connection and credentials"""
        pass
    
    @abstractmethod
    async def list_objects(self, prefix: str = "", max_keys: int = 1000) -> Dict[str, Any]:
        """List objects in the bucket"""
        pass
    
    @abstractmethod
    async def upload_object(self, key: str, data: bytes, content_type: str = None) -> Dict[str, Any]:
        """Upload an object to the bucket"""
        pass
    
    @abstractmethod
    async def download_object(self, key: str) -> bytes:
        """Download an object from the bucket"""
        pass
    
    @abstractmethod
    async def delete_object(self, key: str) -> bool:
        """Delete an object from the bucket"""
        pass

    @abstractmethod
    async def generate_presigned_url(self, key: str, expiration: int = 3600, response_content_disposition: str = 'inline') -> str:
        """Generate a secure presigned access URL"""
        pass

    @abstractmethod
    async def create_multipart_upload(self, key: str, content_type: str = None) -> str:
        """Initiate a multipart upload and return the upload ID"""
        pass

    @abstractmethod
    async def upload_part(self, key: str, upload_id: str, part_number: int, data: bytes) -> Dict[str, Any]:
        """Upload a part and return the ETag"""
        pass

    @abstractmethod
    async def complete_multipart_upload(self, key: str, upload_id: str, parts: list) -> Dict[str, Any]:
        """Complete a multipart upload"""
        pass

    @abstractmethod
    async def abort_multipart_upload(self, key: str, upload_id: str) -> bool:
        """Abort a multipart upload"""
        pass
