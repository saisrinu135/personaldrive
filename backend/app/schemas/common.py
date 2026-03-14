from pydantic import BaseModel
from typing import Any, Optional

class APIResponse(BaseModel):
    status: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None
    
    class Config:
        from_attributes = True