import boto3
import asyncio
from botocore.exceptions import ClientError, NoCredentialsError, EndpointConnectionError
from typing import Dict, Any, Optional
from .base import BaseStorageClient, ConnectionTestResult

class S3StorageClient(BaseStorageClient):
    """S3-compatible storage client"""
    
    def __init__(self, endpoint_url: str, access_key: str, secret_key: str, 
                 bucket_name: str, region: Optional[str] = None):
        super().__init__(endpoint_url, access_key, secret_key, bucket_name, region)
        self._client = None
    
    def _get_client(self):
        """Get or create boto3 client"""
        if self._client is None:
            self._client = boto3.client(
                's3',
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region,
                use_ssl=self.endpoint_url.startswith('https://'),
                verify=True
            )
        return self._client
    
    async def test_connection(self) -> ConnectionTestResult:
        """Test connection by trying to list bucket contents and get bucket location"""
        try:
            client = self._get_client()
            
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            
            # Test 1: Check if bucket exists and is accessible
            try:
                await loop.run_in_executor(
                    None, 
                    lambda: client.head_bucket(Bucket=self.bucket_name)
                )
            except ClientError as e:
                error_code = e.response['Error']['Code']
                if error_code == '404':
                    return ConnectionTestResult(
                        success=False,
                        message=f"Bucket '{self.bucket_name}' not found",
                        error_code="BUCKET_NOT_FOUND"
                    )
                elif error_code == '403':
                    return ConnectionTestResult(
                        success=False,
                        message="Access denied. Check your credentials and bucket permissions",
                        error_code="ACCESS_DENIED"
                    )
                else:
                    return ConnectionTestResult(
                        success=False,
                        message=f"Bucket access error: {e.response['Error']['Message']}",
                        error_code=error_code
                    )
            
            # Test 2: Try to list objects (with limit to avoid large responses)
            try:
                response = await loop.run_in_executor(
                    None,
                    lambda: client.list_objects_v2(Bucket=self.bucket_name, MaxKeys=1)
                )
                object_count = response.get('KeyCount', 0)
            except ClientError as e:
                return ConnectionTestResult(
                    success=False,
                    message=f"Cannot list objects: {e.response['Error']['Message']}",
                    error_code=e.response['Error']['Code']
                )
            
            # Test 3: Get bucket location
            try:
                location_response = await loop.run_in_executor(
                    None,
                    lambda: client.get_bucket_location(Bucket=self.bucket_name)
                )
                bucket_region = location_response.get('LocationConstraint') or 'us-east-1'
            except ClientError:
                bucket_region = "unknown"
            
            return ConnectionTestResult(
                success=True,
                message="Connection successful",
                details={
                    "bucket_name": self.bucket_name,
                    "bucket_region": bucket_region,
                    "object_count": object_count,
                    "endpoint": self.endpoint_url
                }
            )
            
        except NoCredentialsError:
            return ConnectionTestResult(
                success=False,
                message="Invalid credentials provided",
                error_code="INVALID_CREDENTIALS"
            )
        except EndpointConnectionError:
            return ConnectionTestResult(
                success=False,
                message=f"Cannot connect to endpoint: {self.endpoint_url}",
                error_code="CONNECTION_ERROR"
            )
        except Exception as e:
            return ConnectionTestResult(
                success=False,
                message=f"Unexpected error: {str(e)}",
                error_code="UNKNOWN_ERROR"
            )
    
    async def list_objects(self, prefix: str = "", max_keys: int = 1000) -> Dict[str, Any]:
        """List objects in the bucket"""
        client = self._get_client()
        loop = asyncio.get_event_loop()
        
        try:
            response = await loop.run_in_executor(
                None,
                lambda: client.list_objects_v2(
                    Bucket=self.bucket_name,
                    Prefix=prefix,
                    MaxKeys=max_keys
                )
            )
            return response
        except ClientError as e:
            raise Exception(f"Failed to list objects: {e.response['Error']['Message']}")
    
    async def upload_object(self, key: str, data: bytes, content_type: str = None) -> Dict[str, Any]:
        """Upload an object to the bucket"""
        client = self._get_client()
        loop = asyncio.get_event_loop()
        
        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            response = await loop.run_in_executor(
                None,
                lambda: client.put_object(
                    Bucket=self.bucket_name,
                    Key=key,
                    Body=data,
                    **extra_args
                )
            )
            return response
        except ClientError as e:
            raise Exception(f"Failed to upload object: {e.response['Error']['Message']}")
    
    async def download_object(self, key: str) -> bytes:
        """Download an object from the bucket"""
        client = self._get_client()
        loop = asyncio.get_event_loop()
        
        try:
            response = await loop.run_in_executor(
                None,
                lambda: client.get_object(Bucket=self.bucket_name, Key=key)
            )
            return response['Body'].read()
        except ClientError as e:
            raise Exception(f"Failed to download object: {e.response['Error']['Message']}")
    
    async def delete_object(self, key: str) -> bool:
        """Delete an object from the bucket"""
        client = self._get_client()
        loop = asyncio.get_event_loop()
        
        try:
            await loop.run_in_executor(
                None,
                lambda: client.delete_object(Bucket=self.bucket_name, Key=key)
            )
            return True
        except ClientError as e:
            raise Exception(f"Failed to delete object: {e.response['Error']['Message']}")
