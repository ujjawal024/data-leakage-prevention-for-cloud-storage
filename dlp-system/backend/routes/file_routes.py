"""
file_routes.py — File management endpoints: upload (full DLP pipeline),
list, download (presigned URL), share, and delete.
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
from storage.cloud_adapter import get_cloud_adapter
import models

from dlp import content_inspector, classifier, hasher
from dlp import fingerprint_store as fp_store
from dlp import policy_engine, monitor

router = APIRouter(prefix="/files", tags=["files"])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ──────────────────────────────────────────────
# POST /files/upload — full DLP pipeline
# ──────────────────────────────────────────────

@router.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ip = _get_client_ip(request)
    file_bytes = await file.read()
    filename   = file.filename or "unnamed"
    file_size  = len(file_bytes)

    # ── Step 1 & 2: Content inspection (decode text for scanning) ──
    try:
        text = file_bytes.decode("utf-8", errors="ignore")
    except Exception:
        text = file_bytes.decode("latin-1", errors="ignore")

    inspection      = content_inspector.inspect(text)
    matched_types   = inspection["matched_types"]
    matches_detail  = inspection["matches"]

    # ── Step 3: Classification ──
    classification = classifier.classify(matched_types)

    # ── Step 4: Hashing ──
    sha256  = hasher.generate_hash(file_bytes)
    fprint  = hasher.generate_fingerprint(file_bytes)

    # ── Step 5: Fingerprint / duplicate check ──
    fp_check       = fp_store.check_duplicate(db, sha256, fprint)
    is_exact_dup   = fp_check["is_exact_duplicate"]
    is_modified    = fp_check["is_modified_copy"]

    # Modified copy of a protected doc → treat as RESTRICTED
    if is_modified:
        classification = "RESTRICTED"
        matched_types  = list(set(matched_types) | {"modified_protected_doc"})

    # ── Step 6 & 7: Policy evaluation ──
    role = current_user.role.value
    allowed, reason = policy_engine.evaluate(role, classification, file_size, filename)

    # ── Step 8: BLOCKED path ──
    if not allowed:
        severity = policy_engine.get_alert_severity(role, classification)

        # Persist blocked FileRecord (no storage URL)
        temp_key = f"blocked/{uuid.uuid4()}"
        file_rec = models.FileRecord(
            uuid_key          = temp_key,
            original_filename = filename,
            uploader_id       = current_user.id,
            classification    = models.Classification(classification),
            sha256_hash       = sha256,
            fingerprint       = fprint,
            storage_url       = None,
            upload_time       = datetime.utcnow(),
            is_blocked        = True,
            file_size_bytes   = file_size,
            detected_patterns = matched_types,
        )
        db.add(file_rec)
        db.commit()
        db.refresh(file_rec)

        # Create alert
        alert = models.Alert(
            triggered_by_user_id = current_user.id,
            file_id              = file_rec.id,
            severity             = models.AlertSeverity(severity),
            reason               = reason,
            details              = (
                f"User '{current_user.username}' attempted to upload "
                f"'{filename}' ({classification}). Patterns: {matched_types}"
            ),
            timestamp = datetime.utcnow(),
            is_read   = False,
        )
        db.add(alert)
        db.commit()

        # Log action
        monitor.log_action(
            db, current_user.id, "upload", filename, classification,
            "blocked", ip, reason,
        )

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "blocked":           True,
                "reason":            reason,
                "classification":    classification,
                "detected_patterns": matched_types,
            },
        )

    # ── Step 9: ALLOWED path ──
    adapter     = get_cloud_adapter()
    storage_key = f"uploads/{uuid.uuid4()}"
    metadata    = {
        "original_filename": filename,
        "uploader":          current_user.username,
        "classification":    classification,
        "sha256":            sha256,
    }
    storage_url = adapter.upload_file(file_bytes, storage_key, metadata)

    # Persist allowed FileRecord
    file_rec = models.FileRecord(
        uuid_key          = storage_key,
        original_filename = filename,
        uploader_id       = current_user.id,
        classification    = models.Classification(classification),
        sha256_hash       = sha256,
        fingerprint       = fprint,
        storage_url       = storage_url,
        upload_time       = datetime.utcnow(),
        is_blocked        = False,
        file_size_bytes   = file_size,
        detected_patterns = matched_types,
    )
    db.add(file_rec)
    db.commit()
    db.refresh(file_rec)

    # Register fingerprint for CONFIDENTIAL/RESTRICTED
    if classification in ("CONFIDENTIAL", "RESTRICTED"):
        fp_store.register_fingerprint(db, sha256, fprint, filename, classification)

    # Log action
    monitor.log_action(
        db, current_user.id, "upload", filename, classification,
        "allowed", ip, f"Stored at {storage_url}",
    )

    return {
        "filename":          filename,
        "classification":    classification,
        "sha256_hash":       sha256,
        "storage_url":       storage_url,
        "detected_patterns": matched_types,
        "is_duplicate":      is_exact_dup,
        "file_size_bytes":   file_size,
        "file_id":           file_rec.id,
        "message":           "File uploaded successfully",
    }


# ──────────────────────────────────────────────
# GET /files/ — list current user's files
# ──────────────────────────────────────────────

@router.get("/")
def list_files(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    files = (
        db.query(models.FileRecord)
        .filter(
            models.FileRecord.uploader_id == current_user.id,
            models.FileRecord.is_blocked  == False,
            models.FileRecord.is_deleted  == False,
        )
        .order_by(models.FileRecord.upload_time.desc())
        .all()
    )
    return [
        {
            "id":                f.id,
            "original_filename": f.original_filename,
            "classification":    f.classification.value,
            "upload_time":       f.upload_time,
            "file_size_bytes":   f.file_size_bytes,
            "detected_patterns": f.detected_patterns,
            "sha256_hash":       f.sha256_hash,
            "storage_url":       f.storage_url,
        }
        for f in files
    ]


# ──────────────────────────────────────────────
# GET /files/{id}/download — generate presigned URL
# ──────────────────────────────────────────────

@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ip = _get_client_ip(request)
    file_rec = db.query(models.FileRecord).filter(
        models.FileRecord.id == file_id,
        models.FileRecord.is_deleted == False,
    ).first()
    if not file_rec:
        raise HTTPException(status_code=404, detail="File not found")

    # Ownership or admin check
    if file_rec.uploader_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Access denied")

    # Classification RBAC check
    allowed, reason = policy_engine.evaluate(
        current_user.role.value,
        file_rec.classification.value,
        0,                          # size already checked on upload
        file_rec.original_filename,
    )
    if not allowed:
        monitor.log_action(
            db, current_user.id, "download",
            file_rec.original_filename, file_rec.classification.value,
            "blocked", ip, reason,
        )
        raise HTTPException(status_code=403, detail=reason)

    adapter     = get_cloud_adapter()
    presigned   = adapter.generate_presigned_url(file_rec.uuid_key, expiry_seconds=3600)

    monitor.log_action(
        db, current_user.id, "download",
        file_rec.original_filename, file_rec.classification.value,
        "allowed", ip, f"Presigned URL generated",
    )

    return {
        "presigned_url": presigned,
        "filename":      file_rec.original_filename,
        "expires_in":    3600,
    }


# ──────────────────────────────────────────────
# POST /files/{id}/share
# ──────────────────────────────────────────────

class ShareRequest(BaseModel):
    target_username: str


@router.post("/{file_id}/share")
def share_file(
    file_id: int,
    body: ShareRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ip = _get_client_ip(request)
    file_rec = db.query(models.FileRecord).filter(
        models.FileRecord.id == file_id,
        models.FileRecord.is_deleted == False,
    ).first()
    if not file_rec:
        raise HTTPException(status_code=404, detail="File not found")

    # Must own or be admin
    if file_rec.uploader_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Access denied")

    # Target user must exist
    target = db.query(models.User).filter(
        models.User.username == body.target_username
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Target user must have permission for this classification
    target_allowed, target_reason = policy_engine.evaluate(
        target.role.value,
        file_rec.classification.value,
        0,
        file_rec.original_filename,
    )

    monitor.log_action(
        db, current_user.id, "share",
        file_rec.original_filename, file_rec.classification.value,
        "allowed" if target_allowed else "blocked",
        ip,
        f"Sharing with '{body.target_username}': {target_reason}",
    )

    return {
        "shared":  target_allowed,
        "reason":  target_reason if not target_allowed else "Share link generated",
        "file_id": file_id,
        "target":  body.target_username,
    }


# ──────────────────────────────────────────────
# DELETE /files/{id}
# ──────────────────────────────────────────────

@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ip = _get_client_ip(request)
    file_rec = db.query(models.FileRecord).filter(
        models.FileRecord.id == file_id,
        models.FileRecord.is_deleted == False,
    ).first()
    if not file_rec:
        raise HTTPException(status_code=404, detail="File not found")

    if file_rec.uploader_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Access denied")

    # Delete from cloud storage if not blocked
    if not file_rec.is_blocked and file_rec.storage_url:
        try:
            adapter = get_cloud_adapter()
            adapter.delete_file(file_rec.uuid_key)
        except Exception:
            pass  # Best-effort cloud deletion

    # Soft delete
    file_rec.is_deleted = True
    db.commit()

    monitor.log_action(
        db, current_user.id, "delete",
        file_rec.original_filename, file_rec.classification.value,
        "allowed", ip, "File deleted",
    )

    return {"deleted": True, "file_id": file_id}
