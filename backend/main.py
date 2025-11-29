from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional
import uvicorn

app = FastAPI(
    title="Web Scraper API",
    description="FastAPI application for web scraping",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScrapeRequest(BaseModel):
    url: HttpUrl
    options: Optional[dict] = None


class ScrapeResponse(BaseModel):
    success: bool
    url: str
    data: Optional[dict] = None
    error: Optional[str] = None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Web Scraper API is running",
        "status": "healthy",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check endpoint"""
    return {
        "status": "healthy",
        "service": "web-scraper-api"
    }


@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_website(request: ScrapeRequest):
    """
    Endpoint to scrape a website

    The actual scraping logic will be implemented later.
    This is a placeholder that accepts scraping requests.
    """
    try:
        # Placeholder for scraping logic
        # TODO: Implement actual scraping functionality

        return ScrapeResponse(
            success=True,
            url=str(request.url),
            data={"message": "Scraping logic to be implemented"},
            error=None
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Scraping failed: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
