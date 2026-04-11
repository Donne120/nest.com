from fastapi import FastAPI, Request

from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import os
import logging

from config import settings
from database import engine, SessionLocal
from sqlalchemy import text
import models
from routers import auth, modules, videos, questions, analytics, progress, ws, quiz, organizations, invitations, notes, meetings, ai_assist, transcription, certificates, ats, search, assignments, payments, admin
from routers import lessons as lessons_router
from sqlalchemy import text
import storage as storage_helper

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; "
            "script-src 'none'; "
            "object-src 'none'; "
            "frame-ancestors 'none';"
        )
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=63072000; includeSubDomains; preload"
            )
        return response

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _run_db_setup():
    """Run table creation, migrations, and storage bucket setup in a background thread."""
    try:
        models.Base.metadata.create_all(bind=engine)

        # ─── Create alembic_version table if it doesn't exist ──────────────────
        with engine.connect() as conn:
            try:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS alembic_version (
                        version_num VARCHAR(32) NOT NULL PRIMARY KEY
                    )
                """))
                conn.commit()
                logger.info("✓ alembic_version table ready")
            except Exception as e:
                logger.warning(f"alembic_version table: {e}")
                conn.rollback()

        # ─── Stamp existing migrations if needed ──────────────────────────────────
        with engine.connect() as conn:
            try:
                result = conn.execute(text("SELECT COUNT(*) FROM alembic_version"))
                count = result.scalar()
                if count == 0:
                    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('001')"))
                    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('002')"))
                    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('003')"))
                    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('004')"))
                    conn.commit()
                    logger.info("✓ Stamped migrations 001-004")
            except Exception as e:
                logger.warning(f"Stamping: {e}")
                conn.rollback()

        # ─── Run enum migration (PostgreSQL only) ──────────────────────────────────
        # Check if this is PostgreSQL
        is_postgres = "postgresql" in str(engine.url)
        if not is_postgres:
            logger.info("✓ SQLite detected — skipping enum migration (PostgreSQL only)")
        else:
            # Check if already applied (normal transactional connection)
            with engine.connect() as conn:
                try:
                    result = conn.execute(text("SELECT COUNT(*) FROM alembic_version WHERE version_num = '006'"))
                    already_applied = result.scalar() > 0
                except Exception:
                    already_applied = False

            if already_applied:
                logger.info("✓ Enum migration (006) already applied")
            else:
                logger.info("Running enum migration (006)...")
                # DDL like ALTER TYPE must run with autocommit=True in PostgreSQL
                # (cannot be inside a failed transaction block)
                with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as ddl_conn:
                    try:
                        # Add missing enum values safely (idempotent)
                        for value in ('learner', 'educator', 'owner', 'super_admin'):
                            ddl_conn.execute(text(f"""
                                DO $$ BEGIN
                                    IF NOT EXISTS (
                                        SELECT 1 FROM pg_enum e
                                        JOIN pg_type t ON e.enumtypid = t.oid
                                        WHERE t.typname = 'userrole' AND e.enumlabel = '{value}'
                                    ) THEN
                                        ALTER TYPE userrole ADD VALUE '{value}';
                                    END IF;
                                END $$;
                            """))
                        logger.info("✓ Enum migration (006) completed successfully")
                    except Exception as e:
                        logger.error(f"Enum migration failed: {e}", exc_info=True)

                # Record migration versions in a separate clean transaction
                with engine.connect() as conn:
                    try:
                        conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('005') ON CONFLICT DO NOTHING"))
                        conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('006') ON CONFLICT DO NOTHING"))
                        conn.commit()
                    except Exception as e:
                        logger.warning(f"alembic_version update: {e}")
                        conn.rollback()

        # ─── Add columns to existing tables (each in its own tx so one failure ──
        # ─── doesn't block the rest) ─────────────────────────────────────────
        _cols = [
            "ALTER TABLE answers ADD COLUMN is_ai_generated BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE meeting_bookings ADD COLUMN assignment_id TEXT",
            "ALTER TABLE meeting_bookings ADD COLUMN locked BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE modules ADD COLUMN price FLOAT",
            "ALTER TABLE modules ADD COLUMN is_for_sale BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE modules ADD COLUMN currency VARCHAR DEFAULT 'RWF'",
            "ALTER TABLE organizations ADD COLUMN momo_number VARCHAR",
            "ALTER TABLE organizations ADD COLUMN momo_name VARCHAR",
            "ALTER TABLE users ADD COLUMN payment_verified BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE organizations ADD COLUMN subscription_end TIMESTAMP WITH TIME ZONE",
            "ALTER TABLE organizations ADD COLUMN renewal_notified_at TIMESTAMP WITH TIME ZONE",
            "ALTER TABLE modules ADD COLUMN ai_notes TEXT",
        ]
        # PostgreSQL supports IF NOT EXISTS; wrap each statement for SQLite safety
        for _stmt in _cols:
            _pg_stmt = _stmt.replace("ADD COLUMN ", "ADD COLUMN IF NOT EXISTS ")
            with engine.connect() as conn:
                try:
                    if is_postgres:
                        conn.execute(text("SET statement_timeout = 0"))
                        conn.execute(text(_pg_stmt))
                    else:
                        conn.execute(text(_stmt))
                    conn.commit()
                except Exception as e:
                    logger.warning(f"Column migration skipped (already exists or error): {e}")
                    conn.rollback()

        logger.info("✓ DB setup complete")
    except Exception as e:
        logger.warning(f"DB setup warning (non-fatal): {e}")

    # Ensure Supabase Storage buckets exist with the right policies
    storage_helper.setup_buckets()


def _check_subscriptions():
    """
    Run daily: mark expired subscriptions and send renewal emails.
    - 7 days before expiry  → send renewal reminder (once per cycle)
    - On/after expiry day   → set status=expired and send expired notice
    """
    from datetime import datetime, timezone, timedelta
    import email_utils

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        orgs = db.query(models.Organization).filter(
            models.Organization.subscription_end.isnot(None),
            models.Organization.is_active.is_(True),
        ).all()

        for org in orgs:
            end = org.subscription_end
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)

            days_left = (end - now).days

            # ── Expired ────────────────────────────────────────────────────
            if now >= end:
                if org.subscription_status != models.SubscriptionStatus.expired:
                    org.subscription_status = models.SubscriptionStatus.expired
                    db.commit()

                    # Notify all owners/educators in the org
                    admins = db.query(models.User).filter(
                        models.User.organization_id == org.id,
                        models.User.role.in_([
                            models.UserRole.owner,
                            models.UserRole.educator,
                        ]),
                        models.User.is_active.is_(True),
                    ).all()
                    renew_url = f"{settings.FRONTEND_URL}/pay/submit"
                    for admin in admins:
                        email_utils.send_subscription_expired(
                            to=admin.email,
                            user_name=admin.full_name,
                            org_name=org.name,
                            renew_url=renew_url,
                        )

            # ── 7-day reminder (send once) ─────────────────────────────────
            elif 0 < days_left <= 7 and org.renewal_notified_at is None:
                org.renewal_notified_at = now
                db.commit()

                admins = db.query(models.User).filter(
                    models.User.organization_id == org.id,
                    models.User.role.in_([
                        models.UserRole.owner,
                        models.UserRole.educator,
                    ]),
                    models.User.is_active.is_(True),
                ).all()
                renew_url = f"{settings.FRONTEND_URL}/pay/submit"
                expiry_str = end.strftime("%B %d, %Y")
                for admin in admins:
                    email_utils.send_subscription_renewal_reminder(
                        to=admin.email,
                        user_name=admin.full_name,
                        org_name=org.name,
                        days_left=days_left,
                        expiry_date=expiry_str,
                        renew_url=renew_url,
                    )
    except Exception as e:
        logger.warning(f"Subscription check error: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio

    asyncio.get_event_loop().run_in_executor(None, _run_db_setup)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(
        f"Nest Fledge API started — CORS origins: {settings.get_cors_origins()}"
    )

    async def _subscription_loop():
        while True:
            await asyncio.sleep(86400)  # run every 24 hours
            asyncio.get_event_loop().run_in_executor(None, _check_subscriptions)

    task = asyncio.create_task(_subscription_loop())
    yield
    task.cancel()
    logger.info("Shutting down...")


_is_prod = settings.ENVIRONMENT not in ("development", "dev")

app = FastAPI(
    title="Nest Fledge API",
    description="Production API for the Nest Fledge Platform",
    version="1.0.0",
    lifespan=lifespan,
    # Disable interactive docs in production — they expose the full API surface
    docs_url=None if _is_prod else "/api/docs",
    redoc_url=None if _is_prod else "/api/redoc",
    openapi_url=None if _is_prod else "/api/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)
_cors_origins = settings.get_cors_origins()
_cors_wildcards = [o for o in _cors_origins if o.startswith("*.")]
_cors_exact = [o for o in _cors_origins if not o.startswith("*.")]

class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")
        allowed = origin in _cors_exact or any(
            origin.endswith(wc[1:]) for wc in _cors_wildcards
        )
        if request.method == "OPTIONS":
            response = JSONResponse({}, status_code=200)
        else:
            response = await call_next(request)
        if allowed or not origin:
            response.headers["Access-Control-Allow-Origin"] = origin or "*"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-Requested-With"
        return response

app.add_middleware(DynamicCORSMiddleware)

# Routers
app.include_router(auth.router)
app.include_router(modules.router)
app.include_router(videos.router)
app.include_router(questions.router)
app.include_router(analytics.router)
app.include_router(progress.router)
app.include_router(ws.router)
app.include_router(quiz.router)
app.include_router(organizations.router)
app.include_router(invitations.router)
app.include_router(notes.router)
app.include_router(meetings.router)
app.include_router(ai_assist.router)
app.include_router(transcription.router)
app.include_router(certificates.router)
app.include_router(ats.router)
app.include_router(search.router)
app.include_router(assignments.router)
app.include_router(payments.router)
app.include_router(admin.router)
app.include_router(lessons_router.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0", "service": "nest-fledge"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
