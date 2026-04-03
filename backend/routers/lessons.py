from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi import Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import get_db
import models
import schemas
import auth as auth_utils
from routers.ws import manager as ws_manager
import storage as storage_helper

router = APIRouter(tags=["lessons"])
limiter = Limiter(key_func=get_remote_address)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _org_lesson(lesson_id: str, org_id: str, db: Session) -> models.Lesson:
    lesson = (
        db.query(models.Lesson)
        .join(models.Module, models.Lesson.module_id == models.Module.id)
        .filter(
            models.Lesson.id == lesson_id,
            models.Module.organization_id == org_id,
        )
        .first()
    )
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


def _org_lesson_question(
    question_id: str, org_id: str, db: Session
) -> models.LessonQuestion:
    q = (
        db.query(models.LessonQuestion)
        .join(models.Lesson, models.LessonQuestion.lesson_id == models.Lesson.id)
        .join(models.Module, models.Lesson.module_id == models.Module.id)
        .filter(
            models.LessonQuestion.id == question_id,
            models.Module.organization_id == org_id,
        )
        .first()
    )
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q


def _lesson_question_count(lesson: models.Lesson, db: Session) -> int:
    return (
        db.query(func.count(models.LessonQuestion.id))
        .filter(models.LessonQuestion.lesson_id == lesson.id)
        .scalar()
    )


def _lesson_out(lesson: models.Lesson, db: Session) -> schemas.LessonOut:
    return schemas.LessonOut(
        id=lesson.id,
        module_id=lesson.module_id,
        title=lesson.title,
        description=lesson.description,
        content=lesson.content,
        order_index=lesson.order_index,
        is_published=lesson.is_published,
        created_at=lesson.created_at,
        question_count=_lesson_question_count(lesson, db),
    )


# ─── Lesson CRUD ──────────────────────────────────────────────────────────────

@router.get("/api/lessons/module/{module_id}", response_model=List[schemas.LessonOut])
def list_lessons(
    module_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    module = db.query(models.Module).filter(
        models.Module.id == module_id,
        models.Module.organization_id == current_user.organization_id,
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    if (
        current_user.role == models.UserRole.learner
        and not current_user.payment_verified
    ):
        raise HTTPException(status_code=403, detail="Access requires approved payment")

    lessons = (
        db.query(models.Lesson)
        .filter(
            models.Lesson.module_id == module_id,
            models.Lesson.is_published.is_(True),
        )
        .order_by(models.Lesson.order_index)
        .all()
    )
    return [_lesson_out(l, db) for l in lessons]


@router.post("/api/lessons", response_model=schemas.LessonOut, status_code=201)
def create_lesson(
    payload: schemas.LessonCreate,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    module = db.query(models.Module).filter(
        models.Module.id == payload.module_id,
        models.Module.organization_id == current_user.organization_id,
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    lesson = models.Lesson(
        module_id=payload.module_id,
        title=payload.title,
        description=payload.description,
        content=[b.model_dump() for b in payload.content] if payload.content else [],
        order_index=payload.order_index,
        created_by=current_user.id,
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return _lesson_out(lesson, db)


@router.get("/api/lessons/{lesson_id}", response_model=schemas.LessonOut)
def get_lesson(
    lesson_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    if (
        current_user.role == models.UserRole.learner
        and not current_user.payment_verified
    ):
        raise HTTPException(status_code=403, detail="Access requires approved payment")
    lesson = _org_lesson(lesson_id, current_user.organization_id, db)
    return _lesson_out(lesson, db)


@router.put("/api/lessons/{lesson_id}", response_model=schemas.LessonOut)
def update_lesson(
    lesson_id: str,
    payload: schemas.LessonUpdate,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    lesson = _org_lesson(lesson_id, current_user.organization_id, db)
    data = payload.model_dump(exclude_unset=True)
    if "content" in data and data["content"] is not None:
        data["content"] = [
            b.model_dump() if hasattr(b, "model_dump") else b
            for b in data["content"]
        ]
    for field, value in data.items():
        setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    return _lesson_out(lesson, db)


@router.delete("/api/lessons/{lesson_id}", status_code=204)
def delete_lesson(
    lesson_id: str,
    current_user: models.User = Depends(auth_utils.require_owner),
    db: Session = Depends(get_db),
):
    lesson = _org_lesson(lesson_id, current_user.organization_id, db)
    db.delete(lesson)
    db.commit()


@router.post("/api/lessons/{lesson_id}/upload-image")
async def upload_lesson_image(
    lesson_id: str,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    _org_lesson(lesson_id, current_user.organization_id, db)
    content = await file.read()
    url = storage_helper.upload_thumbnail(
        content, file.filename or "image.jpg", file.content_type or "image/jpeg"
    )
    return {"url": url}


# ─── Lesson Questions ─────────────────────────────────────────────────────────

@router.get(
    "/api/lessons/{lesson_id}/questions",
    response_model=List[schemas.LessonQuestionOut],
)
def list_lesson_questions(
    lesson_id: str,
    block_id: Optional[str] = Query(None),
    status: Optional[models.QuestionStatus] = Query(None),
    my_questions: bool = Query(False),
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _org_lesson(lesson_id, current_user.organization_id, db)
    q = db.query(models.LessonQuestion).filter(
        models.LessonQuestion.lesson_id == lesson_id
    )
    if block_id:
        q = q.filter(models.LessonQuestion.block_id == block_id)
    if status:
        q = q.filter(models.LessonQuestion.status == status)
    if my_questions:
        q = q.filter(models.LessonQuestion.asked_by == current_user.id)
    elif current_user.role == models.UserRole.learner:
        q = q.filter(
            (models.LessonQuestion.is_public.is_(True))
            | (models.LessonQuestion.asked_by == current_user.id)
        )
    return q.order_by(models.LessonQuestion.created_at).all()


@router.post(
    "/api/lesson-questions",
    response_model=schemas.LessonQuestionOut,
    status_code=201,
)
async def create_lesson_question(
    payload: schemas.LessonQuestionCreate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _org_lesson(payload.lesson_id, current_user.organization_id, db)

    question = models.LessonQuestion(
        lesson_id=payload.lesson_id,
        block_id=payload.block_id,
        asked_by=current_user.id,
        question_text=payload.question_text,
        is_public=payload.is_public,
    )
    db.add(question)

    managers = db.query(models.User).filter(
        models.User.organization_id == current_user.organization_id,
        models.User.role.in_([models.UserRole.educator, models.UserRole.owner]),
        models.User.is_active.is_(True),
    ).all()
    for mgr in managers:
        db.add(models.Notification(
            user_id=mgr.id,
            type="new_question",
            title="New Lesson Question",
            message=(
                f"{current_user.full_name} asked: "
                f"{payload.question_text[:60]}..."
            ),
            reference_id=question.id,
        ))

    db.commit()
    db.refresh(question)

    await ws_manager.broadcast({
        "event": "new_lesson_question",
        "question_id": question.id,
        "lesson_id": question.lesson_id,
        "block_id": question.block_id,
        "asked_by": current_user.full_name,
    })
    return question


@router.get(
    "/api/lesson-questions/{question_id}",
    response_model=schemas.LessonQuestionOut,
)
def get_lesson_question(
    question_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    q = _org_lesson_question(question_id, current_user.organization_id, db)
    q.view_count += 1
    db.commit()
    db.refresh(q)
    return q


@router.put(
    "/api/lesson-questions/{question_id}",
    response_model=schemas.LessonQuestionOut,
)
def update_lesson_question(
    question_id: str,
    payload: schemas.LessonQuestionUpdate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    q = _org_lesson_question(question_id, current_user.organization_id, db)
    if q.asked_by != current_user.id and current_user.role == models.UserRole.learner:
        raise HTTPException(status_code=403, detail="Not authorized")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(q, field, value)
    db.commit()
    db.refresh(q)
    return q


@router.delete("/api/lesson-questions/{question_id}", status_code=204)
def delete_lesson_question(
    question_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    q = _org_lesson_question(question_id, current_user.organization_id, db)
    if q.asked_by != current_user.id and current_user.role == models.UserRole.learner:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(q)
    db.commit()


@router.post(
    "/api/lesson-questions/{question_id}/answers",
    response_model=schemas.LessonAnswerOut,
    status_code=201,
)
async def add_lesson_answer(
    question_id: str,
    payload: schemas.LessonAnswerCreate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    q = _org_lesson_question(question_id, current_user.organization_id, db)

    answer = models.LessonAnswer(
        question_id=question_id,
        answered_by=current_user.id,
        answer_text=payload.answer_text,
        is_official=(
            payload.is_official
            and current_user.role in [models.UserRole.educator, models.UserRole.owner]
        ),
    )
    db.add(answer)

    if current_user.role in [models.UserRole.educator, models.UserRole.owner]:
        q.status = models.QuestionStatus.answered

    db.add(models.Notification(
        user_id=q.asked_by,
        type="question_answered",
        title="Your question was answered",
        message=f"{current_user.full_name} answered your question",
        reference_id=question_id,
    ))
    db.commit()
    db.refresh(answer)

    await ws_manager.broadcast({
        "event": "lesson_question_answered",
        "question_id": question_id,
        "answered_by": current_user.full_name,
    })
    return answer


@router.put(
    "/api/lesson-questions/{question_id}/answers/{answer_id}",
    response_model=schemas.LessonAnswerOut,
)
def edit_lesson_answer(
    question_id: str,
    answer_id: str,
    payload: schemas.LessonAnswerCreate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _org_lesson_question(question_id, current_user.organization_id, db)
    answer = db.query(models.LessonAnswer).filter(
        models.LessonAnswer.id == answer_id,
        models.LessonAnswer.question_id == question_id,
    ).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    if (
        answer.answered_by != current_user.id
        and current_user.role == models.UserRole.learner
    ):
        raise HTTPException(status_code=403, detail="Not authorized")
    answer.answer_text = payload.answer_text
    db.commit()
    db.refresh(answer)
    return answer


@router.delete(
    "/api/lesson-questions/{question_id}/answers/{answer_id}",
    status_code=204,
)
def delete_lesson_answer(
    question_id: str,
    answer_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _org_lesson_question(question_id, current_user.organization_id, db)
    answer = db.query(models.LessonAnswer).filter(
        models.LessonAnswer.id == answer_id,
        models.LessonAnswer.question_id == question_id,
    ).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    if (
        answer.answered_by != current_user.id
        and current_user.role == models.UserRole.learner
    ):
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(answer)
    db.commit()
