"""
API endpoints for company profile scraping and management
"""
import logging
import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from app.data_sources.scraper.company_scraper import CompanyScraper
from app.models.company_profile import (
    CompanyProfile,
    CompanyProfileCreate,
    CompanyProfileResponse,
    CompanyScrapeRequest,
    CompanyProfileListResponse,
)

# Only import supabase if configured (not needed for scraping-only mode)
SUPABASE_CONFIGURED = os.getenv("SUPABASE_PROJECT_URL", "").startswith("https://") and \
                      not os.getenv("SUPABASE_PROJECT_URL", "").endswith("placeholder.supabase.co")

if SUPABASE_CONFIGURED:
    from app.core.supabase_client import supabase
else:
    supabase = None

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/companies", tags=["companies"])


@router.post("/scrape", response_model=CompanyProfileListResponse)
async def scrape_companies(request: CompanyScrapeRequest):
    """
    Scrape company information from an array of URLs
    (Does not store in database)

    Args:
        request: List of URLs to scrape

    Returns:
        CompanyProfileListResponse with scraped data as JSON
    """
    try:
        logger.info(f"Received request: {request}")
        logger.info(f"Scraping {len(request.urls)} URLs")

        # Initialize scraper
        scraper = CompanyScraper()

        profiles = []
        errors = []

        for url in request.urls:
            try:
                # Extract company name from URL (domain name)
                from urllib.parse import urlparse
                parsed_url = urlparse(url)
                company_name = parsed_url.netloc.replace('www.', '').split('.')[0]

                # Scrape company information
                profile = scraper.scrape_company(
                    company_name=company_name,
                    website_url=url,
                    wikipedia_url=None
                )

                # Add timestamp
                profile.last_scraped_at = datetime.utcnow()
                profiles.append(profile)

                logger.info(f"Successfully scraped: {url}")

            except Exception as e:
                error_msg = f"Error scraping {url}: {str(e)}"
                logger.error(error_msg, exc_info=True)
                errors.append({"url": url, "error": str(e)})

        logger.info(f"Completed scraping. Success: {len(profiles)}, Errors: {len(errors)}")
        return CompanyProfileListResponse(
            success=True,
            data=profiles,
            errors=errors if errors else None
        )

    except Exception as e:
        logger.error(f"Error in batch scraping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scrape/single", response_model=CompanyProfileResponse)
async def scrape_company(request: CompanyProfileCreate):
    """
    Scrape company information from website and/or Wikipedia and return JSON
    (Does not store in database)

    Args:
        request: Company information (name, website_url, wikipedia_url)

    Returns:
        CompanyProfileResponse with scraped data as JSON
    """
    try:
        logger.info(f"Scraping company: {request.company_name}")

        # Initialize scraper
        scraper = CompanyScraper()

        # Scrape company information (sync for now)
        profile = scraper.scrape_company(
            company_name=request.company_name,
            website_url=request.website_url,
            wikipedia_url=request.wikipedia_url
        )

        # Add timestamp
        profile.last_scraped_at = datetime.utcnow()

        # Return scraped data as JSON without storing in database
        logger.info(f"Successfully scraped company: {request.company_name}")
        return CompanyProfileResponse(success=True, data=profile)

    except Exception as e:
        logger.error(f"Error scraping company {request.company_name}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{company_name}", response_model=CompanyProfileResponse)
async def get_company_profile(company_name: str):
    """
    Get company profile by name

    Args:
        company_name: Name of the company

    Returns:
        CompanyProfileResponse with company data
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured. This endpoint requires Supabase configuration.")

    try:
        result = supabase.table("company_profiles").select("*").eq("company_name", company_name).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail=f"Company '{company_name}' not found")

        profile = CompanyProfile(**result.data[0])
        return CompanyProfileResponse(success=True, data=profile)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching company {company_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=dict)
async def list_companies(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    industry: Optional[str] = None
):
    """
    List all company profiles with optional filtering

    Args:
        limit: Maximum number of results
        offset: Offset for pagination
        industry: Filter by industry

    Returns:
        List of company profiles
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured. This endpoint requires Supabase configuration.")

    try:
        query = supabase.table("company_profiles").select("*")

        if industry:
            query = query.eq("industry", industry)

        result = query.range(offset, offset + limit - 1).order("created_at", desc=True).execute()

        return {
            "success": True,
            "data": result.data or [],
            "count": len(result.data or [])
        }

    except Exception as e:
        logger.error(f"Error listing companies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{company_name}")
async def delete_company_profile(company_name: str):
    """
    Delete a company profile

    Args:
        company_name: Name of the company to delete

    Returns:
        Success message
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured. This endpoint requires Supabase configuration.")

    try:
        result = supabase.table("company_profiles").delete().eq("company_name", company_name).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail=f"Company '{company_name}' not found")

        return {"success": True, "message": f"Company '{company_name}' deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting company {company_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{company_name}/regulatory-topics")
async def get_company_regulatory_topics(company_name: str):
    """
    Get regulatory topics relevant to a company

    Args:
        company_name: Name of the company

    Returns:
        List of regulatory topics and relevant legislative areas
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured. This endpoint requires Supabase configuration.")

    try:
        result = supabase.table("company_profiles").select(
            "company_name, regulatory_topics, relevant_legislative_areas"
        ).eq("company_name", company_name).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail=f"Company '{company_name}' not found")

        return {
            "success": True,
            "data": result.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching regulatory topics for {company_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
