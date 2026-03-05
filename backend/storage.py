"""
Supabase Storage helper.
Handles upload/delete for video files and thumbnails.

Buckets (create once in Supabase dashboard → Storage):
  - videos      : private  (signed URLs, 1-hour expiry)
  - thumbnails  : public   (direct public URL)
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

    res = client.storage.from_("thumbnails").get_public_url(path)
    return res


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
