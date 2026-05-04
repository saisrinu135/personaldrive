from pydantic import BaseModel
from typing import Any, Optional, List, Dict

class APIResponse(BaseModel):
    status: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None
    
    class Config:
        from_attributes = True

class ProviderMetrics(BaseModel):
    provider_id: str
    provider_name: str
    provider_type: str
    storage_used_bytes: int
    file_count: int

class StorageMetrics(BaseModel):
    total_size_bytes: int
    total_count: int
    by_provider: List[ProviderMetrics]
    by_type: List[Dict[str, Any]]