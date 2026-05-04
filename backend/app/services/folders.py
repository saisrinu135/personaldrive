from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from fastapi import HTTPException, status

from app.models.folder import Folder
from app.models.object import Object
from app.schemas.folders import FolderCreate, FolderUpdate

class FolderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_folder(self, user_id: UUID, provider_id: UUID, folder_data: FolderCreate) -> Folder:
        """Create a new folder."""
        # Verify parent exists and belongs to the same provider/user
        if folder_data.parent_id:
            parent = await self.get_folder(user_id, folder_data.parent_id)
            if parent.provider_id != provider_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent folder must belong to the same storage provider"
                )

        # Check for duplicate name in the same parent/root
        stmt = select(Folder).where(
            and_(
                Folder.user_id == user_id,
                Folder.provider_id == provider_id,
                Folder.parent_id == folder_data.parent_id,
                Folder.name == folder_data.name
            )
        )
        existing = (await self.db.execute(stmt)).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A folder with this name already exists in this location"
            )

        folder = Folder(
            name=folder_data.name,
            user_id=user_id,
            provider_id=provider_id,
            parent_id=folder_data.parent_id
        )
        self.db.add(folder)
        await self.db.commit()
        await self.db.refresh(folder)
        return folder

    async def get_folder(self, user_id: UUID, folder_id: UUID) -> Folder:
        """Get a folder by ID."""
        stmt = select(Folder).where(and_(Folder.id == folder_id, Folder.user_id == user_id))
        folder = (await self.db.execute(stmt)).scalar_one_or_none()
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found"
            )
        return folder

    async def list_folders(self, user_id: UUID, provider_id: UUID, parent_id: Optional[UUID] = None) -> List[Folder]:
        """List folders in a specific location."""
        stmt = select(Folder).where(
            and_(
                Folder.user_id == user_id,
                Folder.provider_id == provider_id,
                Folder.parent_id == parent_id
            )
        ).order_by(Folder.name.asc())
        
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def update_folder(self, user_id: UUID, folder_id: UUID, update_data: FolderUpdate) -> Folder:
        """Rename or move a folder."""
        folder = await self.get_folder(user_id, folder_id)
        update_dict = update_data.dict(exclude_unset=True)

        if "name" in update_dict:
            # Check duplicate name
            stmt = select(Folder).where(
                and_(
                    Folder.user_id == user_id,
                    Folder.provider_id == folder.provider_id,
                    Folder.parent_id == update_dict.get("parent_id", folder.parent_id),
                    Folder.name == update_dict["name"],
                    Folder.id != folder_id
                )
            )
            existing = (await self.db.execute(stmt)).scalar_one_or_none()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A folder with this name already exists in the target location"
                )
            folder.name = update_dict["name"]

        if "parent_id" in update_dict:
            new_parent_id = update_dict["parent_id"]
            # Circular dependency check: ensure new parent is not a child of this folder
            if new_parent_id == folder_id:
                raise HTTPException(status_code=400, detail="Cannot move folder into itself")
            
            if new_parent_id:
                new_parent = await self.get_folder(user_id, new_parent_id)
                if new_parent.provider_id != folder.provider_id:
                    raise HTTPException(status_code=400, detail="Cannot move across providers")
                
                # Walk up from new_parent to see if we hit folder_id
                current = new_parent
                while current.parent_id:
                    if current.parent_id == folder_id:
                        raise HTTPException(status_code=400, detail="Cannot move folder into its own subfolder")
                    current = await self.get_folder(user_id, current.parent_id)
            
            folder.parent_id = new_parent_id

        await self.db.commit()
        await self.db.refresh(folder)
        return folder

    async def delete_folder(self, user_id: UUID, folder_id: UUID) -> bool:
        """Delete a folder and all its contents (cascade)."""
        folder = await self.get_folder(user_id, folder_id)
        
        # Note: In a real system, we also need to delete the objects from S3.
        # But since our Objects cascade delete on DB side, we would orphan S3 files
        # unless we fetch them all and delete them from S3 first.
        # For simplicity in this implementation, we rely on DB cascade,
        # but a background worker should ideally clean up S3.
        
        await self.db.delete(folder)
        await self.db.commit()
        return True

    async def get_breadcrumbs(self, user_id: UUID, folder_id: UUID) -> List[Dict[str, str]]:
        """Get the path from root to this folder."""
        breadcrumbs = []
        current_id = folder_id
        
        while current_id:
            folder = await self.get_folder(user_id, current_id)
            breadcrumbs.insert(0, {"id": str(folder.id), "name": folder.name})
            current_id = folder.parent_id
            
        return breadcrumbs

    async def get_folder_path_string(self, user_id: UUID, folder_id: Optional[UUID]) -> str:
        """Get the full logical path string for S3 key generation."""
        if not folder_id:
            return ""
            
        breadcrumbs = await self.get_breadcrumbs(user_id, folder_id)
        return "/".join([item["name"] for item in breadcrumbs])

