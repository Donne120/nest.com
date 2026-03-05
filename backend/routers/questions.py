from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
from database import get_db
import models
import schemas
import auth as auth_utils
from routers.ws import manager as ws_manager

router = APIRouter(prefix="/api/questions", tags=["questions"])


def _org_question(question_id: str, org_id: str, db: Session) -> models.Question:
    """Fetch question scoped to org via video → module chain."""
    q = (
        db.query(models.Question)
        .join(models.Video, models.Question.video_id == models.Video.id)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(
            models.Question.id == question_id,
            models.Module.organization_id == org_id,
        )
        .first()
    )
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q


def _org_video(video_id: str, org_id: str, db: Session) -> models.Video:
    v = (
        db.query(models.Video)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(
            models.Video.id == video_id,
            models.Module.organization_id == org_id,
        )
        .first()
    )
    if not v:
        raise HTTPException(status_code=404, detail="Video not found")
    return v


@router.get("", response_model=List[schemas.QuestionOut])
def list_questions(
    video_id: Optional[str] = Query(None),
    status: Optional[models.QuestionStatus] = Query(None),
    my_questions: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    q = (
        db.query(models.Question)
        .join(models.Video, models.Question.video_id == models.Video.id)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(models.Module.organization_id == current_user.organization_id)
    )
    if video_id:
        q = q.filter(models.Question.video_id == video_id)
    if status:
        q = q.filter(models.Question.status == status)
    if my_questions:
        q = q.filter(models.Question.asked_by == current_user.id)
    elif current_user.role == models.UserRole.employee:
        q = q.filter(
            (models.Question.is_public == True) |
            (models.Question.asked_by == current_user.id)
        )
    return q.order_by(models.Question.timestamp_seconds).offset(skip).limit(limit).all()


@router.post("", response_model=schemas.QuestionOut, status_code=201)
async def create_question(
    payload: schemas.QuestionCreate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _org_video(payload.video_id, current_user.organization_id, db)

    question = models.Question(
        video_id=payload.video_id,
        asked_by=current_user.id,
        timestamp_seconds=payload.timestamp_seconds,
        question_text=payload.question_text,
        is_public=payload.is_public,
    )
    db.add(question)

    # Notify org managers/admins only
    managers = db.query(models.User).filter(
        models.User.organization_id == current_user.organization_id,
        models.User.role.in_([models.UserRole.manager, models.UserRole.admin]),
        models.User.is_active == True,
    ).all()
    for mgr in managers:
        db.add(models.Notification(
            user_id=mgr.id,
            type="new_question",
            title="New Question",
            message=f"{current_user.full_name} asked: {payload.question_text[:60]}...",
            reference_id=question.id,
        ))

    db.commit()
    db.refresh(question)

    await ws_manager.broadcast({
        "event": "new_question",
        "question_id": question.id,
        "video_id": question.video_id,
        "timestamp": question.timestamp_seconds,
        "asked_by": current_user.full_name,
    })
    return question


@router.get("/pending", response_model=List[schemas.QuestionOut])
def get_pending_questions(
    skip: int = 0,
    limit: int = 50,
    current_user: models.User = Depends(auth_utils.require_manager),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Question)
        .join(models.Video, models.Question.video_id == models.Video.id)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(
            models.Module.organization_id == current_user.organization_id,
            models.Question.status == models.QuestionStatus.pending,
        )
        .order_by(models.Question.created_at.desc())
        .offset(skip).limit(limit).all()
    )


@router.get("/{question_id}", response_model=schemas.QuestionOut)
def get_question(
    question_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    question = _org_question(question_id, current_user.organization_id, db)
    question.view_count += 1
    db.commit()
    db.refresh(question)
    return question


@router.put("/{question_id}", response_model=schemas.QuestionOut)
def update_question(
    question_id: str,
    payload: schemas.QuestionUpdate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    question = _org_question(question_id, current_user.organization_id, db)
    if question.asked_by != current_user.id and current_user.role == models.UserRole.employee:
        raise HTTPException(status_code=403, detail="Not authorized")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(question, field, value)
    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}", status_code=204)
def delete_question(
    question_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    question = _org_question(question_id, current_user.organization_id, db)
    if question.asked_by != current_user.id and current_user.role == models.UserRole.employee:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(question)
    db.commit()


@router.post("/{question_id}/answers", response_model=schemas.AnswerOut, status_code=201)
async def add_answer(
    question_id: str,
    payload: schemas.AnswerCreate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    question = _org_question(question_id, current_user.organization_id, db)

    answer = models.Answer(
        question_id=question_id,
        answered_by=current_user.id,
        answer_text=payload.answer_text,
        is_official=payload.is_official and current_user.role in [models.UserRole.manager, models.UserRole.admin],
    )
    db.add(answer)

    if current_user.role in [models.UserRole.manager, models.UserRole.admin]:
        question.status = models.QuestionStatus.answered

    db.add(models.Notification(
        user_id=question.asked_by,
        type="question_answered",
        title="Your question was answered",
        message=f"{current_user.full_name} answered your question",
        reference_id=question_id,
    ))
    db.commit()
    db.refresh(answer)

    await ws_manager.broadcast({
        "event": "question_answered",
        "question_id": question_id,
        "answered_by": current_user.full_name,
    })
    return answer


@router.put("/{question_id}/answers/{answer_id}", response_model=schemas.AnswerOut)
def edit_answer(
    question_id: str,
    answer_id: str,
    payload: schemas.AnswerCreate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _org_question(question_id, current_user.organization_id, db)
    answer = db.query(models.Answer).filter(
        models.Answer.id == answer_id,
        models.Answer.question_id == question_id,
    ).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    if answer.answered_by != current_user.id and current_user.role == models.UserRole.employee:
        raise HTTPException(status_code=403, detail="Not authorized")
    answer.answer_text = payload.answer_text
    db.commit()
    db.refresh(answer)
    return answer


@router.delete("/{question_id}/answers/{answer_id}", status_code=204)
def delete_answer(
    question_id: str,
    answer_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _org_question(question_id, current_user.organization_id, db)
    answer = db.query(models.Answer).filter(
        models.Answer.id == answer_id,
        models.Answer.question_id == question_id,
    ).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    if answer.answered_by != current_user.id and current_user.role == models.UserRole.employee:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(answer)
    db.commit()
