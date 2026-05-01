"""
cloud_adapter.py — Factory that returns the correct cloud adapter based on CLOUD_PROVIDER env var.
Default: local (no cloud account required for development).
"""

import os
from storage.base_adapter import BaseCloudAdapter


def get_cloud_adapter() -> BaseCloudAdapter:
    """
    Return an instantiated cloud storage adapter.

    CLOUD_PROVIDER env var controls which adapter is used:
      local  → LocalAdapter  (default, stores files on disk)
      aws    → AWSAdapter    (requires boto3 + AWS credentials)
      gcp    → GCPAdapter    (requires google-cloud-storage + credentials)
      azure  → AzureAdapter  (requires azure-storage-blob + connection string)
    """
    provider = os.getenv("CLOUD_PROVIDER", "local").lower()

    if provider == "local":
        from storage.local_adapter import LocalAdapter
        return LocalAdapter()

    if provider == "aws":
        from storage.aws_adapter import AWSAdapter
        return AWSAdapter()

    if provider == "gcp":
        from storage.gcp_adapter import GCPAdapter
        return GCPAdapter()

    if provider == "azure":
        from storage.azure_adapter import AzureAdapter
        return AzureAdapter()

    raise ValueError(f"Unknown CLOUD_PROVIDER: '{provider}'. Must be one of: local, aws, gcp, azure")
