"""
hasher.py — SHA-256 file integrity hashing and document fingerprinting.
"""

import hashlib


def generate_hash(file_bytes: bytes) -> str:
    """Return the full SHA-256 hex digest of the provided file bytes."""
    return hashlib.sha256(file_bytes).hexdigest()


def generate_fingerprint(file_bytes: bytes) -> str:
    """
    Return a 64-character document fingerprint.

    The fingerprint is derived from the first 4 096 bytes of the file,
    making it suitable for detecting modified copies of the same document
    even when the rest of the content has changed.
    """
    sample = file_bytes[:4096]
    return hashlib.sha256(sample).hexdigest()[:64]
