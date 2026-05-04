from fastapi import APIRouter
from app.api.v1.routes import auth, user, provider, objects, folders, metrics

router = APIRouter(prefix="/v1")

# Include routers in specific order to avoid conflicts
router.include_router(auth.router)
router.include_router(user.router)
router.include_router(provider.router)
router.include_router(objects.router)
router.include_router(folders.router)
router.include_router(metrics.router)