"""
models.py — SQLAlchemy ORM models for the DLP system.
Tables: User, FileRecord, AuditLog, Alert, FingerprintStore
"""

import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from database import Base


# ──────────────────────────────────────────────
# Enums
# ──────────────────────────────────────────────

class UserRole(str, enum.Enum):
    admin    = "admin"
    manager  = "manager"
    employee = "employee"


class Classification(str, enum.Enum):
    PUBLIC       = "PUBLIC"
    CONFIDENTIAL = "CONFIDENTIAL"
    RESTRICTED   = "RESTRICTED"


class AuditAction(str, enum.Enum):
    upload   = "upload"
    download = "download"
    share    = "share"
    delete   = "delete"
    block    = "block"


class AuditResult(str, enum.Enum):
    allowed = "allowed"
    blocked = "blocked"


class AlertSeverity(str, enum.Enum):
    low      = "low"
    medium   = "medium"
    high     = "high"
    critical = "critical"


# ──────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String, unique=True, index=True, nullable=False)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role            = Column(SAEnum(UserRole), default=UserRole.employee, nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)
    is_active       = Column(Boolean, default=True)

    files      = relationship("FileRecord", back_populates="uploader", foreign_keys="FileRecord.uploader_id")
    audit_logs = relationship("AuditLog",   back_populates="user")
    alerts     = relationship("Alert",      back_populates="triggered_by_user", foreign_keys="Alert.triggered_by_user_id")


class FileRecord(Base):
    __tablename__ = "file_records"

    id                = Column(Integer, primary_key=True, index=True)
    uuid_key          = Column(String, unique=True, index=True, nullable=False)
    original_filename = Column(String, nullable=False)
    uploader_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    classification    = Column(SAEnum(Classification), nullable=False)
    sha256_hash       = Column(String, nullable=False)
    fingerprint       = Column(String, nullable=False)
    storage_url       = Column(String, nullable=True)
    upload_time       = Column(DateTime, default=datetime.utcnow)
    is_blocked        = Column(Boolean, default=False)
    is_deleted        = Column(Boolean, default=False)
    file_size_bytes   = Column(Integer, default=0)
    detected_patterns = Column(JSON, default=list)

    uploader = relationship("User", back_populates="files", foreign_keys=[uploader_id])
    alerts   = relationship("Alert", back_populates="file")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    action         = Column(SAEnum(AuditAction), nullable=False)
    filename       = Column(String, nullable=False)
    classification = Column(String, nullable=True)
    result         = Column(SAEnum(AuditResult), nullable=False)
    timestamp      = Column(DateTime, default=datetime.utcnow)
    ip_address     = Column(String, nullable=True)
    details        = Column(String, nullable=True)

    user = relationship("User", back_populates="audit_logs")


class Alert(Base):
    __tablename__ = "alerts"

    id                    = Column(Integer, primary_key=True, index=True)
    triggered_by_user_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_id               = Column(Integer, ForeignKey("file_records.id"), nullable=True)
    severity              = Column(SAEnum(AlertSeverity), nullable=False)
    reason                = Column(String, nullable=False)
    details               = Column(String, nullable=True)
    timestamp             = Column(DateTime, default=datetime.utcnow)
    is_read               = Column(Boolean, default=False)

    triggered_by_user = relationship("User", back_populates="alerts", foreign_keys=[triggered_by_user_id])
    file              = relationship("FileRecord", back_populates="alerts")


class FingerprintStore(Base):
    __tablename__ = "fingerprint_store"

    id                = Column(Integer, primary_key=True, index=True)
    sha256_hash       = Column(String, unique=True, index=True, nullable=False)
    fingerprint       = Column(String, index=True, nullable=False)
    original_filename = Column(String, nullable=False)
    classification    = Column(String, nullable=False)
    registered_at     = Column(DateTime, default=datetime.utcnow)
