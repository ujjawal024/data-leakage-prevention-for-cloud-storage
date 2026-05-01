"""
admin_routes.py — Admin-only endpoints: dashboard stats, alerts, audit logs,
file management, and user management.
All routes require role == admin (enforced server-side via get_current_admin).
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_admin
import models

router = APIRouter(prefix="/admin", tags=["admin"])


def fmt_ts(dt: datetime) -> str | None:
    """Serialise a naive UTC datetime to an ISO-8601 string with 'Z' suffix.
    This ensures JavaScript's Date() treats it as UTC, not local time."""
    return dt.isoformat() + "Z" if dt else None


# ──────────────────────────────────────────────
# GET /admin/dashboard-stats
# ──────────────────────────────────────────────

@router.get("/dashboard-stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    now = datetime.utcnow()
    twenty_four_h_ago = now - timedelta(hours=24)

    total_files    = db.query(models.FileRecord).filter(models.FileRecord.is_deleted == False).count()
    blocked_files  = db.query(models.FileRecord).filter(models.FileRecord.is_blocked == True).count()
    total_users    = db.query(models.User).count()
    unread_alerts  = db.query(models.Alert).filter(models.Alert.is_read == False).count()

    recent_activity = db.query(models.AuditLog).filter(
        models.AuditLog.timestamp >= twenty_four_h_ago
    ).count()

    # Files uploaded today (last 24h), not blocked, not deleted
    files_today = db.query(models.FileRecord).filter(
        models.FileRecord.upload_time >= twenty_four_h_ago,
        models.FileRecord.is_deleted  == False,
        models.FileRecord.is_blocked  == False,
    ).count()

    # Classification breakdown
    def count_class(cls: str):
        return db.query(models.FileRecord).filter(
            models.FileRecord.classification == models.Classification(cls),
            models.FileRecord.is_deleted == False,
        ).count()

    return {
        "total_files":   total_files,
        "blocked_files": blocked_files,
        "total_users":   total_users,
        "unread_alerts": unread_alerts,
        "files_today":   files_today,
        "recent_activity_count_24h": recent_activity,
        "files_by_classification": {
            "PUBLIC":       count_class("PUBLIC"),
            "CONFIDENTIAL": count_class("CONFIDENTIAL"),
            "RESTRICTED":   count_class("RESTRICTED"),
        },
    }


# ──────────────────────────────────────────────
# GET /admin/alerts
# ──────────────────────────────────────────────

@router.get("/alerts")
def list_alerts(
    is_read:  Optional[bool]   = Query(None),
    severity: Optional[str]    = Query(None),
    limit:    int              = Query(50, le=500),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    q = db.query(models.Alert)
    if is_read is not None:
        q = q.filter(models.Alert.is_read == is_read)
    if severity:
        q = q.filter(models.Alert.severity == models.AlertSeverity(severity))
    alerts = q.order_by(models.Alert.timestamp.desc()).limit(limit).all()
    return [
        {
            "id":        a.id,
            "severity":  a.severity.value,
            "reason":    a.reason,
            "details":   a.details,
            "timestamp": fmt_ts(a.timestamp),
            "is_read":   a.is_read,
            "file_id":   a.file_id,
            "triggered_by": {
                "user_id":  a.triggered_by_user.id,
                "username": a.triggered_by_user.username,
            } if a.triggered_by_user else None,
        }
        for a in alerts
    ]


# ──────────────────────────────────────────────
# PATCH /admin/alerts/{id}/read
# ──────────────────────────────────────────────

@router.patch("/alerts/{alert_id}/read")
def mark_alert_read(
    alert_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"id": alert_id, "is_read": True}


# ──────────────────────────────────────────────
# GET /admin/audit-logs
# ──────────────────────────────────────────────

@router.get("/audit-logs")
def list_audit_logs(
    user_id:   Optional[int] = Query(None),
    action:    Optional[str] = Query(None),
    result:    Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date:   Optional[str] = Query(None),
    limit:     int           = Query(100, le=1000),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    q = db.query(models.AuditLog)
    if user_id:
        q = q.filter(models.AuditLog.user_id == user_id)
    if action:
        q = q.filter(models.AuditLog.action == models.AuditAction(action))
    if result:
        q = q.filter(models.AuditLog.result == models.AuditResult(result))
    if from_date:
        q = q.filter(models.AuditLog.timestamp >= datetime.fromisoformat(from_date))
    if to_date:
        q = q.filter(models.AuditLog.timestamp <= datetime.fromisoformat(to_date))

    logs = q.order_by(models.AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id":             l.id,
            "user_id":        l.user_id,
            "username":       l.user.username if l.user else "unknown",
            "action":         l.action.value,
            "filename":       l.filename,
            "classification": l.classification,
            "result":         l.result.value,
            "timestamp":      fmt_ts(l.timestamp),
            "ip_address":     l.ip_address,
            "details":        l.details,
        }
        for l in logs
    ]


# ──────────────────────────────────────────────
# GET /admin/files
# ──────────────────────────────────────────────

@router.get("/files")
def list_all_files(
    classification: Optional[str]  = Query(None),
    is_blocked:     Optional[bool]  = Query(None),
    uploader_id:    Optional[int]   = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    q = db.query(models.FileRecord).filter(models.FileRecord.is_deleted == False)
    if classification:
        q = q.filter(models.FileRecord.classification == models.Classification(classification))
    if is_blocked is not None:
        q = q.filter(models.FileRecord.is_blocked == is_blocked)
    if uploader_id:
        q = q.filter(models.FileRecord.uploader_id == uploader_id)

    files = q.order_by(models.FileRecord.upload_time.desc()).all()
    return [
        {
            "id":                f.id,
            "original_filename": f.original_filename,
            "classification":    f.classification.value,
            "is_blocked":        f.is_blocked,
            "upload_time":       fmt_ts(f.upload_time),
            "file_size_bytes":   f.file_size_bytes,
            "detected_patterns": f.detected_patterns,
            "sha256_hash":       f.sha256_hash,
            "storage_url":       f.storage_url,
            "uploader": {
                "user_id":  f.uploader.id,
                "username": f.uploader.username,
            } if f.uploader else None,
        }
        for f in files
    ]


# ──────────────────────────────────────────────
# GET /admin/users
# ──────────────────────────────────────────────

@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    users = db.query(models.User).all()
    return [
        {
            "id":         u.id,
            "username":   u.username,
            "email":      u.email,
            "role":       u.role.value,
            "created_at": fmt_ts(u.created_at),
            "is_active":  u.is_active,
        }
        for u in users
    ]


# ──────────────────────────────────────────────
# PATCH /admin/users/{id}/role
# ──────────────────────────────────────────────

class RoleUpdateRequest(BaseModel):
    role: str


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    body: RoleUpdateRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    valid_roles = {r.value for r in models.UserRole}
    if body.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {valid_roles}")

    user.role = models.UserRole(body.role)
    db.commit()
    return {"user_id": user_id, "new_role": body.role}


# ──────────────────────────────────────────────
# PATCH /admin/users/{id}/status — activate / deactivate
# ──────────────────────────────────────────────

@router.patch("/users/{user_id}/status")
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    """Toggle a user's is_active flag. Admins cannot deactivate themselves."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Admins cannot deactivate themselves")

    user.is_active = not user.is_active
    db.commit()
    return {"user_id": user_id, "is_active": user.is_active}
