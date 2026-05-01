"""
dependencies.py — Reusable FastAPI dependencies for role-based access control.
"""

from fastapi import Depends, HTTPException, status
from auth import get_current_user
import models


def get_current_admin(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """Raises 403 if the authenticated user is not an admin."""
    if current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def get_current_manager_or_admin(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """Raises 403 if the authenticated user is a plain employee."""
    if current_user.role == models.UserRole.employee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager or Admin access required",
        )
    return current_user
