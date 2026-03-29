from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
import models
import auth as auth_utils
from config import settings
import httpx
import json
from pydantic import BaseModel

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _fmt_time(s: float) -> str:
    m, sec = int(s // 60), int(s % 60)
    return f"{m:02d}:{sec:02d}"


def _get_transcript_context(transcript: models.VideoTranscript | None, timestamp: float) -> str:
    """Extract the most relevant transcript text around a given timestamp."""
    if not transcript or not transcript.full_text:
        return ""

    # If we have timestamped segments, extract the window around the question
    if transcript.segments:
        window_start = max(0.0, timestamp - 120)   # 2 min before
        window_end = timestamp + 60                 # 1 min after

        relevant = [
            s["text"].strip()
            for s in transcript.segments
            if s.get("start", 0) <= window_end and s.get("end", 0) >= window_start
        ]
        if relevant:
            return " ".join(relevant)

    # Manual transcript — return a chunk of text that's proportionally positioned
    # Estimate character position based on timestamp vs video duration
    text = transcript.full_text
    if len(text) <= 1200:
        return text  # short enough to include whole thing

    # Rough split: take 1200 chars centered around the estimated position
    total = len(text)
    center = int(total * 0.5)  # fallback: middle of transcript
    start = max(0, center - 600)
    end = min(total, center + 600)
    return text[start:end]


async def _stream_groq(messages: list):
    """Yield tokens from Groq Llama-3.3-70b via SSE."""
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "stream": True,
        "max_tokens": 1800,
        "temperature": 0.65,
    }
    async with httpx.AsyncClient(timeout=90) as client:
        async with client.stream(
            "POST",
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        token = chunk["choices"][0]["delta"].get("content", "")
                        if token:
                            yield token
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue


@router.get("/stream/{question_id}")
async def stream_ai_answer(
    question_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Stream an AI-generated answer for a question.
    The AI acts as a subject-matter teacher, aware of the module/video context
    and — when available — the actual transcript of what was being taught.
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured. Add GROQ_API_KEY to .env")

    # Load question → video → module (scoped to org)
    question = (
        db.query(models.Question)
        .join(models.Video, models.Question.video_id == models.Video.id)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(
            models.Question.id == question_id,
            models.Module.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    video = question.video
    module = video.module
    transcript = video.transcript  # may be None

    # Build transcript context
    transcript_ctx = _get_transcript_context(transcript, question.timestamp_seconds)

    transcript_block = ""
    if transcript_ctx:
        transcript_block = f"""
Transcript of what was being taught at this moment in the video:
\"\"\"
{transcript_ctx}
\"\"\"
Use this as your primary source — the student is asking about content from this exact portion of the lesson.
"""
    else:
        transcript_block = (
            "\n(No transcript available — answer based on the module/video context and your expertise.)"
        )

    system_prompt = f"""You are an expert, patient teacher helping a learner in a professional training course.

Course Module: "{module.title}"
{f'Module Overview: {module.description}' if module.description else ''}
Video: "{video.title}"
{f'Video Topic: {video.description}' if video.description else ''}
Question asked at: {_fmt_time(question.timestamp_seconds)} in the video
{transcript_block}
Your role is to answer the student's question as a great teacher would:
- Ground your answer in the transcript above when it's relevant
- Stay on topic with the course subject — do not answer unrelated questions
- Break the explanation down clearly with sections using ## headers
- Use real-world examples and analogies to make concepts click
- For math, use LaTeX notation: inline with $expression$ and block equations with $$expression$$
- Be warm, encouraging, and pedagogically clear
- Keep answers thorough but focused — typically 3–6 sections"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question.question_text},
    ]

    # Pre-capture values needed inside the generator closure
    q_id = question_id
    asker_id = question.asked_by
    org_id = current_user.organization_id
    q_text_preview = question.question_text[:60]
    collected: list[str] = []

    async def generate():
        try:
            async for token in _stream_groq(messages):
                collected.append(token)
                yield f"data: {json.dumps({'token': token})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

        full_answer = "".join(collected)

        if not full_answer.strip():
            yield f"data: {json.dumps({'done': True})}\n\n"
            return

        # Save AI answer only once (idempotent)
        existing = db.query(models.Answer).filter(
            models.Answer.question_id == q_id,
            models.Answer.is_ai_generated == True,
        ).first()

        if not existing:
            ai_answer = models.Answer(
                question_id=q_id,
                answered_by=asker_id,
                answer_text=full_answer,
                is_official=False,
                is_ai_generated=True,
            )
            db.add(ai_answer)

            # Update question status
            q_obj = db.query(models.Question).filter(models.Question.id == q_id).first()
            if q_obj and q_obj.status == models.QuestionStatus.pending:
                q_obj.status = models.QuestionStatus.answered

            # Notify managers/admins to review
            managers = db.query(models.User).filter(
                models.User.organization_id == org_id,
                models.User.role.in_([models.UserRole.educator, models.UserRole.owner]),
                models.User.is_active == True,
            ).all()
            for mgr in managers:
                db.add(models.Notification(
                    user_id=mgr.id,
                    type="ai_answer_ready",
                    title="AI answered — please review",
                    message=f"AI answered: {q_text_preview}...",
                    reference_id=q_id,
                ))
            db.commit()

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ─── Direct Ask (no DB, no admin notifications) ───────────────────────────────

class DirectAskRequest(BaseModel):
    question: str
    video_id: str
    timestamp: float = 0.0


@router.post("/direct-ask")
async def direct_ask_stream(
    req: DirectAskRequest,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Stream an AI answer for any free-form question a learner asks while watching.
    Nothing is saved to the database and no one is notified.
    The whiteboard is purely ephemeral.
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured. Add GROQ_API_KEY to .env")

    # Load video + module (scoped to org) for context
    video = (
        db.query(models.Video)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(
            models.Video.id == req.video_id,
            models.Module.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    module = video.module
    transcript = video.transcript

    transcript_ctx = _get_transcript_context(transcript, req.timestamp)
    if transcript_ctx:
        transcript_block = f"""
Transcript of what was being taught at this moment in the video:
\"\"\"
{transcript_ctx}
\"\"\"
Use this as your primary source — the learner is asking about content from this exact portion of the lesson.
"""
    else:
        transcript_block = (
            "\n(No transcript available — answer based on the module/video context and your expertise.)"
        )

    system_prompt = f"""You are an expert, patient teacher helping a learner in a professional training course.

Course Module: "{module.title}"
{f'Module Overview: {module.description}' if module.description else ''}
Video: "{video.title}"
{f'Video Topic: {video.description}' if video.description else ''}
Question asked at: {_fmt_time(req.timestamp)} in the video
{transcript_block}
Your role is to answer the learner's question as a great teacher would:
- Ground your answer in the transcript above when it's relevant
- Stay on topic with the course subject — do not answer unrelated questions
- Break the explanation down clearly with sections using ## headers
- Use real-world examples and analogies to make concepts click
- For math, use LaTeX notation: inline with $expression$ and block equations with $$expression$$
- Be warm, encouraging, and pedagogically clear
- Keep answers thorough but focused — typically 3–6 sections"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": req.question},
    ]

    async def generate():
        try:
            async for token in _stream_groq(messages):
                yield f"data: {json.dumps({'token': token})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
