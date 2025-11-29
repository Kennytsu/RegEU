import logging
import os
from typing import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
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
    description="API for scraping legislative observatory data",
    version="1.0.0",
    lifespan=lifespan
)


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
