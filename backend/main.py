from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
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
from routers import auth, modules, videos, questions, analytics, progress, ws, quiz, organizations, invitations, notes, meetings, ai_assist, transcription
from sqlalchemy import text

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    models.Base.metadata.create_all(bind=engine)
    # Column migrations (idempotent)
    with engine.connect() as conn:
        conn.execute(text(
            "ALTER TABLE answers ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE NOT NULL"
        ))
        conn.commit()
    # Create video_transcripts table if it doesn't exist (handled by create_all above)
    # No additional column migrations needed for new tables
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info("🚀 Nest Onboarding API started")
    yield
    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(
    title="Nest Interactive Onboarding API",
    description="Production API for the Nest Interactive Video Onboarding Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0", "service": "nest-onboarding"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
