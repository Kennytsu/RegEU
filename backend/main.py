import logging
import os
from typing import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

# Only import and setup scheduler if Supabase is configured
SUPABASE_CONFIGURED = os.getenv("SUPABASE_PROJECT_URL", "").startswith("https://") and \
                      not os.getenv("SUPABASE_PROJECT_URL", "").endswith("placeholder.supabase.co")

if SUPABASE_CONFIGURED:
    from app.core.jobs import setup_scheduled_jobs
    from app.core.scheduling import scheduler

    setup_scheduled_jobs()
    scheduler.start()
    logging.info("Scheduler started with legislative observatory scraping job")
else:
    logging.warning("Supabase not configured - scheduler disabled. Set SUPABASE_PROJECT_URL to enable scraping.")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    FastAPICache.init(InMemoryBackend())
    yield


app = FastAPI(
    title="Legislative Observatory Scraper API",
    description="API for scraping legislative observatory data and company profiles",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",  # Frontend dev server
        "http://localhost:3000",  # Alternative frontend port
        "http://127.0.0.1:8080",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
# Always include companies router (it returns JSON without requiring DB)
from app.api.companies import router as companies_router
app.include_router(companies_router)

# Always include contacts router (returns 503 if DB not configured)
from app.api.contacts import router as contacts_router
app.include_router(contacts_router)

# Always include voice calls router (uses in-memory storage)
from app.api.voice_calls import router as voice_calls_router
app.include_router(voice_calls_router)

# Legislative files router requires Supabase
if SUPABASE_CONFIGURED:
    from app.api.legislative_files import router as legislative_files_router
    app.include_router(legislative_files_router)


@app.get("/")
async def root() -> dict:
    return {
        "message": "Legislative Observatory Scraper API",
        "status": "running",
        "scheduler": "active" if SUPABASE_CONFIGURED else "disabled (no Supabase config)",
        "supabase_configured": SUPABASE_CONFIGURED
    }


@app.get("/health")
async def health() -> dict:
    return {
        "status": "healthy",
        "service": "legislative-observatory-scraper",
        "scheduler_enabled": SUPABASE_CONFIGURED
    }
