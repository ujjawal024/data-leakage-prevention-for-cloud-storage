"""
auth_routes.py — Authentication endpoints: register, login, me.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from auth import hash_password, verify_password, create_access_token, get_current_user
import models

router = APIRouter(prefix="/auth", tags=["auth"])


# ──────────────────────────────────────────────
# Request / Response schemas
# ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email:    str
    password: str
    role:     str = "employee"   # employee | manager  (admin cannot self-register)


class LoginRequest(BaseModel):
    username: str
    password: str


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@router.post("/register", status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Create a new user account. Admin role cannot be self-registered."""
    # Prevent self-registration as admin
    if body.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin role cannot be self-registered",
        )

    # Validate role
    valid_roles = {r.value for r in models.UserRole}
    if body.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {valid_roles}")

    # Uniqueness checks
    if db.query(models.User).filter(models.User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        username        = body.username,
        email           = body.email,
        hashed_password = hash_password(body.password),
        role            = models.UserRole(body.role),
        created_at      = datetime.utcnow(),
        is_active       = True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"user_id": user.id, "username": user.username, "role": user.role}


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return a JWT access token."""
    user = db.query(models.User).filter(models.User.username == body.username).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token({"user_id": user.id, "role": user.role.value})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "role":         user.role.value,
        "username":     user.username,
        "user_id":      user.id,
    }


@router.get("/me")
def me(current_user: models.User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return {
        "user_id":    current_user.id,
        "username":   current_user.username,
        "email":      current_user.email,
        "role":       current_user.role.value,
        "created_at": current_user.created_at,
        "is_active":  current_user.is_active,
    }
