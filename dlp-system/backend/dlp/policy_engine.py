"""
policy_engine.py — RBAC policy evaluation + size and extension enforcement.
"""

from typing import Tuple

# ──────────────────────────────────────────────
# RBAC matrix
# ──────────────────────────────────────────────

ROLE_PERMISSIONS = {
    "admin":    {"PUBLIC", "CONFIDENTIAL", "RESTRICTED"},
    "manager":  {"PUBLIC", "CONFIDENTIAL"},
    "employee": {"PUBLIC"},
}

# File extensions that are always blocked
BLOCKED_EXTENSIONS = {".exe", ".bat", ".sh", ".ps1", ".msi", ".cmd"}

# Maximum allowed file size in bytes (50 MB)
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024


# ──────────────────────────────────────────────
# Alert severity mapping (for policy violations)
# ──────────────────────────────────────────────

def get_alert_severity(role: str, classification: str) -> str:
    """Return the alert severity for a policy violation."""
    if classification == "RESTRICTED" and role != "admin":
        return "critical"
    if classification == "CONFIDENTIAL" and role == "employee":
        return "high"
    return "medium"


# ──────────────────────────────────────────────
# Main evaluation function
# ──────────────────────────────────────────────

def evaluate(
    role: str,
    classification: str,
    file_size_bytes: int,
    filename: str,
) -> Tuple[bool, str]:
    """
    Evaluate whether a user with `role` may upload a file.

    Returns
    -------
    (allowed: bool, reason: str)
      If allowed is False, reason contains a human-readable explanation.
    """
    # 1. File size check
    if file_size_bytes > MAX_FILE_SIZE_BYTES:
        return False, "File size exceeds DLP limit (50 MB)"

    # 2. Extension check
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext in BLOCKED_EXTENSIONS:
        return False, f"Executable file type not permitted ({ext})"

    # 3. RBAC check
    allowed_classifications = ROLE_PERMISSIONS.get(role, set())
    if classification not in allowed_classifications:
        return (
            False,
            f"Role '{role}' is not permitted to upload {classification} files",
        )

    return True, "Upload permitted"
