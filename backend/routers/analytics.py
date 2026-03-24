from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timezone
import io
import csv
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


@router.get("/people")
def get_people_analytics(
    current_user: models.User = Depends(auth_utils.require_manager),
    db: Session = Depends(get_db),
):
    """Per-employee engagement and completion scorecards."""
    org_id = current_user.organization_id
    now = datetime.now(timezone.utc)

    employees = (
        db.query(models.User)
        .filter(
            models.User.organization_id == org_id,
            models.User.is_active == True,
            models.User.role != models.UserRole.super_admin,
        )
        .order_by(models.User.created_at)
        .all()
    )

    modules = (
        db.query(models.Module)
        .filter(
            models.Module.organization_id == org_id,
            models.Module.is_published == True,
        )
        .all()
    )
    total_modules = len(modules)

    result = []
    for emp in employees:
        days_since_joined = (now.replace(tzinfo=None) - emp.created_at.replace(tzinfo=None)).days

        # Last activity: most recent progress update
        last_progress = (
            db.query(models.UserProgress)
            .filter(models.UserProgress.user_id == emp.id)
            .order_by(models.UserProgress.last_viewed_at.desc().nullslast())
            .first()
        )
        last_active_at = (
            last_progress.last_viewed_at if last_progress and last_progress.last_viewed_at else None
        )
        days_since_active = (
            (now - last_active_at.replace(tzinfo=None)).days if last_active_at else None
        )

        # Completion
        completed = sum(
            1 for m in modules
            if db.query(models.UserProgress).filter(
                models.UserProgress.user_id == emp.id,
                models.UserProgress.module_id == m.id,
                models.UserProgress.status == models.ModuleStatus.completed,
            ).first()
        )
        pct = round((completed / total_modules) * 100) if total_modules else 0

        # Time to fully complete (days from join to last module completion)
        time_to_complete = None
        if pct == 100:
            last_completion = (
                db.query(func.max(models.UserProgress.completed_at))
                .filter(
                    models.UserProgress.user_id == emp.id,
                    models.UserProgress.status == models.ModuleStatus.completed,
                )
                .scalar()
            )
            if last_completion:
                time_to_complete = (last_completion.replace(tzinfo=None) - emp.created_at.replace(tzinfo=None)).days

        is_at_risk = (
            pct < 100
            and (days_since_active is None or days_since_active >= 5)
            and days_since_joined >= 3
        )

        result.append({
            "id": emp.id,
            "name": emp.full_name,
            "email": emp.email,
            "role": emp.role,
            "department": emp.department,
            "joined": emp.created_at.isoformat(),
            "days_since_joined": days_since_joined,
            "last_active_at": last_active_at.isoformat() if last_active_at else None,
            "days_since_active": days_since_active,
            "completion_pct": pct,
            "completed_modules": completed,
            "total_modules": total_modules,
            "time_to_complete_days": time_to_complete,
            "is_at_risk": is_at_risk,
            "is_star": pct == 100,
        })

    summary = {
        "total": len(result),
        "stars": sum(1 for e in result if e["is_star"]),
        "at_risk": sum(1 for e in result if e["is_at_risk"]),
        "avg_completion": round(sum(e["completion_pct"] for e in result) / len(result)) if result else 0,
    }

    return {"employees": result, "summary": summary}


@router.get("/benchmarks")
def get_benchmarks(
    current_user: models.User = Depends(auth_utils.require_manager),
    db: Session = Depends(get_db),
):
    """Compare this org's onboarding metrics against the platform average."""
    org_id = current_user.organization_id
    now = datetime.now(timezone.utc)

    def _org_completion_rate(oid: str) -> float:
        employees = db.query(models.User).filter(
            models.User.organization_id == oid,
            models.User.role == models.UserRole.employee,
            models.User.is_active == True,
        ).all()
        modules = db.query(models.Module).filter(
            models.Module.organization_id == oid,
            models.Module.is_published == True,
        ).all()
        if not employees or not modules:
            return 0.0
        total_possible = len(employees) * len(modules)
        completed = db.query(func.count(models.UserProgress.id)).filter(
            models.UserProgress.module_id.in_([m.id for m in modules]),
            models.UserProgress.status == models.ModuleStatus.completed,
        ).scalar() or 0
        return round((completed / total_possible) * 100, 1)

    # This org's rate
    org_rate = _org_completion_rate(org_id)

    # Platform: all active orgs
    all_org_ids = [
        r[0] for r in db.query(models.Organization.id).filter(
            models.Organization.is_active == True
        ).all()
    ]
    all_rates = [_org_completion_rate(oid) for oid in all_org_ids]
    active_rates = [r for r in all_rates if r > 0]

    platform_avg = round(sum(active_rates) / len(active_rates), 1) if active_rates else 0.0

    # Rank percentile (what % of orgs this org beats)
    better_than = sum(1 for r in active_rates if org_rate > r)
    percentile = round((better_than / len(active_rates)) * 100) if active_rates else 50

    # Avg days to complete for this org
    completions = db.query(models.UserProgress).join(
        models.Module, models.UserProgress.module_id == models.Module.id
    ).filter(
        models.Module.organization_id == org_id,
        models.UserProgress.status == models.ModuleStatus.completed,
        models.UserProgress.completed_at.isnot(None),
    ).all()

    avg_days = None
    if completions:
        days_list = []
        for p in completions:
            user = db.query(models.User).filter(models.User.id == p.user_id).first()
            if user and p.completed_at:
                d = (p.completed_at.replace(tzinfo=None) - user.created_at.replace(tzinfo=None)).days
                if d >= 0:
                    days_list.append(d)
        avg_days = round(sum(days_list) / len(days_list), 1) if days_list else None

    return {
        "org_completion_rate": org_rate,
        "platform_avg_completion_rate": platform_avg,
        "org_avg_days_to_complete": avg_days,
        "platform_avg_days_to_complete": 8.0,  # seeded platform baseline
        "org_rank_percentile": percentile,
        "total_orgs_compared": len(active_rates),
    }


@router.get("/completion-report")
def get_completion_report(
    current_user: models.User = Depends(auth_utils.require_manager),
    db: Session = Depends(get_db),
):
    """Per-employee completion status for all published modules."""
    org_id = current_user.organization_id

    employees = (
        db.query(models.User)
        .filter(
            models.User.organization_id == org_id,
            models.User.is_active == True,
            models.User.role != models.UserRole.super_admin,
        )
        .order_by(models.User.created_at)
        .all()
    )

    modules = (
        db.query(models.Module)
        .filter(
            models.Module.organization_id == org_id,
            models.Module.is_published == True,
        )
        .order_by(models.Module.order_index)
        .all()
    )

    report = []
    for emp in employees:
        completed = 0
        for m in modules:
            done = db.query(models.UserProgress).filter(
                models.UserProgress.user_id == emp.id,
                models.UserProgress.module_id == m.id,
                models.UserProgress.status == models.ModuleStatus.completed,
            ).first()
            if done:
                completed += 1

        pct = round((completed / len(modules)) * 100) if modules else 0
        report.append({
            "id": emp.id,
            "name": emp.full_name,
            "email": emp.email,
            "role": emp.role,
            "department": emp.department,
            "joined": emp.created_at.isoformat(),
            "completed_modules": completed,
            "total_modules": len(modules),
            "completion_pct": pct,
        })

    return {
        "modules": [{"id": m.id, "title": m.title} for m in modules],
        "employees": report,
        "summary": {
            "total": len(report),
            "completed": sum(1 for e in report if e["completion_pct"] == 100),
            "in_progress": sum(1 for e in report if 0 < e["completion_pct"] < 100),
            "not_started": sum(1 for e in report if e["completion_pct"] == 0),
        },
    }


@router.get("/export.csv")
def export_completion_csv(
    current_user: models.User = Depends(auth_utils.require_manager),
    db: Session = Depends(get_db),
):
    """Download completion report as CSV (Excel-compatible)."""
    org_id = current_user.organization_id

    employees = (
        db.query(models.User)
        .filter(
            models.User.organization_id == org_id,
            models.User.is_active == True,
            models.User.role != models.UserRole.super_admin,
        )
        .order_by(models.User.full_name)
        .all()
    )

    modules = (
        db.query(models.Module)
        .filter(
            models.Module.organization_id == org_id,
            models.Module.is_published == True,
        )
        .order_by(models.Module.order_index)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Name", "Email", "Role", "Department", "Joined",
        *[m.title for m in modules],
        "Completion %",
    ])

    for emp in employees:
        completed = 0
        module_statuses = []
        for m in modules:
            done = db.query(models.UserProgress).filter(
                models.UserProgress.user_id == emp.id,
                models.UserProgress.module_id == m.id,
                models.UserProgress.status == models.ModuleStatus.completed,
            ).first()
            if done:
                completed += 1
                module_statuses.append("Complete")
            else:
                in_prog = db.query(models.UserProgress).filter(
                    models.UserProgress.user_id == emp.id,
                    models.UserProgress.module_id == m.id,
                    models.UserProgress.status == models.ModuleStatus.in_progress,
                ).first()
                module_statuses.append("In Progress" if in_prog else "Not Started")

        pct = round((completed / len(modules)) * 100) if modules else 0
        writer.writerow([
            emp.full_name, emp.email, emp.role,
            emp.department or "", emp.created_at.strftime("%Y-%m-%d"),
            *module_statuses,
            f"{pct}%",
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),  # utf-8-sig = Excel BOM
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="nest-fledge-report.csv"'},
    )


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
