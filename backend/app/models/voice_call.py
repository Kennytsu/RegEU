"""
Pydantic models for voice call notifications
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ImpactLevel(str, Enum):
    """Enum for regulatory update impact level"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RegulatoryUpdatePayload(BaseModel):
    """Payload for regulatory update voice call"""
    user_id: str
    user_name: str
    company_name: str
    regulation_type: str  # e.g., "GDPR", "MiFID II", "DORA"
    regulation_title: str  # e.g., "Article 5 Amendment"
    effective_date: str  # ISO date string
    deadline: str  # Action deadline
    summary: str  # Brief summary of the change
    action_required: str  # What user needs to do
    impact_level: ImpactLevel
    reference_url: Optional[str] = None  # Link to full documentation


class VoiceCallToken(BaseModel):
    """Voice call token data"""
    token: str
    payload: RegulatoryUpdatePayload
    created_at: datetime
    expires_at: datetime
    is_used: bool = False


class GenerateVoiceCallLinkRequest(BaseModel):
    """Request to generate a voice call link"""
    payload: RegulatoryUpdatePayload
    expires_in_minutes: int = 60  # Default 1 hour expiration


class GenerateVoiceCallLinkResponse(BaseModel):
    """Response with voice call link"""
    success: bool
    token: str
    link: str
    expires_at: datetime


class GetVoiceCallPayloadResponse(BaseModel):
    """Response with voice call payload"""
    success: bool
    payload: Optional[RegulatoryUpdatePayload] = None
    error: Optional[str] = None
