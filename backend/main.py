import logging
from typing import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

from app.api.legislative_files import router as api_legislative_files
from app.core.jobs import setup_scheduled_jobs
from app.core.scheduling import scheduler


setup_scheduled_jobs()
scheduler.start()

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

app.include_router(api_legislative_files)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "message": "Legislative Observatory Scraper API",
        "status": "running"
    }
