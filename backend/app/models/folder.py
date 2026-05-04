import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.config.database import DBBase
from utils.datetime_utils import get_current_utc

class Folder(DBBase):
    __tablename__ = "folders"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("storage_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)
    
    created_at = Column(DateTime(timezone=True), default=get_current_utc, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_current_utc, onupdate=get_current_utc, nullable=False)

    # Relationships
    user = relationship("User", back_populates="folders")
    provider = relationship("StorageProvider", back_populates="folders")
    parent = relationship("Folder", remote_side=[id], back_populates="subfolders")
    subfolders = relationship("Folder", back_populates="parent", cascade="all, delete-orphan")
    objects = relationship("Object", back_populates="folder")

    def __repr__(self):
        return self.name
