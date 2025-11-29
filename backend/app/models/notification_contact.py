"""
Pydantic models for notification contacts
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class NotificationFrequency(str, Enum):
    """Enum for notification frequency"""
    REALTIME = "realtime"
    DAILY = "daily"
    WEEKLY = "weekly"


class NotificationContact(BaseModel):
    """Notification contact data model"""
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # User association
    user_id: UUID

    # Contact information
    name: str
    role: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None

    # Notification channels
    channel_email: bool = True
    channel_sms: bool = False
    channel_calls: bool = False

    # Notification settings
    frequency: NotificationFrequency = NotificationFrequency.DAILY
    high_impact_only: bool = False

    # Metadata
    is_active: bool = True

    class Config:
        from_attributes = True


class NotificationContactCreate(BaseModel):
    """Request model for creating a notification contact"""
    name: str
    role: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    channel_email: bool = True
    channel_sms: bool = False
    channel_calls: bool = False
    frequency: NotificationFrequency = NotificationFrequency.DAILY
    high_impact_only: bool = False


class NotificationContactUpdate(BaseModel):
    """Request model for updating a notification contact"""
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    channel_email: Optional[bool] = None
    channel_sms: Optional[bool] = None
    channel_calls: Optional[bool] = None
    frequency: Optional[NotificationFrequency] = None
    high_impact_only: Optional[bool] = None
    is_active: Optional[bool] = None


class NotificationContactResponse(BaseModel):
    """Response model for notification contact"""
    success: bool
    data: Optional[NotificationContact] = None
    error: Optional[str] = None


class NotificationContactListResponse(BaseModel):
    """Response model for multiple notification contacts"""
    success: bool
    data: list[NotificationContact]
    count: int
