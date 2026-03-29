from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
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
from database import engine
from sqlalchemy import text
import models
from routers import auth, modules, videos, questions, analytics, progress, ws, quiz, organizations, invitations, notes, meetings, ai_assist, transcription, certificates, ats, search, assignments
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
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _run_db_setup():
    """Run table creation, migrations, and storage bucket setup in a background thread."""
    try:
        models.Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            conn.execute(text("SET statement_timeout = 0"))

            # ─── Stamp migrations if alembic_version is empty (first run) ───────────
            try:
                result = conn.execute(text("SELECT COUNT(*) FROM alembic_version"))
                count = result.scalar()
                if count == 0:
                    # Stamp migrations 001-004 as already applied
                    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('001')"))
                    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('002')"))
                    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('003')"))
                    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('004')"))
                    conn.commit()
                    logger.info("Stamped existing migrations 001-004 in alembic_version")
            except Exception as e:
                logger.warning(f"Alembic stamping skipped (may not be needed): {e}")

            conn.execute(text(
                "ALTER TABLE answers ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE NOT NULL"
            ))
            conn.execute(text(
                "ALTER TABLE meeting_bookings ADD COLUMN IF NOT EXISTS assignment_id TEXT"
            ))
            conn.execute(text(
                "ALTER TABLE meeting_bookings ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE NOT NULL"
            ))
            conn.commit()

        # ─── Run any pending migrations (outside connection block) ─────────────────
        try:
            # Manually run the enum migration (simpler than alembic)
            with engine.connect() as conn:
                # Check if migration 006 was already applied
                result = conn.execute(text("SELECT COUNT(*) FROM alembic_version WHERE version_num = '006'"))
                if result.scalar() == 0:
                    logger.info("Running enum migration (006)...")
                    # Rename old enum
                    try:
                        conn.execute(text("ALTER TYPE userrole RENAME TO userrole_old"))
                    except:
                        pass  # May not exist on first run

                    # Create new enum with new values
                    conn.execute(text("""
                        CREATE TYPE userrole AS ENUM (
                            'learner',
                            'educator',
                            'owner',
                            'super_admin'
                        )
                    """))

                    # Update columns
                    conn.execute(text("""
                        ALTER TABLE users
                        ALTER COLUMN role TYPE userrole USING role::text::userrole
                    """))
                    conn.execute(text("""
                        ALTER TABLE organizations
                        ALTER COLUMN default_role TYPE userrole USING default_role::text::userrole
                    """))

                    # Drop old enum
                    try:
                        conn.execute(text("DROP TYPE userrole_old"))
                    except:
                        pass

                    # Mark migration as applied
                    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('005')"))
                    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('006')"))
                    conn.commit()
                    logger.info("✓ Enum migration (006) completed successfully")
                else:
                    logger.info("✓ Enum migration (006) already applied")
        except Exception as e:
            logger.error(f"Enum migration failed: {e}", exc_info=True)

        logger.info("DB setup complete")
    except Exception as e:
        logger.warning(f"DB setup warning (non-fatal): {e}")

    # Ensure Supabase Storage buckets exist with the right policies
    storage_helper.setup_buckets()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run DB setup in background so the server binds the port immediately
    import asyncio
    asyncio.get_event_loop().run_in_executor(None, _run_db_setup)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"Nest Fledge API started — CORS origins: {settings.get_cors_origins()}")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Nest Fledge API",
    description="Production API for the Nest Fledge Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

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


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0", "service": "nest-fledge"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
