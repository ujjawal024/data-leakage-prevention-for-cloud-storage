"""
classifier.py — Data classification engine.
Maps matched pattern types to: PUBLIC | CONFIDENTIAL | RESTRICTED
"""

from typing import List

# Patterns that force RESTRICTED classification
RESTRICTED_PATTERNS = {
    "credit_card",
    "ssn",
    "aadhaar",
    "pan_card",
    "bank_account",
    "ifsc_code",
    "api_key",
    "password",
    "private_key",
    "aws_key",
    "jwt_token",
}

# Patterns that force CONFIDENTIAL (unless already RESTRICTED)
CONFIDENTIAL_PATTERNS = {
    "confidential_kw",
    "financial_kw",
    "email",
    "phone_in",
    "phone_intl",
    "ip_address",
}


def classify(matched_types: List[str]) -> str:
    """
    Return the highest applicable classification for the given matched pattern types.

    Rules (evaluated in priority order):
      1. Any RESTRICTED pattern present  → "RESTRICTED"
      2. Any CONFIDENTIAL pattern present → "CONFIDENTIAL"
      3. Otherwise                        → "PUBLIC"
    """
    matched_set = set(matched_types)

    if matched_set & RESTRICTED_PATTERNS:
        return "RESTRICTED"

    if matched_set & CONFIDENTIAL_PATTERNS:
        return "CONFIDENTIAL"

    return "PUBLIC"
