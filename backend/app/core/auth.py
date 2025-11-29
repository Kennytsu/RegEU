"""
Minimal authentication module for legislative observatory scraper
"""
from fastapi import HTTPException, Request


def check_request_user_id(request: Request, user_id: str) -> None:
    """
    Placeholder authentication check function.
    In a production environment, this would verify the user's identity.
    For now, it's a no-op to allow the application to run.
    """
    # TODO: Implement proper authentication when needed
    pass
