from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
import models
import schemas
import auth as auth_utils
from routers.ws import manager as ws_manager
import email_utils

router = APIRouter(prefix="/api/meetings", tags=["meetings"])

_LOAD_OPTS = [
    joinedload(models.MeetingBooking.learner),
    joinedload(models.MeetingBooking.owner),
    joinedload(models.MeetingBooking.module),
]


def _get_meeting(meeting_id: str, org_id: str, db: Session) -> models.MeetingBooking:
    m = (
        db.query(models.MeetingBooking)
        .options(*_LOAD_OPTS)
        .filter(
            models.MeetingBooking.id == meeting_id,
            models.MeetingBooking.organization_id == org_id,
        )
        .first()
    )
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return m


def _to_out(m: models.MeetingBooking) -> schemas.MeetingOut:
    data = schemas.MeetingOut.model_validate(m)
    if m.module:
        data.module_title = m.module.title
    return data


@router.post("", response_model=schemas.MeetingOut, status_code=201)
async def request_meeting(
    payload: schemas.MeetingCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    meeting = models.MeetingBooking(
        organization_id=current_user.organization_id,
        learner_id=current_user.id,
        module_id=payload.module_id,
        requested_at=payload.requested_at,
        note=payload.note,
    )
    db.add(meeting)

    managers = db.query(models.User).filter(
        models.User.organization_id == current_user.organization_id,
        models.User.role.in_([models.UserRole.educator, models.UserRole.owner]),
        models.User.is_active == True,
    ).all()
    for mgr in managers:
        db.add(models.Notification(
            user_id=mgr.id,
            type="meeting_request",
            title="New 1-on-1 Request",
            message=f"{current_user.full_name} requested a 1-on-1 meeting.",
            reference_id=meeting.id,
        ))

    db.commit()
    meeting_id = meeting.id  # capture before session expires

    await ws_manager.broadcast({
        "event": "meeting_request",
        "meeting_id": meeting_id,
        "requested_by": current_user.full_name,
    })

    from config import settings as _settings
    meetings_url = f"{_settings.FRONTEND_URL}/admin/meetings"
    for mgr in managers:
        background_tasks.add_task(
            email_utils.send_meeting_request_to_manager,
            to=mgr.email,
            manager_name=mgr.full_name,
            employee_name=current_user.full_name,
            note=payload.note,
            meetings_url=meetings_url,
        )

    # Re-fetch with all relationships loaded (avoids lazy-load after async boundary)
    loaded = (
        db.query(models.MeetingBooking)
        .options(*_LOAD_OPTS)
        .filter(models.MeetingBooking.id == meeting_id)
        .first()
    )
    return _to_out(loaded)


@router.get("", response_model=List[schemas.MeetingOut])
def list_meetings(
    status: Optional[models.MeetingStatus] = Query(None),
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    q = (
        db.query(models.MeetingBooking)
        .options(*_LOAD_OPTS)
        .filter(models.MeetingBooking.organization_id == current_user.organization_id)
    )
    if current_user.role == models.UserRole.learner:
        q = q.filter(models.MeetingBooking.learner_id == current_user.id)
    if status:
        q = q.filter(models.MeetingBooking.status == status)
    meetings = q.order_by(models.MeetingBooking.created_at.desc()).all()
    return [_to_out(m) for m in meetings]


@router.patch("/{meeting_id}/confirm", response_model=schemas.MeetingOut)
async def confirm_meeting(
    meeting_id: str,
    payload: schemas.MeetingConfirm,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    meeting = _get_meeting(meeting_id, current_user.organization_id, db)
    if meeting.status != models.MeetingStatus.pending:
        raise HTTPException(
            status_code=400, detail="Only pending meetings can be confirmed"
        )

    meeting.status = models.MeetingStatus.confirmed
    meeting.owner_id = current_user.id
    meeting.confirmed_at = payload.confirmed_at
    meeting.meeting_link = payload.meeting_link

    db.add(models.Notification(
        user_id=meeting.learner_id,
        type="meeting_confirmed",
        title="1-on-1 Meeting Confirmed",
        message=(
            f"{current_user.full_name} confirmed your meeting request. "
            "Check your meetings page for the link."
        ),
        reference_id=meeting.id,
    ))
    db.commit()

    employee = db.query(models.User).filter_by(id=meeting.learner_id).first()
    if employee:
        background_tasks.add_task(
            email_utils.send_meeting_confirmed,
            to=employee.email,
            employee_name=employee.full_name,
            confirmed_at=payload.confirmed_at.strftime("%A, %d %B %Y at %H:%M UTC"),
            meeting_link=payload.meeting_link,
        )

    await ws_manager.broadcast({
        "event": "meeting_confirmed",
        "meeting_id": meeting.id,
        "learner_id": meeting.learner_id,
    })

    loaded = (
        db.query(models.MeetingBooking)
        .options(*_LOAD_OPTS)
        .filter(models.MeetingBooking.id == meeting.id)
        .first()
    )
    return _to_out(loaded)


@router.patch("/{meeting_id}/decline", response_model=schemas.MeetingOut)
async def decline_meeting(
    meeting_id: str,
    payload: schemas.MeetingDecline,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    meeting = _get_meeting(meeting_id, current_user.organization_id, db)
    if meeting.status != models.MeetingStatus.pending:
        raise HTTPException(
            status_code=400, detail="Only pending meetings can be declined"
        )

    meeting.status = models.MeetingStatus.declined
    meeting.owner_id = current_user.id
    meeting.decline_reason = payload.decline_reason

    db.add(models.Notification(
        user_id=meeting.learner_id,
        type="meeting_declined",
        title="1-on-1 Request Declined",
        message=(
            payload.decline_reason
            or f"{current_user.full_name} declined your meeting request."
        ),
        reference_id=meeting.id,
    ))
    db.commit()

    await ws_manager.broadcast({
        "event": "meeting_declined",
        "meeting_id": meeting.id,
        "learner_id": meeting.learner_id,
    })

    employee = db.query(models.User).filter_by(id=meeting.learner_id).first()
    if employee:
        from config import settings as _settings
        background_tasks.add_task(
            email_utils.send_meeting_declined,
            to=employee.email,
            employee_name=employee.full_name,
            reason=payload.decline_reason,
            meetings_url=f"{_settings.FRONTEND_URL}/meetings",
        )

    loaded = (
        db.query(models.MeetingBooking)
        .options(*_LOAD_OPTS)
        .filter(models.MeetingBooking.id == meeting.id)
        .first()
    )
    return _to_out(loaded)


@router.patch("/{meeting_id}/complete", response_model=schemas.MeetingOut)
def complete_meeting(
    meeting_id: str,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    meeting = _get_meeting(meeting_id, current_user.organization_id, db)
    if meeting.status != models.MeetingStatus.confirmed:
        raise HTTPException(
            status_code=400, detail="Only confirmed meetings can be marked complete"
        )
    meeting.status = models.MeetingStatus.completed
    db.commit()
    loaded = (
        db.query(models.MeetingBooking)
        .options(*_LOAD_OPTS)
        .filter(models.MeetingBooking.id == meeting.id)
        .first()
    )
    return _to_out(loaded)
