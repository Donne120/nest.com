import random
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import auth as auth_utils
import models
import schemas
from database import get_db
router = APIRouter(prefix="/api/assignments", tags=["assignments"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _get_assignment(assignment_id: str, org_id: str, db: Session) -> models.Assignment:
    a = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id,
        models.Assignment.organization_id == org_id,
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return a


def _to_out(a: models.Assignment, db: Session) -> schemas.AssignmentOut:
    data = schemas.AssignmentOut.model_validate(a)
    data.group_count = len(a.groups)
    data.submission_count = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.assignment_id == a.id,
        models.AssignmentSubmission.status == models.SubmissionStatus.submitted,
    ).count()
    return data


def _notify(user_id: str, type: str, title: str, message: str,
            ref_id: str, db: Session):
    db.add(models.Notification(
        user_id=user_id, type=type, title=title,
        message=message, reference_id=ref_id,
    ))


def _count_words(content: Optional[dict]) -> int:
    """Recursively count words from TipTap JSON content."""
    if not content:
        return 0
    words = 0
    if isinstance(content, dict):
        if content.get("type") == "text":
            words += len((content.get("text") or "").split())
        for child in content.get("content") or []:
            words += _count_words(child)
    elif isinstance(content, list):
        for item in content:
            words += _count_words(item)
    return words


# ─── System Functions ─────────────────────────────────────────────────────────

def _schedule_kickoff_meeting(
    group: models.AssignmentGroup,
    assignment: models.Assignment,
    db: Session,
):
    """Create a kickoff MeetingBooking for a group, 24h from now."""
    kickoff_time = datetime.now(timezone.utc) + timedelta(hours=24)
    meeting = models.MeetingBooking(
        organization_id=assignment.organization_id,
        learner_id=group.members[0].learner_id if group.members else assignment.created_by,
        assignment_id=assignment.id,
        requested_at=kickoff_time,
        confirmed_at=kickoff_time,
        locked=assignment.meeting_1_locked,
        note=f"Kickoff meeting for: {assignment.title}",
        status=models.MeetingStatus.confirmed,
    )
    db.add(meeting)
    db.flush()
    group.kickoff_meeting_id = meeting.id

    # Notify all group members
    for member in group.members:
        _notify(
            member.learner_id, "assignment_kickoff_scheduled",
            "Kickoff Meeting Scheduled",
            f"Your kickoff meeting for '{assignment.title}' is scheduled.",
            assignment.id, db,
        )


def _sanitize_tiptap(node: dict) -> dict | None:
    """
    Recursively remove empty text nodes and paragraphs that become empty
    after filtering.  ProseMirror throws RangeError on text nodes with
    text == "".
    """
    if node.get("type") == "text":
        return None if not node.get("text", "").strip() else node

    if "content" in node:
        clean = [_sanitize_tiptap(n) for n in node["content"]]
        clean = [n for n in clean if n is not None]
        # A block node with no children is only valid for some types
        if not clean and node.get("type") in ("paragraph", "heading", "blockquote", "listItem"):
            return None
        return {**node, "content": clean}

    return node


def _build_merged_document(
    group: models.AssignmentGroup,
    db: Session,
) -> dict:
    """Build a single TipTap JSON doc by combining all member submissions."""
    nodes = []
    for member in sorted(group.members, key=lambda m: m.portion_index):
        sub = member.submission
        label = member.portion_label or f"Part {member.portion_index + 1}"
        learner_name = member.learner.full_name if member.learner else "Unknown"

        # Section heading
        nodes.append({
            "type": "heading",
            "attrs": {"level": 2},
            "content": [{"type": "text", "text": f"{label} \u2014 {learner_name}"}],
        })

        # Member's content nodes (sanitized)
        if sub and sub.content:
            content_nodes = sub.content.get("content") or []
            for n in content_nodes:
                clean = _sanitize_tiptap(n)
                if clean is not None:
                    nodes.append(clean)
        else:
            nodes.append({
                "type": "paragraph",
                "content": [{"type": "text", "text": "(No content submitted)"}],
            })

        # Divider between sections
        nodes.append({"type": "horizontalRule"})

    return {"type": "doc", "content": nodes}


def _check_and_merge(
    assignment: models.Assignment,
    group: models.AssignmentGroup,
    db: Session,
):
    """After a submission, check if all members submitted; if so, merge."""
    all_submitted = all(
        m.submitted_at is not None for m in group.members
    )
    if not all_submitted:
        group.merge_status = models.MergeStatus.partial
        return

    group.merged_document = _build_merged_document(group, db)
    group.merge_status = models.MergeStatus.complete
    db.flush()

    # Schedule review meeting
    if assignment.deadline:
        deadline = assignment.deadline
        # SQLite returns naive datetimes; make aware so comparison works
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        review_time = deadline - timedelta(hours=48)
        now = datetime.now(timezone.utc)
        if review_time <= now:
            review_time = now + timedelta(hours=24)
    else:
        review_time = datetime.now(timezone.utc) + timedelta(hours=48)

    meeting = models.MeetingBooking(
        organization_id=assignment.organization_id,
        learner_id=group.members[0].learner_id if group.members else assignment.created_by,
        assignment_id=assignment.id,
        requested_at=review_time,
        confirmed_at=review_time,
        locked=assignment.meeting_2_locked,
        note=f"Review meeting for: {assignment.title}",
        status=models.MeetingStatus.confirmed,
    )
    db.add(meeting)
    db.flush()
    group.review_meeting_id = meeting.id

    for member in group.members:
        _notify(
            member.learner_id, "assignment_review_scheduled",
            "Review Meeting Scheduled",
            f"All portions submitted for '{assignment.title}'. "
            f"Review your merged work before the deadline.",
            assignment.id, db,
        )


def _form_groups(assignment: models.Assignment, db: Session):
    """Randomly assign learners to groups and distribute portions."""
    learners = db.query(models.User).filter(
        models.User.organization_id == assignment.organization_id,
        models.User.role == models.UserRole.learner,
        models.User.is_active.is_(True),
    ).all()

    if not learners:
        return

    random.shuffle(learners)
    portions = assignment.portions or []
    size = assignment.max_group_size or len(learners)

    # Split into chunks
    chunks = [learners[i:i + size] for i in range(0, len(learners), size)]

    for chunk in chunks:
        group = models.AssignmentGroup(assignment_id=assignment.id)
        db.add(group)
        db.flush()

        for idx, learner in enumerate(chunk):
            if portions:
                if idx < len(portions):
                    portion_label = portions[idx]
                else:
                    # Extra members: share the last portion
                    portion_label = portions[-1]
                    idx = len(portions) - 1
            else:
                portion_label = f"Part {idx + 1}"

            member = models.GroupMember(
                group_id=group.id,
                learner_id=learner.id,
                portion_label=portion_label,
                portion_index=idx,
            )
            db.add(member)

        db.flush()
        # Reload members for the kickoff meeting scheduling
        db.refresh(group)
        _schedule_kickoff_meeting(group, assignment, db)

    # Notify learners
    for learner in learners:
        _notify(
            learner.id, "assignment_activated",
            "New Assignment Available",
            f"'{assignment.title}' has been activated. "
            f"Check your assignments to get started.",
            assignment.id, db,
        )


# ─── Instructor Routes ────────────────────────────────────────────────────────

@router.post("", response_model=schemas.AssignmentOut, status_code=201)
def create_assignment(
    payload: schemas.AssignmentCreate,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    a = models.Assignment(
        organization_id=current_user.organization_id,
        created_by=current_user.id,
        title=payload.title,
        description=payload.description,
        type=payload.type,
        module_id=payload.module_id,
        max_group_size=payload.max_group_size,
        portions=payload.portions,
        deadline=payload.deadline,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return _to_out(a, db)


@router.get("", response_model=List[schemas.AssignmentOut])
def list_assignments(
    status: Optional[models.AssignmentStatus] = Query(None),
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    q = db.query(models.Assignment).filter(
        models.Assignment.organization_id == current_user.organization_id,
    )
    if status:
        q = q.filter(models.Assignment.status == status)
    assignments = q.order_by(models.Assignment.created_at.desc()).all()
    return [_to_out(a, db) for a in assignments]


@router.get("/my", response_model=List[schemas.AssignmentOut])
def my_assignments(
    module_id: Optional[str] = Query(None),
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    """Learner: get all active assignments, enriched with per-learner submission status."""
    q = db.query(models.Assignment).filter(
        models.Assignment.organization_id == current_user.organization_id,
        models.Assignment.status == models.AssignmentStatus.active,
    )
    if module_id:
        q = q.filter(models.Assignment.module_id == module_id)
    assignments = q.order_by(models.Assignment.deadline.asc()).all()

    results = []
    for a in assignments:
        out = _to_out(a, db)

        # Individual submission status
        sub = db.query(models.AssignmentSubmission).filter(
            models.AssignmentSubmission.assignment_id == a.id,
            models.AssignmentSubmission.learner_id == current_user.id,
        ).first()
        out.my_submission_status = sub.status.value if sub else "not_started"

        # Group-specific enrichment
        if a.type == models.AssignmentType.group:
            member = db.query(models.GroupMember).filter(
                models.GroupMember.learner_id == current_user.id,
                models.GroupMember.group.has(
                    models.AssignmentGroup.assignment_id == a.id
                ),
            ).first()
            if member:
                out.my_portion_label = member.portion_label
                group = member.group
                if group.final_submitted_at:
                    out.my_group_merge_status = "final_submitted"
                else:
                    out.my_group_merge_status = group.merge_status.value

        results.append(out)
    return results


@router.get("/{assignment_id}", response_model=schemas.AssignmentOut)
def get_assignment(
    assignment_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    a = _get_assignment(assignment_id, current_user.organization_id, db)
    return _to_out(a, db)


@router.put("/{assignment_id}", response_model=schemas.AssignmentOut)
def update_assignment(
    assignment_id: str,
    payload: schemas.AssignmentUpdate,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    a = _get_assignment(assignment_id, current_user.organization_id, db)
    if a.status == models.AssignmentStatus.closed:
        raise HTTPException(status_code=400, detail="Cannot edit a closed assignment")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(a, field, val)

    db.commit()
    db.refresh(a)
    return _to_out(a, db)


@router.delete("/{assignment_id}", status_code=204)
def delete_assignment(
    assignment_id: str,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    a = _get_assignment(assignment_id, current_user.organization_id, db)
    db.delete(a)
    db.commit()


@router.post("/{assignment_id}/activate", response_model=schemas.AssignmentOut)
def activate_assignment(
    assignment_id: str,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    a = _get_assignment(assignment_id, current_user.organization_id, db)
    if a.status != models.AssignmentStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft assignments can be activated")

    a.status = models.AssignmentStatus.active

    if a.type == models.AssignmentType.group:
        _form_groups(a, db)

    db.commit()
    db.refresh(a)
    return _to_out(a, db)


@router.get("/{assignment_id}/groups", response_model=List[schemas.AssignmentGroupOut])
def list_groups(
    assignment_id: str,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    a = _get_assignment(assignment_id, current_user.organization_id, db)
    return [schemas.AssignmentGroupOut.model_validate(g) for g in a.groups]


@router.get("/{assignment_id}/submissions", response_model=List[schemas.AssignmentSubmissionOut])
def list_submissions(
    assignment_id: str,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    _get_assignment(assignment_id, current_user.organization_id, db)
    subs = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.assignment_id == assignment_id,
    ).all()
    return [schemas.AssignmentSubmissionOut.model_validate(s) for s in subs]


@router.get("/{assignment_id}/submissions/{submission_id}", response_model=schemas.AssignmentSubmissionOut)
def get_submission(
    assignment_id: str,
    submission_id: str,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    """Educator: read full content of a single submission."""
    _get_assignment(assignment_id, current_user.organization_id, db)
    sub = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.id == submission_id,
        models.AssignmentSubmission.assignment_id == assignment_id,
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return schemas.AssignmentSubmissionOut.model_validate(sub)


@router.put("/{assignment_id}/submissions/{submission_id}/review", response_model=schemas.AssignmentSubmissionOut)
def review_submission(
    assignment_id: str,
    submission_id: str,
    payload: schemas.SubmissionReview,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    """Instructor: grade + annotate a submission. Notifies the learner."""
    _get_assignment(assignment_id, current_user.organization_id, db)
    sub = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.id == submission_id,
        models.AssignmentSubmission.assignment_id == assignment_id,
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub.grade = payload.grade
    sub.reviewed_content = payload.reviewed_content
    sub.instructor_feedback = payload.instructor_feedback
    sub.reviewed_at = datetime.now(timezone.utc)

    # Notify learner
    _notify(
        sub.learner_id, "submission_reviewed",
        "Your submission has been reviewed",
        f"{current_user.full_name} has graded your submission"
        + (f" — Grade: {payload.grade}" if payload.grade else "") + ".",
        assignment_id, db,
    )

    db.commit()
    db.refresh(sub)
    return schemas.AssignmentSubmissionOut.model_validate(sub)


@router.put("/{assignment_id}/lock-meeting/{meeting_num}", response_model=schemas.AssignmentOut)
def lock_meeting(
    assignment_id: str,
    meeting_num: int,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    if meeting_num not in (1, 2):
        raise HTTPException(status_code=400, detail="meeting_num must be 1 or 2")
    a = _get_assignment(assignment_id, current_user.organization_id, db)
    if meeting_num == 1:
        a.meeting_1_locked = not a.meeting_1_locked
    else:
        a.meeting_2_locked = not a.meeting_2_locked
    db.commit()
    db.refresh(a)
    return _to_out(a, db)


@router.post("/{assignment_id}/groups/{group_id}/feedback", response_model=schemas.AssignmentGroupOut)
def leave_feedback(
    assignment_id: str,
    group_id: str,
    payload: schemas.FeedbackCreate,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    _get_assignment(assignment_id, current_user.organization_id, db)
    group = db.query(models.AssignmentGroup).filter(
        models.AssignmentGroup.id == group_id,
        models.AssignmentGroup.assignment_id == assignment_id,
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    group.instructor_feedback = payload.feedback
    db.commit()
    db.refresh(group)
    return schemas.AssignmentGroupOut.model_validate(group)


@router.put("/{assignment_id}/groups/{group_id}/review", response_model=schemas.AssignmentGroupOut)
def review_merged_document(
    assignment_id: str,
    group_id: str,
    payload: schemas.GroupReview,
    current_user: models.User = Depends(auth_utils.require_educator),
    db: Session = Depends(get_db),
):
    """Instructor: grade + annotate the merged group document. Notifies all group members."""
    _get_assignment(assignment_id, current_user.organization_id, db)
    group = db.query(models.AssignmentGroup).filter(
        models.AssignmentGroup.id == group_id,
        models.AssignmentGroup.assignment_id == assignment_id,
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    group.grade = payload.grade
    group.reviewed_merged_content = payload.reviewed_merged_content
    group.instructor_feedback = payload.instructor_feedback
    group.reviewed_merged_at = datetime.now(timezone.utc)

    # Notify all group members
    for member in group.members:
        _notify(
            member.learner_id, "merged_doc_reviewed",
            "Your group submission has been reviewed",
            f"{current_user.full_name} has graded your merged document"
            + (f" — Grade: {payload.grade}" if payload.grade else "") + ".",
            assignment_id, db,
        )

    db.commit()
    db.refresh(group)
    return schemas.AssignmentGroupOut.model_validate(group)


# ─── Learner Routes ───────────────────────────────────────────────────────────

@router.get("/{assignment_id}/my-submission", response_model=schemas.AssignmentSubmissionOut)
def get_my_submission(
    assignment_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _get_assignment(assignment_id, current_user.organization_id, db)
    sub = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.assignment_id == assignment_id,
        models.AssignmentSubmission.learner_id == current_user.id,
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="No submission yet")
    return schemas.AssignmentSubmissionOut.model_validate(sub)


@router.put("/{assignment_id}/my-submission", response_model=schemas.AssignmentSubmissionOut)
def save_submission(
    assignment_id: str,
    payload: schemas.SubmissionSave,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    a = _get_assignment(assignment_id, current_user.organization_id, db)
    if a.status != models.AssignmentStatus.active:
        raise HTTPException(status_code=400, detail="Assignment is not active")

    # Find or create submission
    sub = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.assignment_id == assignment_id,
        models.AssignmentSubmission.learner_id == current_user.id,
    ).first()

    # Find group member (for group assignments)
    group_member = None
    if a.type == models.AssignmentType.group:
        group_member = db.query(models.GroupMember).filter(
            models.GroupMember.learner_id == current_user.id,
            models.GroupMember.group.has(
                models.AssignmentGroup.assignment_id == assignment_id
            ),
        ).first()

    if not sub:
        sub = models.AssignmentSubmission(
            assignment_id=assignment_id,
            learner_id=current_user.id,
            group_member_id=group_member.id if group_member else None,
        )
        db.add(sub)

    # Block edits only if the deadline has passed
    now = datetime.now(timezone.utc)
    if sub.status == models.SubmissionStatus.submitted:
        deadline = a.deadline
        if deadline and deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if deadline and now > deadline:
            raise HTTPException(
                status_code=400,
                detail="Deadline has passed — submission can no longer be edited",
            )

    already_submitted = sub.status == models.SubmissionStatus.submitted
    sub.content = payload.content
    sub.word_count = _count_words(payload.content)

    if payload.submit:
        sub.status = models.SubmissionStatus.submitted
        sub.submitted_at = now

        if group_member:
            group_member.submitted_at = sub.submitted_at
            db.flush()
            group = group_member.group
            # Re-trigger merge in case this is an edit after prior merge
            _check_and_merge(a, group, db)

        # Notify educators only on first submission (not re-edits)
        if not already_submitted:
            educators = db.query(models.User).filter(
                models.User.organization_id == current_user.organization_id,
                models.User.role.in_([models.UserRole.educator, models.UserRole.owner]),
            ).all()
            for edu in educators:
                _notify(
                    edu.id, "assignment_submitted",
                    "Submission Received",
                    f"{current_user.full_name} submitted their work for '{a.title}'.",
                    assignment_id, db,
                )

    db.commit()
    db.refresh(sub)
    return schemas.AssignmentSubmissionOut.model_validate(sub)


@router.get("/{assignment_id}/my-group", response_model=schemas.AssignmentGroupOut)
def get_my_group(
    assignment_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _get_assignment(assignment_id, current_user.organization_id, db)
    member = db.query(models.GroupMember).filter(
        models.GroupMember.learner_id == current_user.id,
        models.GroupMember.group.has(
            models.AssignmentGroup.assignment_id == assignment_id
        ),
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="You are not in a group for this assignment")
    return schemas.AssignmentGroupOut.model_validate(member.group)


@router.get("/{assignment_id}/merged", response_model=schemas.AssignmentGroupOut)
def get_merged_document(
    assignment_id: str,
    group_id: Optional[str] = Query(None),
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _get_assignment(assignment_id, current_user.organization_id, db)
    is_instructor = current_user.role in (
        models.UserRole.educator, models.UserRole.owner, models.UserRole.super_admin
    )

    if is_instructor:
        # Educators can view any group — use group_id if provided, else first complete one
        q = db.query(models.AssignmentGroup).filter(
            models.AssignmentGroup.assignment_id == assignment_id,
        )
        if group_id:
            q = q.filter(models.AssignmentGroup.id == group_id)
        else:
            q = q.filter(models.AssignmentGroup.merge_status == models.MergeStatus.complete)
        group = q.first()
        if not group:
            raise HTTPException(status_code=404, detail="No merged group found")
    else:
        # Learners: look up their own group
        member = db.query(models.GroupMember).filter(
            models.GroupMember.learner_id == current_user.id,
            models.GroupMember.group.has(
                models.AssignmentGroup.assignment_id == assignment_id
            ),
        ).first()
        if not member:
            raise HTTPException(status_code=404, detail="No group found")
        group = member.group
        if group.merge_status != models.MergeStatus.complete:
            raise HTTPException(status_code=400, detail="Merged document not ready yet")

    return schemas.AssignmentGroupOut.model_validate(group)


@router.put("/{assignment_id}/my-group/merged-document", response_model=schemas.AssignmentGroupOut)
def save_merged_document(
    assignment_id: str,
    payload: schemas.SubmissionSave,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    """Any group member can update the merged document before final submission."""
    _get_assignment(assignment_id, current_user.organization_id, db)
    member = db.query(models.GroupMember).filter(
        models.GroupMember.learner_id == current_user.id,
        models.GroupMember.group.has(
            models.AssignmentGroup.assignment_id == assignment_id
        ),
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="No group found")
    group = member.group
    if group.final_submitted_at:
        raise HTTPException(status_code=400, detail="Already submitted — document is locked")
    group.merged_document = payload.content
    db.commit()
    db.refresh(group)
    return schemas.AssignmentGroupOut.model_validate(group)


@router.post("/{assignment_id}/my-group/submit", response_model=schemas.AssignmentGroupOut)
def submit_to_instructor(
    assignment_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    a = _get_assignment(assignment_id, current_user.organization_id, db)
    member = db.query(models.GroupMember).filter(
        models.GroupMember.learner_id == current_user.id,
        models.GroupMember.group.has(
            models.AssignmentGroup.assignment_id == assignment_id
        ),
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="No group found")

    group = member.group
    if group.merge_status != models.MergeStatus.complete:
        raise HTTPException(status_code=400, detail="All portions must be submitted first")
    if group.final_submitted_at:
        raise HTTPException(status_code=400, detail="Already submitted to instructor")

    group.final_submitted_at = datetime.now(timezone.utc)

    educators = db.query(models.User).filter(
        models.User.organization_id == current_user.organization_id,
        models.User.role.in_([models.UserRole.educator, models.UserRole.owner]),
    ).all()
    for edu in educators:
        _notify(
            edu.id, "group_final_submitted",
            "Group Final Submission",
            f"A group has submitted their final work for '{a.title}'.",
            assignment_id, db,
        )

    db.commit()
    db.refresh(group)
    return schemas.AssignmentGroupOut.model_validate(group)
