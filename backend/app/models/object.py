import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.config.database import DBBase
from utils.datetime_utils import get_current_utc

class Object(DBBase):
    __tablename__ = "objects"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("storage_providers.id", ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    folder_id = Column(UUID(as_uuid=True), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)

    # S3 Identity
    s3_key = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=True)
    etag = Column(String, nullable=True)

    # Size
    size_bytes = Column(BigInteger, nullable=False, default=0)

    # Meta
    meta = Column(JSONB, nullable=True, default=dict)

    uploaded_at = Column(DateTime(timezone=True), default=get_current_utc, nullable=False)
    last_modified = Column(DateTime(timezone=True), nullable=True, default=get_current_utc)

    # Relationships
    provider = relationship("StorageProvider", back_populates="objects")
    user = relationship("User", back_populates="objects")
    folder = relationship("Folder", back_populates="objects")

    def __repr__(self):
        return self.filename
