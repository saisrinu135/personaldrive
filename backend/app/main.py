from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import logging

from app.config.settings import get_settings
from app.config.logger import setup_logging, log_error
from app.api.v1.router import router as api_v1_router
from app.schemas.common import APIResponse

settings = get_settings()

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_v1_router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(
        f"Environment: {'development' if settings.DEBUG else 'production'}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info(f"Shutting down {settings.APP_NAME}")


@app.get("/", response_model=APIResponse)
async def root():
    """Root endpoint"""
    logger.info("Root endpoint accessed")
    return APIResponse(
        status=True,
        message="Welcome to CloudVault API",
        data={
            "app_name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "status": "running"
        }
    )


@app.get("/health", response_model=APIResponse)
async def health_check():
    """Health check endpoint"""
    logger.info("Health check endpoint accessed")
    return APIResponse(
        status=True,
        message="Service is healthy",
        data={"status": "healthy"}
    )

# Global exception handler


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": False,
            "message": exc.detail,
            "data": None
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    log_error(
        logger,
        exc,
        context=f"Unhandled exception in {request.method} {request.url.path}",
        path=request.url.path,
        method=request.method
    )

    return JSONResponse(
        status_code=500,
        content={
            "status": False,
            "message": "Internal server error",
            "data": None
        }
    )
