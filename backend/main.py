from fastapi import FastAPI, Request

from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import os
import re
import logging

from config import settings
from database import engine, SessionLocal
from sqlalchemy import text
import models
from routers import auth, modules, videos, questions, analytics, progress, ws, quiz, organizations, invitations, notes, meetings, ai_assist, transcription, certificates, ats, search, assignments, payments, admin
from routers import lessons as lessons_router
from routers import public as public_router
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
            # employee_id was the old name for learner_id — rename if still present,
            # and drop the spurious empty learner_id column we may have added first.
            """DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='meeting_bookings' AND column_name='employee_id') THEN
    ALTER TABLE meeting_bookings DROP COLUMN IF EXISTS learner_id;
    ALTER TABLE meeting_bookings RENAME COLUMN employee_id TO learner_id;
  END IF;
END $$""",
            "ALTER TABLE meeting_bookings ADD COLUMN owner_id VARCHAR REFERENCES users(id)",
            "ALTER TABLE meeting_bookings ADD COLUMN requested_at TIMESTAMP WITH TIME ZONE",
            "ALTER TABLE meeting_bookings ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE",
            "ALTER TABLE meeting_bookings ADD COLUMN note TEXT",
            "ALTER TABLE meeting_bookings ADD COLUMN meeting_link VARCHAR",
            "ALTER TABLE meeting_bookings ADD COLUMN decline_reason TEXT",
            "ALTER TABLE meeting_bookings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE",
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
            # migration 013 — extended org payment methods
            "ALTER TABLE organizations ADD COLUMN payment_orange_number VARCHAR",
            "ALTER TABLE organizations ADD COLUMN payment_orange_name VARCHAR",
            "ALTER TABLE organizations ADD COLUMN payment_bank_name VARCHAR",
            "ALTER TABLE organizations ADD COLUMN payment_bank_account VARCHAR",
            "ALTER TABLE organizations ADD COLUMN payment_bank_holder VARCHAR",
            "ALTER TABLE organizations ADD COLUMN payment_instructions TEXT",
            "ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE videos ADD COLUMN is_preview BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE videos ADD COLUMN is_shareable BOOLEAN DEFAULT FALSE NOT NULL",
            # Public directory profile
            "ALTER TABLE organizations ADD COLUMN tagline VARCHAR",
            "ALTER TABLE organizations ADD COLUMN description TEXT",
            "ALTER TABLE organizations ADD COLUMN public_email VARCHAR",
            "ALTER TABLE organizations ADD COLUMN public_phone VARCHAR",
            "ALTER TABLE organizations ADD COLUMN public_whatsapp VARCHAR",
            "ALTER TABLE organizations ADD COLUMN website_url VARCHAR",
            "ALTER TABLE organizations ADD COLUMN country VARCHAR",
            "ALTER TABLE organizations ADD COLUMN city VARCHAR",
            "ALTER TABLE organizations ADD COLUMN is_listed BOOLEAN DEFAULT TRUE NOT NULL",
            # Daily-learning streak
            "ALTER TABLE users ADD COLUMN streak_count INTEGER DEFAULT 0 NOT NULL",
            "ALTER TABLE users ADD COLUMN streak_last_day DATE",
            # Per-video educator study material
            "ALTER TABLE videos ADD COLUMN study_notes TEXT",
            # Assignment worked example (solved problem shown beside learner's work)
            "ALTER TABLE assignments ADD COLUMN worked_example TEXT",
            # Scoped invitations: module-level access + org-wide flag
            "ALTER TABLE invitations ADD COLUMN all_modules BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE invite_links ADD COLUMN all_modules BOOLEAN DEFAULT FALSE NOT NULL",
            # Guest access expiry (per-learner 1-month clock) + one-shot warn guard
            "ALTER TABLE module_access ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE",
            "ALTER TABLE module_access ADD COLUMN expiry_notified_at TIMESTAMP WITH TIME ZONE",
            # Custom per-invite access length (days)
            "ALTER TABLE invitations ADD COLUMN access_days INTEGER",
            "ALTER TABLE invite_links ADD COLUMN access_days INTEGER",
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

        # ─── Auto-list backfill (migration 016) ──────────────────────────────
        # The public directory changed from opt-in to opt-out: orgs are now shown
        # automatically once they have a published course. Existing orgs were all
        # is_listed=FALSE under the old default, so flip them to listed ONCE. Gated
        # on a marker so an org that later opts out stays opted out.
        with engine.connect() as conn:
            try:
                already = conn.execute(
                    text("SELECT COUNT(*) FROM alembic_version WHERE version_num = '016'")
                ).scalar()
                if not already:
                    conn.execute(text("UPDATE organizations SET is_listed = TRUE WHERE is_listed = FALSE"))
                    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('016')"))
                    conn.commit()
                    logger.info("✓ Auto-list backfill (016): existing orgs now discoverable")
            except Exception as e:
                logger.warning(f"Auto-list backfill (016) skipped: {e}")
                conn.rollback()

        # ─── Enum value additions (PostgreSQL only) ──────────────────────────
        if is_postgres:
            _enums = [
                "ALTER TYPE paymenttype ADD VALUE IF NOT EXISTS 'learner_access'",
            ]
            for _stmt in _enums:
                with engine.connect() as conn:
                    try:
                        conn.execute(text(_stmt))
                        conn.commit()
                    except Exception as e:
                        logger.warning(f"Enum migration skipped: {e}")
                        conn.rollback()

        # ─── Email verification tokens table ─────────────────────────────────
        with engine.connect() as conn:
            try:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS email_verification_tokens (
                        id VARCHAR PRIMARY KEY,
                        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        token VARCHAR UNIQUE NOT NULL,
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        used BOOLEAN DEFAULT FALSE NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_email_verification_tokens_token ON email_verification_tokens (token)"))
                conn.commit()
                logger.info("✓ email_verification_tokens table ready")
            except Exception as e:
                logger.warning(f"email_verification_tokens table: {e}")
                conn.rollback()

        # ─── Token revocation table ───────────────────────────────────────────
        with engine.connect() as conn:
            try:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS revoked_tokens (
                        id VARCHAR PRIMARY KEY,
                        jti VARCHAR UNIQUE NOT NULL,
                        revoked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
                    )
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_revoked_tokens_jti ON revoked_tokens (jti)"))
                conn.commit()
                logger.info("✓ revoked_tokens table ready")
            except Exception as e:
                logger.warning(f"revoked_tokens table: {e}")
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


def _check_guest_access():
    """Warn invited (guest) learners ~7 days before their scoped course access
    expires — one in-app notification + one email each, sent once per grant."""
    from datetime import datetime, timezone, timedelta
    import email_utils
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        soon = now + timedelta(days=7)
        rows = db.query(models.ModuleAccess).filter(
            models.ModuleAccess.expires_at.isnot(None),
            models.ModuleAccess.expires_at > now,
            models.ModuleAccess.expires_at <= soon,
            models.ModuleAccess.expiry_notified_at.is_(None),
        ).all()

        for acc in rows:
            end = acc.expires_at
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
            days_left = max(1, (end - now).days)

            learner = db.query(models.User).filter(models.User.id == acc.student_id).first()
            module = db.query(models.Module).filter(models.Module.id == acc.module_id).first()
            if not learner or not module or not learner.is_active:
                acc.expiry_notified_at = now  # don't retry a dangling grant
                db.commit()
                continue

            org = db.query(models.Organization).filter(
                models.Organization.id == learner.organization_id
            ).first()

            # In-app notification
            db.add(models.Notification(
                user_id=learner.id,
                type="access_expiring",
                title="Your access is ending soon",
                message=(
                    f"Your access to “{module.title}” expires in {days_left} "
                    f"day{'s' if days_left != 1 else ''}. Subscribe or contact your "
                    f"tutor to keep learning."
                ),
                reference_id=module.id,
            ))
            acc.expiry_notified_at = now
            db.commit()

            # Email (best-effort)
            try:
                email_utils.send_access_expiring(
                    to=learner.email,
                    learner_name=learner.full_name,
                    org_name=org.name if org else "your school",
                    module_name=module.title,
                    days_left=days_left,
                    expiry_date=end.strftime("%B %d, %Y"),
                    action_url=f"{settings.FRONTEND_URL}/pay/submit",
                )
            except Exception as e:
                logger.warning(f"Guest-access email failed for {learner.email}: {e}")
    except Exception as e:
        logger.warning(f"Guest-access check error: {e}")
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
            asyncio.get_event_loop().run_in_executor(None, _check_guest_access)

    def _cleanup_revoked_tokens():
        """Delete expired entries from revoked_tokens to keep the table small."""
        db = SessionLocal()
        try:
            from datetime import datetime, timezone
            db.query(models.RevokedToken).filter(
                models.RevokedToken.expires_at < datetime.now(timezone.utc)
            ).delete()
            db.commit()
        except Exception as e:
            logger.warning(f"Token cleanup error: {e}")
        finally:
            db.close()

    async def _token_cleanup_loop():
        while True:
            await asyncio.sleep(3600)  # run every hour
            asyncio.get_event_loop().run_in_executor(None, _cleanup_revoked_tokens)

    task = asyncio.create_task(_subscription_loop())
    cleanup_task = asyncio.create_task(_token_cleanup_loop())
    yield
    task.cancel()
    cleanup_task.cancel()
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

# Host-header validation — reject requests with a spoofed/unknown Host.
from starlette.middleware.trustedhost import TrustedHostMiddleware
_allowed_hosts = [h.strip() for h in (settings.ALLOWED_HOSTS or "").split(",") if h.strip()]
if _allowed_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=_allowed_hosts)
def _is_origin_allowed(origin: str) -> bool:
    """Return True if this origin should receive CORS headers.

    SECURITY: this is load-bearing. Because the auth cookie is SameSite=None in
    prod and CORS reflects the origin with Allow-Credentials:true, an allowed
    origin can make credentialed cross-origin requests. So the match must be an
    EXACT allow-list — never a loose prefix/suffix.

    Sources (re-read live so Render env changes apply without a restart):
      1. Exact origins from CORS_ORIGINS.
      2. An optional CORS_ORIGIN_REGEX for preview deploys — must be a full-match
         regex bound to your own Vercel team slug (empty by default = disabled).

    The old `startswith("https://nest-com") and endswith(".vercel.app")` match
    was removed: it trusted attacker-registrable subdomains like
    `https://nest-com-evil.vercel.app` with credentials.
    """
    if not origin:
        return False
    # 1) exact allow-list
    try:
        allowed = set(settings.get_cors_origins())
    except Exception:
        allowed = set()
    if origin in allowed:
        return True
    # 2) optional, opt-in preview regex (full match only)
    pattern = (getattr(settings, "CORS_ORIGIN_REGEX", "") or "").strip()
    if pattern:
        try:
            if re.fullmatch(pattern, origin):
                return True
        except re.error:
            # A misconfigured regex must fail closed, never open.
            return False
    return False


class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")
        allowed = _is_origin_allowed(origin)
        if request.method == "OPTIONS":
            response = JSONResponse({}, status_code=200)
        else:
            response = await call_next(request)
        if allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = (
                "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            )
            response.headers["Access-Control-Allow-Headers"] = (
                "Authorization, Content-Type, Accept, X-Requested-With"
            )
        return response

class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """Reject cross-site state-changing requests that authenticate via cookie.

    The auth cookie is SameSite=None in prod (required for the cross-domain
    Vercel<->Render setup), so the browser attaches it on cross-site requests.
    That's the CSRF surface. We defend it with a strict Origin/Referer check on
    all mutating methods.

    Scope (deliberately narrow so nothing legitimate breaks):
      - Only POST/PUT/PATCH/DELETE are checked (safe methods pass).
      - Only requests that rely on the COOKIE are checked. A request carrying an
        `Authorization: Bearer` header is not CSRF-exploitable — a browser can't
        add that header cross-origin without a preflight, which our CORS blocks
        for foreign origins. So Bearer clients, native apps and curl are exempt.
      - Login/register are exempt: they run before any session cookie exists, so
        there is nothing to forge; they're rate-limited instead.
    If a cookie-authenticated mutating request presents an Origin (or, failing
    that, a Referer) that isn't allow-listed, it's rejected with 403.
    """

    _SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}
    _EXEMPT_PREFIXES = ("/api/auth/login", "/api/auth/register", "/api/auth/logout")

    async def dispatch(self, request: Request, call_next):
        if request.method not in self._SAFE_METHODS:
            path = request.url.path
            has_bearer = bool(request.headers.get("authorization"))
            has_cookie = bool(request.cookies.get("nest_token"))
            exempt = any(path.startswith(p) for p in self._EXEMPT_PREFIXES)
            # Only cookie-only auth on a non-exempt mutating route is at risk.
            if has_cookie and not has_bearer and not exempt:
                origin = request.headers.get("origin", "")
                if not origin:
                    # Fall back to the origin portion of the Referer.
                    m = re.match(r"^(https?://[^/]+)", request.headers.get("referer", ""))
                    origin = m.group(1) if m else ""
                if not origin or not _is_origin_allowed(origin):
                    return JSONResponse(
                        {"detail": "Cross-site request blocked."},
                        status_code=403,
                    )
        return await call_next(request)


app.add_middleware(DynamicCORSMiddleware)
app.add_middleware(CSRFProtectionMiddleware)

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
app.include_router(public_router.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0", "service": "nest-fledge"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
