import sys
from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./nest_fledge.db"
    # No default — must be set as an env var.  Startup fails fast if missing.
    SECRET_KEY: str = ""  # Must be set via env var — see startup gate below
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour
    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000"]'
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 500
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # Groq AI
    GROQ_API_KEY: str = ""

    # SendGrid (preferred) — falls back to Resend, then SMTP
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM: str = ""

    # Resend (fallback)
    RESEND_API_KEY: str = ""
    RESEND_FROM: str = "onboarding@resend.dev"

    # Admin notification email — receives alerts when payments are submitted
    # Must be set via ADMIN_NOTIFICATION_EMAIL env var in production.
    ADMIN_NOTIFICATION_EMAIL: str = ""

    # Secret key to protect the one-time seed endpoint (set in Render env vars)
    # Must be at least 32 chars of random data.
    SEED_SECRET: str = ""

    # SMTP (optional — invitations fall back to URL-only if not set)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@nestapp.com"

    def get_cors_origins(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except (json.JSONDecodeError, ValueError):
            return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings()

# ── Startup security gate ────────────────────────────────────────────────────
# Fail immediately if critical secrets are not configured.
# This prevents accidentally running production with insecure defaults.

_KNOWN_WEAK_KEYS = {
    "",
    "dev-secret-key-change-in-production-32chars",
    "secret",
    "changeme",
    "your-secret-key",
}

if settings.ENVIRONMENT != "development":
    # Production / staging must have a real SECRET_KEY
    if not settings.SECRET_KEY or settings.SECRET_KEY in _KNOWN_WEAK_KEYS:
        sys.exit(
            "FATAL: SECRET_KEY env var is not set or is using a known weak default. "
            "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
        )
    if len(settings.SECRET_KEY) < 32:
        sys.exit(
            "FATAL: SECRET_KEY must be at least 32 characters. "
            "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
        )
else:
    # In development, warn loudly if still on the known weak default
    if settings.SECRET_KEY in _KNOWN_WEAK_KEYS or not settings.SECRET_KEY:
        import logging
        logging.getLogger(__name__).warning(
            "⚠️  SECRET_KEY is weak/unset. Fine for development, but MUST be "
            "changed before deploying to production."
        )
