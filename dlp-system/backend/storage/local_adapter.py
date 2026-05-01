"""
local_adapter.py — Local filesystem storage adapter for development/testing.
Files are stored in LOCAL_STORAGE_PATH (default: ./local_storage).
Presigned URLs resolve to /dev-download/{file_key}.
"""

import os
import pathlib
from typing import Dict, Optional

from storage.base_adapter import BaseCloudAdapter

LOCAL_STORAGE_PATH = os.getenv("LOCAL_STORAGE_PATH", "./local_storage")


class LocalAdapter(BaseCloudAdapter):

    def __init__(self):
        self.base_path = pathlib.Path(LOCAL_STORAGE_PATH).resolve()
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _resolve(self, file_key: str) -> pathlib.Path:
        """Resolve file_key to an absolute path, rejecting any path traversal."""
        target = (self.base_path / file_key).resolve()
        if not str(target).startswith(str(self.base_path)):
            raise ValueError(f"Path traversal detected for key: {file_key!r}")
        return target

    def upload_file(
        self,
        file_bytes: bytes,
        destination_key: str,
        metadata: Optional[Dict[str, str]] = None,
    ) -> str:
        target = self._resolve(destination_key)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(file_bytes)
        return f"/dev-download/{destination_key}"

    def download_file(self, file_key: str) -> bytes:
        path = self._resolve(file_key)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_key}")
        return path.read_bytes()

    def delete_file(self, file_key: str) -> bool:
        path = self._resolve(file_key)
        if path.exists():
            path.unlink()
            return True
        return False

    def file_exists(self, file_key: str) -> bool:
        try:
            return self._resolve(file_key).exists()
        except ValueError:
            return False

    def generate_presigned_url(self, file_key: str, expiry_seconds: int = 3600) -> str:
        # In dev mode, expose via the /dev-download route served by FastAPI
        return f"/dev-download/{file_key}"
