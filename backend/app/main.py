from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.init_db import init_db
from app.api.auth import router as auth_router
from app.api.services import router as services_router
from app.api.barbers import router as barbers_router
from app.api.queue import router as queue_router
from app.api.admin import router as admin_router
from app.api.customers import router as customers_router
from app.api.reviews import router as reviews_router
from app.websocket.endpoints import router as ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed data on startup
    init_db()
    yield

app = FastAPI(
    title="SalonFlow API",
    description="Commercial-grade Salon Queue Management SaaS API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
# CORS Middleware
# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)   

# Mount API Routers
app.include_router(auth_router)
app.include_router(services_router)
app.include_router(barbers_router)
app.include_router(queue_router)
app.include_router(admin_router)
app.include_router(customers_router)
app.include_router(reviews_router)
app.include_router(ws_router)

@app.get("/")
def root():
    return {
        "app": "SalonFlow",
        "tagline": "Smart Salon. Zero Waiting.",
        "status": "online",
        "docs": "/docs"
    }
