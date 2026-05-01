"""
fingerprint_store.py — Duplicate and modified-copy detection via DB look-ups.
"""

from datetime import datetime
from sqlalchemy.orm import Session
import models


# ──────────────────────────────────────────────
# Lookup functions (called before storing)
# ──────────────────────────────────────────────

def check_duplicate(db: Session, sha256_hash: str, fingerprint: str) -> dict:
    """
    Inspect FingerprintStore for:
      - exact_duplicate   : sha256_hash already registered (same content)
      - modified_copy     : fingerprint already registered but hash differs
                            (document start matches a protected file)

    Returns
    -------
    {
        "is_exact_duplicate": bool,
        "is_modified_copy":   bool,
        "original_filename":  str | None,
        "original_classification": str | None,
    }
    """
    result = {
        "is_exact_duplicate":      False,
        "is_modified_copy":        False,
        "original_filename":       None,
        "original_classification": None,
    }

    # Check exact duplicate first
    exact = db.query(models.FingerprintStore).filter(
        models.FingerprintStore.sha256_hash == sha256_hash
    ).first()
    if exact:
        result["is_exact_duplicate"]      = True
        result["original_filename"]       = exact.original_filename
        result["original_classification"] = exact.classification
        return result

    # Check for a modified copy (same fingerprint, different hash)
    modified = db.query(models.FingerprintStore).filter(
        models.FingerprintStore.fingerprint == fingerprint,
        models.FingerprintStore.sha256_hash != sha256_hash,
    ).first()
    if modified:
        result["is_modified_copy"]         = True
        result["original_filename"]        = modified.original_filename
        result["original_classification"]  = modified.classification

    return result


# ──────────────────────────────────────────────
# Registration function (called after successful storage)
# ──────────────────────────────────────────────

def register_fingerprint(
    db: Session,
    sha256_hash: str,
    fingerprint: str,
    original_filename: str,
    classification: str,
) -> None:
    """
    Register a file's hash and fingerprint in FingerprintStore.
    Called only for CONFIDENTIAL and RESTRICTED files that were successfully stored.
    Skips registration if the hash already exists (idempotent).
    """
    existing = db.query(models.FingerprintStore).filter(
        models.FingerprintStore.sha256_hash == sha256_hash
    ).first()
    if existing:
        return  # already registered

    entry = models.FingerprintStore(
        sha256_hash       = sha256_hash,
        fingerprint       = fingerprint,
        original_filename = original_filename,
        classification    = classification,
        registered_at     = datetime.utcnow(),
    )
    db.add(entry)
    db.commit()
