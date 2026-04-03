"""
Supabase Storage helper.
Handles upload/delete for video files and thumbnails.

Buckets (auto-created on startup via setup_buckets()):
  - videos      : private  (signed URLs, 1-year expiry)
  - thumbnails  : public   (direct public URL, no auth needed)
"""

import uuid
import logging
from supabase import create_client, Client
from config import settings

logger = logging.getLogger(__name__)

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _client


def setup_buckets() -> None:
    """
    Ensure required Supabase Storage buckets exist with the correct policies.
    Called once on app startup — safe to call multiple times.

    - thumbnails : PUBLIC  (browser-loadable image URLs, no auth)
    - videos     : PRIVATE (signed URLs only)
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        logger.warning("Supabase not configured — skipping bucket setup")
        return
    try:
        client = get_client()
        existing = {b.name for b in client.storage.list_buckets()}

        if "thumbnails" not in existing:
            client.storage.create_bucket("thumbnails", options={"public": True})
            logger.info("Storage: created 'thumbnails' bucket (public)")
        else:
            # Ensure it's still public (idempotent update)
            client.storage.update_bucket("thumbnails", options={"public": True})
            logger.info("Storage: 'thumbnails' bucket confirmed public")

        if "videos" not in existing:
            client.storage.create_bucket("videos", options={"public": False})
            logger.info("Storage: created 'videos' bucket (private)")
        else:
            logger.info("Storage: 'videos' bucket already exists")

        if "payment-proofs" not in existing:
            client.storage.create_bucket("payment-proofs", options={"public": False})
            logger.info("Storage: created 'payment-proofs' bucket (private)")
        else:
            logger.info("Storage: 'payment-proofs' bucket already exists")

        if "lesson-images" not in existing:
            client.storage.create_bucket("lesson-images", options={"public": True})
            logger.info("Storage: created 'lesson-images' bucket (public)")
        else:
            logger.info("Storage: 'lesson-images' bucket already exists")

    except Exception as e:
        logger.warning(f"Storage bucket setup warning (non-fatal): {e}")


def upload_video(file_bytes: bytes, filename: str, content_type: str = "video/mp4") -> str:
    """
    Upload a video file to the 'videos' bucket.
    Returns a signed URL valid for 1 year (suited for course content).
    """
    client = get_client()
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "mp4"
    path = f"{uuid.uuid4()}.{ext}"

    client.storage.from_("videos").upload(
        path=path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": "false"},
    )

    # Signed URL — 1 year expiry (31536000 seconds)
    res = client.storage.from_("videos").create_signed_url(path, expires_in=31536000)
    return res["signedURL"]


def upload_thumbnail(file_bytes: bytes, filename: str, content_type: str = "image/jpeg") -> str:
    """
    Upload a thumbnail to the 'thumbnails' bucket (public).
    Returns the permanent public URL.
    """
    client = get_client()
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
    path = f"{uuid.uuid4()}.{ext}"

    client.storage.from_("thumbnails").upload(
        path=path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": "false"},
    )

    url = client.storage.from_("thumbnails").get_public_url(path)

    # storage3 2.x returns a str; guard against any future dict shape
    if isinstance(url, dict):
        url = url.get("publicUrl") or url.get("publicURL") or ""

    if not url or not url.startswith("http"):
        raise RuntimeError(f"get_public_url returned unexpected value: {url!r}")

    logger.info(f"Thumbnail uploaded: {url}")
    return url


def delete_file(bucket: str, url: str) -> None:
    """Best-effort delete — errors are logged, not raised."""
    try:
        client = get_client()
        # Extract path from URL
        path = url.split(f"/storage/v1/object/")[-1].split("?")[0]
        path = path.replace(f"public/{bucket}/", "").replace(f"sign/{bucket}/", "")
        client.storage.from_(bucket).remove([path])
    except Exception as e:
        logger.warning(f"Storage delete failed ({bucket}): {e}")
