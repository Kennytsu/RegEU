"""
API endpoints for notification contacts management
"""
import logging
import os
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.notification_contact import (
    NotificationContact,
    NotificationContactCreate,
    NotificationContactUpdate,
    NotificationContactResponse,
    NotificationContactListResponse,
)

# Only import supabase if configured
SUPABASE_CONFIGURED = os.getenv("SUPABASE_PROJECT_URL", "").startswith("https://") and \
                      not os.getenv("SUPABASE_PROJECT_URL", "").endswith("placeholder.supabase.co")

if SUPABASE_CONFIGURED:
    from app.core.supabase_client import supabase
else:
    supabase = None

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("/user/{user_id}", response_model=NotificationContactListResponse)
async def list_user_contacts(
    user_id: str,
    is_active: Optional[bool] = None
):
    """
    List all notification contacts for a user

    Args:
        user_id: User ID to get contacts for
        is_active: Filter by active status

    Returns:
        List of notification contacts
    """
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Database not configured. This endpoint requires Supabase configuration."
        )

    try:
        query = supabase.table("notification_contacts").select("*").eq("user_id", user_id)

        if is_active is not None:
            query = query.eq("is_active", is_active)

        result = query.order("created_at", desc=False).execute()

        contacts = [NotificationContact(**contact) for contact in result.data]

        return NotificationContactListResponse(
            success=True,
            data=contacts,
            count=len(contacts)
        )

    except Exception as e:
        logger.error(f"Error listing contacts for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/user/{user_id}", response_model=NotificationContactResponse)
async def create_contact(user_id: str, contact: NotificationContactCreate):
    """
    Create a new notification contact for a user

    Args:
        user_id: User ID to create contact for
        contact: Contact information

    Returns:
        Created contact
    """
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Database not configured. This endpoint requires Supabase configuration."
        )

    try:
        contact_data = {
            "user_id": user_id,
            **contact.model_dump()
        }

        result = supabase.table("notification_contacts").insert(contact_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create contact")

        created_contact = NotificationContact(**result.data[0])

        logger.info(f"Created notification contact {created_contact.id} for user {user_id}")

        return NotificationContactResponse(
            success=True,
            data=created_contact
        )

    except Exception as e:
        logger.error(f"Error creating contact for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{contact_id}", response_model=NotificationContactResponse)
async def get_contact(contact_id: str):
    """
    Get a notification contact by ID

    Args:
        contact_id: Contact ID

    Returns:
        Contact information
    """
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Database not configured. This endpoint requires Supabase configuration."
        )

    try:
        result = supabase.table("notification_contacts").select("*").eq("id", contact_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail=f"Contact {contact_id} not found")

        contact = NotificationContact(**result.data[0])

        return NotificationContactResponse(
            success=True,
            data=contact
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching contact {contact_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{contact_id}", response_model=NotificationContactResponse)
async def update_contact(contact_id: str, contact_update: NotificationContactUpdate):
    """
    Update a notification contact

    Args:
        contact_id: Contact ID
        contact_update: Fields to update

    Returns:
        Updated contact
    """
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Database not configured. This endpoint requires Supabase configuration."
        )

    try:
        # Only include fields that are provided
        update_data = {
            k: v for k, v in contact_update.model_dump().items()
            if v is not None
        }

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        result = supabase.table("notification_contacts").update(update_data).eq("id", contact_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail=f"Contact {contact_id} not found")

        updated_contact = NotificationContact(**result.data[0])

        logger.info(f"Updated notification contact {contact_id}")

        return NotificationContactResponse(
            success=True,
            data=updated_contact
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating contact {contact_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{contact_id}")
async def delete_contact(contact_id: str):
    """
    Delete a notification contact

    Args:
        contact_id: Contact ID

    Returns:
        Success message
    """
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Database not configured. This endpoint requires Supabase configuration."
        )

    try:
        result = supabase.table("notification_contacts").delete().eq("id", contact_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail=f"Contact {contact_id} not found")

        logger.info(f"Deleted notification contact {contact_id}")

        return {
            "success": True,
            "message": f"Contact {contact_id} deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting contact {contact_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
