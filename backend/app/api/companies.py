"""
API endpoints for company profile scraping and management
"""
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from app.core.supabase_client import supabase
from app.data_sources.scraper.company_scraper import CompanyScraper
from app.models.company_profile import (
    CompanyProfile,
    CompanyProfileCreate,
    CompanyProfileResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/companies", tags=["companies"])


@router.post("/scrape", response_model=CompanyProfileResponse)
async def scrape_company(request: CompanyProfileCreate):
    """
    Scrape company information from website and/or Wikipedia and store in database

    Args:
        request: Company information (name, website_url, wikipedia_url)

    Returns:
        CompanyProfileResponse with scraped data
    """
    try:
        logger.info(f"Scraping company: {request.company_name}")

        # Initialize scraper
        scraper = CompanyScraper()

        # Scrape company information
        profile = scraper.scrape_company(
            company_name=request.company_name,
            website_url=request.website_url,
            wikipedia_url=request.wikipedia_url
        )

        # Add timestamp
        profile.last_scraped_at = datetime.utcnow()

        # Convert to dict for Supabase
        profile_dict = profile.model_dump(exclude={'id', 'created_at', 'updated_at'})

        # Store in Supabase
        try:
            # Check if company already exists
            existing = supabase.table("company_profiles").select("id").eq("company_name", request.company_name).execute()

            if existing.data:
                # Update existing record
                result = supabase.table("company_profiles").update(profile_dict).eq("company_name", request.company_name).execute()
                logger.info(f"Updated existing company profile for: {request.company_name}")
            else:
                # Insert new record
                result = supabase.table("company_profiles").insert(profile_dict).execute()
                logger.info(f"Created new company profile for: {request.company_name}")

            if result.data:
                profile = CompanyProfile(**result.data[0])
                return CompanyProfileResponse(success=True, data=profile)
            else:
                return CompanyProfileResponse(
                    success=False,
                    error="Failed to store company profile in database"
                )

        except Exception as db_error:
            logger.error(f"Database error: {db_error}")
            # Return the scraped data even if DB storage failed
            return CompanyProfileResponse(
                success=True,
                data=profile,
                error=f"Data scraped but DB storage failed: {str(db_error)}"
            )

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
