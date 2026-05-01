"""
monitor.py — Audit log writer. Called after EVERY operation, success or failure.
"""

from datetime import datetime
from sqlalchemy.orm import Session
import models


def log_action(
    db: Session,
    user_id: int,
    action: str,
    filename: str,
    classification: str,
    result: str,
    ip_address: str = "",
    details: str = "",
) -> models.AuditLog:
    """
    Write one row to the AuditLog table.

    Parameters
    ----------
    db             : active SQLAlchemy session
    user_id        : ID of the acting user
    action         : upload | download | share | delete | block
    filename       : original filename
    classification : PUBLIC | CONFIDENTIAL | RESTRICTED (or empty)
    result         : allowed | blocked
    ip_address     : client IP, if available
    details        : free-text context (reason for block, share target, etc.)
    """
    log_entry = models.AuditLog(
        user_id        = user_id,
        action         = models.AuditAction(action),
        filename       = filename,
        classification = classification,
        result         = models.AuditResult(result),
        timestamp      = datetime.utcnow(),
        ip_address     = ip_address or "",
        details        = details or "",
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
