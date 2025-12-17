from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import time

from app.config.settings import get_settings
from app.models.database import engine, Base
from app.routers import health, metrics, products
from app.routers.metrics import REQUEST_COUNT, REQUEST_LATENCY

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs on startup and shutdown"""
    # Startup
    print(f"Starting {settings.app_name}...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created")
    
    yield  # App runs here
    
    # Shutdown
    print(f"Shutting down {settings.app_name}...")


app = FastAPI(
    title=settings.app_name,
    description="Product catalog management for CloudMart",
    version="1.0.0",
    lifespan=lifespan
)


# CORS - allow requests from other origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def track_metrics(request: Request, call_next):
    """Track request metrics for Prometheus"""
    start = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response


# Register routers
app.include_router(health.router, tags=["Health"])
app.include_router(metrics.router, tags=["Metrics"])
app.include_router(products.router, tags=["Products"])
