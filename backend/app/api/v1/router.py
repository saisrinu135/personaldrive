from fastapi import APIRouter
from app.api.v1.routes import auth, user

router = APIRouter(prefix="/v1")

router.include_router(auth.router)
router.include_router(user.router)