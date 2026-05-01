"""
base_adapter.py — Abstract base class for all cloud storage adapters.
Every concrete adapter must implement all five methods below.
"""

from abc import ABC, abstractmethod
from typing import Dict, Optional


class BaseCloudAdapter(ABC):

    @abstractmethod
    def upload_file(
        self,
        file_bytes: bytes,
        destination_key: str,
        metadata: Optional[Dict[str, str]] = None,
    ) -> str:
        """Upload `file_bytes` to `destination_key`. Returns the storage URL."""

    @abstractmethod
    def download_file(self, file_key: str) -> bytes:
        """Download and return the raw bytes of the object at `file_key`."""

    @abstractmethod
    def delete_file(self, file_key: str) -> bool:
        """Delete the object at `file_key`. Returns True on success."""

    @abstractmethod
    def file_exists(self, file_key: str) -> bool:
        """Return True if an object exists at `file_key`."""

    @abstractmethod
    def generate_presigned_url(self, file_key: str, expiry_seconds: int = 3600) -> str:
        """Return a time-limited URL that allows downloading the object."""
