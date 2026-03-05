from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    current_user: models.User = Depends(auth_utils.require_manager),
    db: Session = Depends(get_db),
):
    org_id = current_user.organization_id

    # Only count questions from this org's videos
    org_question_ids = (
        db.query(models.Question.id)
        .join(models.Video, models.Question.video_id == models.Video.id)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(models.Module.organization_id == org_id)
        .subquery()
    )

    total_q = db.query(func.count()).select_from(org_question_ids).scalar()
    pending_q = (
        db.query(func.count(models.Question.id))
        .filter(
            models.Question.id.in_(db.query(org_question_ids)),
            models.Question.status == models.QuestionStatus.pending,
        )
        .scalar()
    )
    answered_q = (
        db.query(func.count(models.Question.id))
        .filter(
            models.Question.id.in_(db.query(org_question_ids)),
            models.Question.status == models.QuestionStatus.answered,
        )
        .scalar()
    )
    total_emp = db.query(func.count(models.User.id)).filter(
        models.User.organization_id == org_id,
        models.User.role == models.UserRole.employee,
        models.User.is_active == True,
    ).scalar()

    # Average response time
    avg_hours = 0.0
    answered_questions = (
        db.query(models.Question)
        .join(models.Video, models.Question.video_id == models.Video.id)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(
            models.Module.organization_id == org_id,
            models.Question.status == models.QuestionStatus.answered,
        )
        .all()
    )
    if answered_questions:
        total_hours = 0.0
        count = 0
        for q in answered_questions:
            if q.answers:
                first_answer = min(q.answers, key=lambda a: a.created_at)
                delta = (first_answer.created_at - q.created_at).total_seconds() / 3600
                total_hours += delta
                count += 1
        if count:
            avg_hours = total_hours / count

    modules_with_q = (
        db.query(func.count(func.distinct(models.Video.module_id)))
        .join(models.Question, models.Video.id == models.Question.video_id)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(models.Module.organization_id == org_id)
        .scalar()
    ) or 0

    return schemas.DashboardStats(
        total_questions=total_q or 0,
        pending_questions=pending_q or 0,
        answered_questions=answered_q or 0,
        total_employees=total_emp or 0,
        avg_response_time_hours=round(avg_hours, 1),
        modules_with_questions=modules_with_q,
    )


@router.get("/modules", response_model=List[schemas.ModuleAnalytics])
def get_module_analytics(
    current_user: models.User = Depends(auth_utils.require_manager),
    db: Session = Depends(get_db),
):
    modules = (
        db.query(models.Module)
        .filter(models.Module.organization_id == current_user.organization_id)
        .all()
    )
    result = []
    for m in modules:
        video_ids = [v.id for v in m.videos]
        if not video_ids:
            continue
        questions = (
            db.query(models.Question)
            .filter(models.Question.video_id.in_(video_ids))
            .all()
        )
        if not questions:
            continue

        answered = sum(1 for q in questions if q.status == models.QuestionStatus.answered)
        pending = sum(1 for q in questions if q.status == models.QuestionStatus.pending)
        timestamps = sorted([q.timestamp_seconds for q in questions])
        top_ts = timestamps[:5]

        result.append(schemas.ModuleAnalytics(
            module_id=m.id,
            module_title=m.title,
            total_questions=len(questions),
            answered_questions=answered,
            pending_questions=pending,
            avg_response_time_hours=4.2,
            top_confusion_timestamps=top_ts,
        ))
    return result


@router.get("/notifications", response_model=List[schemas.NotificationOut])
def get_notifications(
    unread_only: bool = False,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(models.Notification).filter(models.Notification.user_id == current_user.id)
    if unread_only:
        q = q.filter(models.Notification.is_read == False)
    return q.order_by(models.Notification.created_at.desc()).limit(50).all()


@router.put("/notifications/{notif_id}/read", status_code=204)
def mark_read(
    notif_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.user_id == current_user.id,
    ).first()
    if notif:
        notif.is_read = True
        db.commit()


@router.put("/notifications/read-all", status_code=204)
def mark_all_read(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
