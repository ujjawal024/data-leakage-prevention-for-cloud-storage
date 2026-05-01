"""
gcp_adapter.py — Google Cloud Storage adapter.
Reads config from environment variables / GOOGLE_APPLICATION_CREDENTIALS file.
"""

import os
import datetime
from typing import Dict

from storage.base_adapter import BaseCloudAdapter

GCP_BUCKET_NAME = os.getenv("GCP_BUCKET_NAME", "dlp-storage")


class GCPAdapter(BaseCloudAdapter):

    def __init__(self):
        # Import lazily so the package is optional
        from google.cloud import storage as gcs
        self.client = gcs.Client()
        self.bucket = self.client.bucket(GCP_BUCKET_NAME)

    def upload_file(
        self,
        file_bytes: bytes,
        destination_key: str,
        metadata: Dict[str, str] | None = None,
    ) -> str:
        blob = self.bucket.blob(destination_key)
        if metadata:
            blob.metadata = metadata
        blob.upload_from_string(file_bytes)
        return f"gs://{GCP_BUCKET_NAME}/{destination_key}"

    def download_file(self, file_key: str) -> bytes:
        blob = self.bucket.blob(file_key)
        return blob.download_as_bytes()

    def delete_file(self, file_key: str) -> bool:
        try:
            blob = self.bucket.blob(file_key)
            blob.delete()
            return True
        except Exception:
            return False

    def file_exists(self, file_key: str) -> bool:
        blob = self.bucket.blob(file_key)
        return blob.exists()

    def generate_presigned_url(self, file_key: str, expiry_seconds: int = 3600) -> str:
        blob = self.bucket.blob(file_key)
        url  = blob.generate_signed_url(
            expiration=datetime.timedelta(seconds=expiry_seconds),
            method="GET",
        )
        return url
