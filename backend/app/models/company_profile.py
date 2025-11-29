"""
Pydantic models for company profiles
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, HttpUrl


class RegulatoryTopic(str, Enum):
    """Enum for regulatory topics matching the database"""
    AI_ACT = "AI Act"
    BAFIN = "BaFin"
    CYBERSECURITY = "Cybersecurity"
    GDPR = "GDPR"
    AMLR = "AMLR"
    ESG = "ESG"


class CompanyProfile(BaseModel):
    """Company profile data model"""
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # User Association
    user_id: Optional[UUID] = None

    # Basic Information
    company_name: str
    website_url: Optional[str] = None
    wikipedia_url: Optional[str] = None

    # Company Details
    industry: Optional[str] = None
    sector: Optional[str] = None
    description: Optional[str] = None
    founded_year: Optional[int] = None
    headquarters: Optional[str] = None
    employee_count: Optional[str] = None
    company_size: Optional[str] = None

    # Business Information
    business_model: Optional[str] = None
    products_services: Optional[list[str]] = None
    technologies_used: Optional[list[str]] = None

    # Regulatory Interests
    regulatory_topics: Optional[list[str]] = None
    relevant_legislative_areas: Optional[list[str]] = None
    compliance_requirements: Optional[list[str]] = None

    # Market Information
    target_markets: Optional[list[str]] = None
    geographic_presence: Optional[list[str]] = None

    # Extracted Metadata
    keywords: Optional[list[str]] = None
    categories: Optional[list[str]] = None

    # Scraping Metadata
    source_type: Optional[str] = None
    last_scraped_at: Optional[datetime] = None
    scrape_status: Optional[str] = None
    scrape_error: Optional[str] = None

    # Raw Data
    raw_data: Optional[dict] = None

    class Config:
        from_attributes = True


class CompanyProfileCreate(BaseModel):
    """Request model for creating a company profile"""
    company_name: str
    website_url: Optional[str] = None
    wikipedia_url: Optional[str] = None
    user_id: UUID  # Required when creating a profile


class CompanyScrapeRequest(BaseModel):
    """Request model for scraping multiple URLs"""
    urls: list[str]


class CompanyProfileResponse(BaseModel):
    """Response model for company profile"""
    success: bool
    data: Optional[CompanyProfile] = None
    error: Optional[str] = None


class CompanyProfileSimple(BaseModel):
    """Simplified company profile for API responses"""
    company_name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    regulatory_topics: Optional[list[str]] = None
    website_url: Optional[str] = None


class CompanyProfileListResponse(BaseModel):
    """Response model for multiple company profiles"""
    success: bool
    data: list[CompanyProfile]
    errors: Optional[list[dict]] = None


class CompanyProfileSimpleListResponse(BaseModel):
    """Simplified response model for multiple company profiles"""
    success: bool
    data: list[CompanyProfileSimple]
    errors: Optional[list[dict]] = None


class SaveProfilesRequest(BaseModel):
    """Request model for saving company profiles"""
    profiles: list[CompanyProfileSimple]
    user_id: str
