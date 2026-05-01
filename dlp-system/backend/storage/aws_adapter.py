"""
aws_adapter.py — AWS S3 storage adapter (default cloud provider).
Reads credentials and config from environment variables.
"""

import os
from typing import Dict

import boto3
from botocore.exceptions import ClientError

from storage.base_adapter import BaseCloudAdapter

AWS_ACCESS_KEY_ID     = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION            = os.getenv("AWS_REGION", "us-east-1")
AWS_BUCKET_NAME       = os.getenv("AWS_BUCKET_NAME", "dlp-storage")


class AWSAdapter(BaseCloudAdapter):

    def __init__(self):
        self.client = boto3.client(
            "s3",
            aws_access_key_id     = AWS_ACCESS_KEY_ID,
            aws_secret_access_key = AWS_SECRET_ACCESS_KEY,
            region_name           = AWS_REGION,
        )
        self.bucket = AWS_BUCKET_NAME

    def upload_file(
        self,
        file_bytes: bytes,
        destination_key: str,
        metadata: Dict[str, str] | None = None,
    ) -> str:
        kwargs = {"Bucket": self.bucket, "Key": destination_key, "Body": file_bytes}
        if metadata:
            kwargs["Metadata"] = {k: str(v) for k, v in metadata.items()}
        self.client.put_object(**kwargs)
        return f"s3://{self.bucket}/{destination_key}"

    def download_file(self, file_key: str) -> bytes:
        response = self.client.get_object(Bucket=self.bucket, Key=file_key)
        return response["Body"].read()

    def delete_file(self, file_key: str) -> bool:
        try:
            self.client.delete_object(Bucket=self.bucket, Key=file_key)
            return True
        except ClientError:
            return False

    def file_exists(self, file_key: str) -> bool:
        try:
            self.client.head_object(Bucket=self.bucket, Key=file_key)
            return True
        except ClientError:
            return False

    def generate_presigned_url(self, file_key: str, expiry_seconds: int = 3600) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": file_key},
            ExpiresIn=expiry_seconds,
        )
