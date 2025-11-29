"""
API endpoints for voice call notifications
"""
import logging
import secrets
from datetime import datetime, timedelta
from typing import Dict

from fastapi import APIRouter, HTTPException

from app.models.voice_call import (
    GenerateVoiceCallLinkRequest,
    GenerateVoiceCallLinkResponse,
    GetVoiceCallPayloadResponse,
    VoiceCallToken,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/voice-calls", tags=["voice-calls"])

# In-memory storage for voice call tokens
# In production, use Redis or database with TTL
voice_call_tokens: Dict[str, VoiceCallToken] = {}


def generate_secure_token() -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)


def cleanup_expired_tokens():
    """Remove expired tokens from storage"""
    now = datetime.utcnow()
    expired_tokens = [
        token for token, data in voice_call_tokens.items()
        if data.expires_at < now
    ]
    for token in expired_tokens:
        del voice_call_tokens[token]


@router.post("/generate-link", response_model=GenerateVoiceCallLinkResponse)
async def generate_voice_call_link(request: GenerateVoiceCallLinkRequest):
    """
    Generate a secure voice call link for a regulatory update

    Args:
        request: Contains regulatory update payload and expiration time

    Returns:
        Secure link and token for the voice call
    """
    try:
        # Cleanup expired tokens
        cleanup_expired_tokens()

        # Generate secure token
        token = generate_secure_token()

        # Calculate expiration
        created_at = datetime.utcnow()
        expires_at = created_at + timedelta(minutes=request.expires_in_minutes)

        # Store token data
        voice_call_tokens[token] = VoiceCallToken(
            token=token,
            payload=request.payload,
            created_at=created_at,
            expires_at=expires_at,
            is_used=False
        )

        # Generate link (frontend will handle the /voice-call route)
        link = f"/voice-call?token={token}"

        logger.info(f"Generated voice call link for user {request.payload.user_id}")

        return GenerateVoiceCallLinkResponse(
            success=True,
            token=token,
            link=link,
            expires_at=expires_at
        )

    except Exception as e:
        logger.error(f"Error generating voice call link: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payload/{token}", response_model=GetVoiceCallPayloadResponse)
async def get_voice_call_payload(token: str):
    """
    Get the regulatory update payload for a voice call token

    Args:
        token: Voice call token

    Returns:
        Regulatory update payload
    """
    try:
        # Cleanup expired tokens
        cleanup_expired_tokens()

        # Check if token exists
        if token not in voice_call_tokens:
            return GetVoiceCallPayloadResponse(
                success=False,
                error="Invalid or expired token"
            )

        token_data = voice_call_tokens[token]

        # Check if token is expired
        if token_data.expires_at < datetime.utcnow():
            del voice_call_tokens[token]
            return GetVoiceCallPayloadResponse(
                success=False,
                error="Token has expired"
            )

        # Mark token as used (optional - remove if you want reusable links)
        # token_data.is_used = True

        logger.info(f"Retrieved voice call payload for user {token_data.payload.user_id}")

        return GetVoiceCallPayloadResponse(
            success=True,
            payload=token_data.payload
        )

    except Exception as e:
        logger.error(f"Error retrieving voice call payload: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/token/{token}")
async def invalidate_voice_call_token(token: str):
    """
    Invalidate a voice call token

    Args:
        token: Voice call token to invalidate

    Returns:
        Success message
    """
    try:
        if token in voice_call_tokens:
            del voice_call_tokens[token]
            return {"success": True, "message": "Token invalidated"}
        else:
            raise HTTPException(status_code=404, detail="Token not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error invalidating token: {e}")
        raise HTTPException(status_code=500, detail=str(e))
