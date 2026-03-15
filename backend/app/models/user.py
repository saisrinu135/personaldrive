import uuid
from sqlalchemy import Column, String, Integer, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.config.database import DBBase

from utils.datetime_utils import get_current_utc


class User(DBBase):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_current_utc)
    updated_at = Column(DateTime(timezone=True), default=get_current_utc, onupdate=get_current_utc)
    last_login = Column(DateTime(timezone=True), nullable=True)

    providers = relationship("StorageProvider",back_populates="user",cascade="all, delete-orphan")
    objects = relationship("Object", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return self.email
    