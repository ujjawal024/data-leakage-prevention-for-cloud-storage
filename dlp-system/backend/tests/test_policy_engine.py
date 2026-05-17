"""
test_policy_engine.py — Unit tests for the DLP policy engine.

Tests cover:
  - RBAC access control (role vs classification)
  - File extension blocking
  - File size enforcement
  - Alert severity mapping
"""

import sys
import os

# Make sure the dlp package is importable from tests/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dlp.policy_engine import evaluate, get_alert_severity, MAX_FILE_SIZE_BYTES


# ──────────────────────────────────────────────
# Allowed uploads
# ──────────────────────────────────────────────

class TestAllowedUploads:
    def test_admin_can_upload_restricted(self):
        allowed, reason = evaluate("admin", "RESTRICTED", 1024, "report.pdf")
        assert allowed is True

    def test_admin_can_upload_confidential(self):
        allowed, reason = evaluate("admin", "CONFIDENTIAL", 1024, "report.pdf")
        assert allowed is True

    def test_admin_can_upload_public(self):
        allowed, reason = evaluate("admin", "PUBLIC", 1024, "report.pdf")
        assert allowed is True

    def test_manager_can_upload_confidential(self):
        allowed, reason = evaluate("manager", "CONFIDENTIAL", 1024, "report.pdf")
        assert allowed is True

    def test_manager_can_upload_public(self):
        allowed, reason = evaluate("manager", "PUBLIC", 1024, "notes.txt")
        assert allowed is True

    def test_employee_can_upload_public(self):
        allowed, reason = evaluate("employee", "PUBLIC", 512, "notes.txt")
        assert allowed is True


# ──────────────────────────────────────────────
# RBAC violations
# ──────────────────────────────────────────────

class TestRBACViolations:
    def test_employee_cannot_upload_confidential(self):
        allowed, reason = evaluate("employee", "CONFIDENTIAL", 1024, "report.pdf")
        assert allowed is False
        assert "employee" in reason.lower()

    def test_employee_cannot_upload_restricted(self):
        allowed, reason = evaluate("employee", "RESTRICTED", 1024, "secrets.pdf")
        assert allowed is False

    def test_manager_cannot_upload_restricted(self):
        allowed, reason = evaluate("manager", "RESTRICTED", 1024, "classified.pdf")
        assert allowed is False
        assert "manager" in reason.lower()

    def test_unknown_role_cannot_upload_anything(self):
        allowed, reason = evaluate("guest", "PUBLIC", 1024, "notes.txt")
        assert allowed is False


# ──────────────────────────────────────────────
# File extension blocking
# ──────────────────────────────────────────────

class TestBlockedExtensions:
    def test_exe_is_blocked(self):
        allowed, reason = evaluate("admin", "PUBLIC", 1024, "malware.exe")
        assert allowed is False
        assert ".exe" in reason

    def test_bat_is_blocked(self):
        allowed, reason = evaluate("admin", "PUBLIC", 1024, "script.bat")
        assert allowed is False
        assert ".bat" in reason

    def test_sh_is_blocked(self):
        allowed, reason = evaluate("admin", "PUBLIC", 1024, "run.sh")
        assert allowed is False
        assert ".sh" in reason

    def test_ps1_is_blocked(self):
        allowed, reason = evaluate("admin", "PUBLIC", 1024, "run.ps1")
        assert allowed is False

    def test_pdf_is_allowed(self):
        allowed, reason = evaluate("admin", "PUBLIC", 1024, "doc.pdf")
        assert allowed is True

    def test_txt_is_allowed(self):
        allowed, reason = evaluate("employee", "PUBLIC", 512, "notes.txt")
        assert allowed is True

    def test_file_without_extension_is_allowed(self):
        allowed, reason = evaluate("admin", "PUBLIC", 1024, "Makefile")
        assert allowed is True


# ──────────────────────────────────────────────
# File size enforcement
# ──────────────────────────────────────────────

class TestFileSizeEnforcement:
    def test_file_at_limit_is_allowed(self):
        allowed, reason = evaluate("admin", "PUBLIC", MAX_FILE_SIZE_BYTES, "big.pdf")
        assert allowed is True

    def test_file_over_limit_is_blocked(self):
        over_limit = MAX_FILE_SIZE_BYTES + 1
        allowed, reason = evaluate("admin", "PUBLIC", over_limit, "huge.pdf")
        assert allowed is False
        assert "50 MB" in reason

    def test_size_check_takes_priority_over_extension(self):
        """Size is checked before extension, so both should fail; size error is returned first."""
        over_limit = MAX_FILE_SIZE_BYTES + 1
        allowed, reason = evaluate("admin", "PUBLIC", over_limit, "big.exe")
        assert allowed is False
        assert "50 MB" in reason


# ──────────────────────────────────────────────
# Alert severity
# ──────────────────────────────────────────────

class TestAlertSeverity:
    def test_restricted_non_admin_is_critical(self):
        assert get_alert_severity("employee", "RESTRICTED") == "critical"
        assert get_alert_severity("manager", "RESTRICTED") == "critical"

    def test_confidential_employee_is_high(self):
        assert get_alert_severity("employee", "CONFIDENTIAL") == "high"

    def test_other_violations_are_medium(self):
        assert get_alert_severity("manager", "CONFIDENTIAL") == "medium"
        assert get_alert_severity("admin", "RESTRICTED") == "medium"
