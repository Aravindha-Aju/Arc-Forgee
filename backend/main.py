"""
main.py
-------
FastAPI application entry point for MarkX platform.
Initializes database, configures CORS, and registers all API routers.
"""

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

# Import database initialization
from backend.database import init_db, engine, Base

# Import all models to ensure they're registered with Base
from backend import models  # noqa: F401


# ============================================================================
# APPLICATION LIFECYCLE
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events.
    Creates database tables on startup.
    """
    print("🚀 Starting MarkX Platform...")
    print("📊 Initializing database tables...")
    init_db()
    print("✅ Database initialized successfully")
    print(f"📋 Total tables: {len(Base.metadata.tables)}")
    
    yield  # Application runs here
    
    print("🛑 Shutting down MarkX Platform...")


# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="MarkX - AI-Powered Cyber Risk Platform",
    description="Continuous Cyber Risk Quantification and Security Resource Optimization",
    version="1.0.0",
    lifespan=lifespan
)


# ============================================================================
# CORS CONFIGURATION
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# HEALTH CHECK & ROOT ENDPOINT
# ============================================================================

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "MarkX Backend",
        "version": "1.0.0",
        "message": "AI-Powered Cyber Risk Platform is running"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "tables": len(Base.metadata.tables)
    }


# ============================================================================
# API ROUTERS
# ============================================================================

# BLOCK 1: Security Intelligence & Context
from backend.api import assets, context, dashboard
app.include_router(assets.router, prefix="/api", tags=["Assets"])
app.include_router(context.router, prefix="/api", tags=["Security Context"])

from backend.api import upload, dashboard
app.include_router(upload.router, prefix="/api", tags=["Data Ingestion"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])

# BLOCK 2: Risk Quantification (Coming soon)
# from backend.api import risk, dashboard
# app.include_router(risk.router, prefix="/api", tags=["Risk"])


# ============================================================================
# RUN SERVER (for development)
# ============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 MarkX Platform - Starting Development Server")
    print("="*60)
    print("📍 API Docs: http://localhost:8000/docs")
    print("📍 Health Check: http://localhost:8000/health")
    print("="*60 + "\n")
    
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

