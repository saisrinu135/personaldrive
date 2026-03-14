"""
ProviderRegistryService — pure in-memory catalogue of supported S3-compatible
provider types. No DB, no async needed.
"""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ProviderMeta:
    key: str
    label: str
    logo: str
    default_limit_gb: Optional[float]
    endpoint_template: Optional[str]
    requires_region: bool
    requires_account_id: bool
    requires_namespace: bool
    region_placeholder: str
    endpoint_placeholder: str
    docs_url: str
    notes: str = ""

    def to_dict(self) -> dict:
        return {
            "key": self.key,
            "label": self.label,
            "logo": self.logo,
            "default_limit_gb": self.default_limit_gb,
            "endpoint_template": self.endpoint_template,
            "requires_region": self.requires_region,
            "requires_account_id": self.requires_account_id,
            "requires_namespace": self.requires_namespace,
            "region_placeholder": self.region_placeholder,
            "endpoint_placeholder": self.endpoint_placeholder,
            "docs_url": self.docs_url,
            "notes": self.notes,
        }


_REGISTRY: dict[str, ProviderMeta] = {
    "cloudflare_r2": ProviderMeta(
        key="cloudflare_r2",
        label="Cloudflare R2",
        logo="cloudflare",
        default_limit_gb=10.0,
        endpoint_template="https://{account_id}.r2.cloudflarestorage.com",
        requires_region=True,
        requires_account_id=True,
        requires_namespace=False,
        region_placeholder="auto",
        endpoint_placeholder="https://<ACCOUNT_ID>.r2.cloudflarestorage.com",
        docs_url="https://developers.cloudflare.com/r2/api/s3/api/",
        notes="Use your Account ID from the R2 dashboard as part of the endpoint URL.",
    ),
    "oracle_cloud": ProviderMeta(
        key="oracle_cloud",
        label="Oracle Cloud Object Storage",
        logo="oracle",
        default_limit_gb=20.0,
        endpoint_template="https://{namespace}.compat.objectstorage.{region}.oraclecloud.com",
        requires_region=True,
        requires_account_id=False,
        requires_namespace=True,
        region_placeholder="us-ashburn-1",
        endpoint_placeholder="https://<NAMESPACE>.compat.objectstorage.<REGION>.oraclecloud.com",
        docs_url="https://docs.oracle.com/en-us/iaas/Content/Object/Tasks/s3compatibleapi.htm",
        notes="Use Customer Secret Keys from your OCI user settings as Access/Secret keys.",
    ),
    "aws_s3": ProviderMeta(
        key="aws_s3",
        label="Amazon S3",
        logo="aws",
        default_limit_gb=None,
        endpoint_template="https://s3.{region}.amazonaws.com",
        requires_region=True,
        requires_account_id=False,
        requires_namespace=False,
        region_placeholder="us-east-1",
        endpoint_placeholder="https://s3.us-east-1.amazonaws.com",
        docs_url="https://docs.aws.amazon.com/s3/",
        notes="Use IAM Access Keys. Leave endpoint blank to use AWS default.",
    ),
    "backblaze_b2": ProviderMeta(
        key="backblaze_b2",
        label="Backblaze B2",
        logo="backblaze",
        default_limit_gb=None,
        endpoint_template="https://s3.{region}.backblazeb2.com",
        requires_region=True,
        requires_account_id=False,
        requires_namespace=False,
        region_placeholder="us-west-004",
        endpoint_placeholder="https://s3.us-west-004.backblazeb2.com",
        docs_url="https://www.backblaze.com/docs/cloud-storage-s3-compatible-api",
        notes="Use Application Keys (not Master Key). Region is your bucket region.",
    ),
    "wasabi": ProviderMeta(
        key="wasabi",
        label="Wasabi",
        logo="wasabi",
        default_limit_gb=None,
        endpoint_template="https://s3.{region}.wasabisys.com",
        requires_region=True,
        requires_account_id=False,
        requires_namespace=False,
        region_placeholder="us-east-1",
        endpoint_placeholder="https://s3.us-east-1.wasabisys.com",
        docs_url="https://docs.wasabi.com/docs/what-are-the-service-urls-for-wasabis-different-storage-regions",
        notes="",
    ),
    "digitalocean_spaces": ProviderMeta(
        key="digitalocean_spaces",
        label="DigitalOcean Spaces",
        logo="digitalocean",
        default_limit_gb=None,
        endpoint_template="https://{region}.digitaloceanspaces.com",
        requires_region=True,
        requires_account_id=False,
        requires_namespace=False,
        region_placeholder="nyc3",
        endpoint_placeholder="https://nyc3.digitaloceanspaces.com",
        docs_url="https://docs.digitalocean.com/products/spaces/",
        notes="Use Spaces access keys from the API section of your DigitalOcean account.",
    ),
    "minio": ProviderMeta(
        key="minio",
        label="MinIO (Self-hosted)",
        logo="minio",
        default_limit_gb=None,
        endpoint_template=None,
        requires_region=False,
        requires_account_id=False,
        requires_namespace=False,
        region_placeholder="us-east-1",
        endpoint_placeholder="http://your-minio-host:9000",
        docs_url="https://min.io/docs/minio/linux/developers/python/API.html",
        notes="Enter the full URL to your MinIO instance.",
    ),
    "custom_s3": ProviderMeta(
        key="custom_s3",
        label="Custom S3-Compatible",
        logo="generic",
        default_limit_gb=None,
        endpoint_template=None,
        requires_region=False,
        requires_account_id=False,
        requires_namespace=False,
        region_placeholder="us-east-1",
        endpoint_placeholder="https://your-s3-compatible-endpoint.com",
        docs_url="",
        notes="Any S3-compatible storage service. Provide the full endpoint URL.",
    ),
}


class ProviderRegistryService:
    """In-memory catalogue of supported provider types."""

    def get(self, provider_type: str) -> Optional[ProviderMeta]:
        return _REGISTRY.get(provider_type)

    def list_all(self) -> list[dict]:
        return [meta.to_dict() for meta in _REGISTRY.values()]


# ── Dependency (no DB needed, instantiate directly) ───────────────────────────

def get_registry_service() -> ProviderRegistryService:
    return ProviderRegistryService()