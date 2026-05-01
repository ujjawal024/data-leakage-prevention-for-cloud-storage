"""
content_inspector.py — Regex-based content inspection for sensitive data patterns.
Scans raw text and returns matched pattern names and their sample values.
"""

import re
from typing import Dict, List

# ──────────────────────────────────────────────
# Pattern definitions
# ──────────────────────────────────────────────

PATTERNS: Dict[str, str] = {
    "credit_card":     r"\b(?:4\d{3}|5[1-5]\d{2}|6(?:011|5\d{2})|3[47]\d{2})[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b",
    "ssn":             r"\b\d{3}-\d{2}-\d{4}\b",
    "aadhaar":         r"\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b",
    "pan_card":        r"\b[A-Z]{5}[0-9]{4}[A-Z]\b",
    # IFSC: 4 letters + 0 + 6 alphanumeric (e.g. SBIN0001234)
    "ifsc_code":       r"\b[A-Z]{4}0[A-Z0-9]{6}\b",
    # Bank account: 12-18 digits preceded by account-related keyword context
    "bank_account":    r"(?i)(?:account\s*(?:no|number|#)\s*[:\-]?\s*)(\d{12,18})\b",
    "email":           r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
    "phone_in":        r"\b(?:\+91[-\s]?)?[6-9]\d{9}\b",
    # International phone: must start with + and country code (1-3 digits)
    "phone_intl":      r"\+\d{1,3}[-.\s]\(?\d{1,4}\)?[-.\s]\d{1,4}[-.\s]\d{1,9}\b",
    "ip_address":      r"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b",
    "api_key":         r"(?i)(api[_\-]?key|secret[_\-]?key|access[_\-]?token)\s*[=:]\s*\S+",
    "password":        r"(?i)(password|passwd|pwd)\s*[=:]\s*\S+",
    "private_key":     r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
    "aws_key":         r"AKIA[0-9A-Z]{16}",
    "jwt_token":       r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+",
    "confidential_kw": (
        r"(?i)\b(confidential|restricted|top\s+secret|internal\s+only|"
        r"do\s+not\s+share|proprietary|classified|sensitive)\b"
    ),
    "financial_kw": (
        r"(?i)\b(salary|invoice|bank\s+statement|account\s+number|"
        r"tax\s+return|payroll|budget|revenue|profit|loss)\b"
    ),
}

# Pre-compile for performance
_COMPILED: Dict[str, re.Pattern] = {
    name: re.compile(pattern) for name, pattern in PATTERNS.items()
}


# ──────────────────────────────────────────────
# Main function
# ──────────────────────────────────────────────

def inspect(text: str) -> Dict:
    """
    Scan `text` for all defined sensitive patterns.

    Returns
    -------
    {
        "matches": { pattern_name: [matched_strings, ...], ... },
        "matched_types": [pattern_name, ...]   # flat list of names that hit
    }
    Only patterns that actually matched are included.
    """
    matches: Dict[str, List[str]] = {}

    for name, compiled in _COMPILED.items():
        found = compiled.findall(text)
        if found:
            # findall may return strings or tuples (when groups exist)
            cleaned: List[str] = []
            for item in found:
                if isinstance(item, tuple):
                    # join non-empty groups
                    cleaned.append(" ".join(p for p in item if p))
                else:
                    cleaned.append(item)
            # Deduplicate while preserving order
            seen = set()
            deduped = []
            for v in cleaned:
                if v not in seen:
                    seen.add(v)
                    deduped.append(v)
            matches[name] = deduped[:10]  # cap at 10 samples per pattern

    return {
        "matches": matches,
        "matched_types": list(matches.keys()),
    }
