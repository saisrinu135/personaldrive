import enum
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Float, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.config.database import DBBase

from utils.datetime_utils import get_current_utc


class ProviderType(str, enum.Enum):
    aws = "aws"
    cloudflare = "cloudflare"
    oracle = "oracle"
    minio = "minio"
    backblaze = "backblaze"
    digitalocean = "digitalocean"



class StorageProvider(DBBase):
    __tablename__ = "storage_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, unique=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete='CASCADE'), nullable=False, index=True)
    
    name = Column(String, nullable=False)
    provider_type = Column(Enum(ProviderType), nullable=False)
    provider_name = Column(String, nullable=True)
    is_default = Column(Boolean, nullable=True)

    # S3 Connection
    endpoint_url = Column(String, nullable=False)
    access_key = Column(Text, nullable=False)                # Fernet encrypted
    secret_key = Column(Text, nullable=False)                # Fernet encrypted
    bucket_name = Column(String(255), nullable=False)
    region = Column(String(100), nullable=True)

    # Quota tracking
    storage_limit_gb = Column(Float, nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_current_utc)
    updated_at = Column(DateTime(timezone=True), default=get_current_utc, onupdate=get_current_utc)

    # Relationship
    user = relationship("User", back_populates="providers")
    objects = relationship("Object", back_populates="provider")
    folders = relationship("Folder", back_populates="provider", cascade="all, delete-orphan")


    def __repr__(self):
        return self.name
    