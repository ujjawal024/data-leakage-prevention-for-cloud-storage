"""
azure_adapter.py — Azure Blob Storage adapter.
Reads config from environment variables.
"""

import os
import datetime
from typing import Dict

from storage.base_adapter import BaseCloudAdapter

AZURE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
AZURE_CONTAINER_NAME    = os.getenv("AZURE_CONTAINER_NAME", "dlp-storage")


class AzureAdapter(BaseCloudAdapter):

    def __init__(self):
        # Import lazily so the package is optional
        from azure.storage.blob import BlobServiceClient
        self.service_client   = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
        self.container_client = self.service_client.get_container_client(AZURE_CONTAINER_NAME)

    def upload_file(
        self,
        file_bytes: bytes,
        destination_key: str,
        metadata: Dict[str, str] | None = None,
    ) -> str:
        blob_client = self.container_client.get_blob_client(destination_key)
        blob_client.upload_blob(file_bytes, overwrite=True, metadata=metadata or {})
        return f"https://{self.service_client.account_name}.blob.core.windows.net/{AZURE_CONTAINER_NAME}/{destination_key}"

    def download_file(self, file_key: str) -> bytes:
        blob_client    = self.container_client.get_blob_client(file_key)
        download_stream = blob_client.download_blob()
        return download_stream.readall()

    def delete_file(self, file_key: str) -> bool:
        try:
            blob_client = self.container_client.get_blob_client(file_key)
            blob_client.delete_blob()
            return True
        except Exception:
            return False

    def file_exists(self, file_key: str) -> bool:
        try:
            blob_client = self.container_client.get_blob_client(file_key)
            return blob_client.exists()
        except Exception:
            return False

    def generate_presigned_url(self, file_key: str, expiry_seconds: int = 3600) -> str:
        from azure.storage.blob import generate_blob_sas, BlobSasPermissions
        sas_token = generate_blob_sas(
            account_name   = self.service_client.account_name,
            container_name = AZURE_CONTAINER_NAME,
            blob_name      = file_key,
            account_key    = self.service_client.credential.account_key,
            permission     = BlobSasPermissions(read=True),
            expiry         = datetime.datetime.utcnow() + datetime.timedelta(seconds=expiry_seconds),
        )
        return (
            f"https://{self.service_client.account_name}.blob.core.windows.net"
            f"/{AZURE_CONTAINER_NAME}/{file_key}?{sas_token}"
        )
