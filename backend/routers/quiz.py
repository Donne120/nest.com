from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


def _org_video(video_id: str, org_id: str, db: Session) -> models.Video:
    """Fetch a video that belongs to the current user's organization."""
    video = (
        db.query(models.Video)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(models.Video.id == video_id, models.Module.organization_id == org_id)
        .first()
    )
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


def _org_quiz_question(question_id: str, org_id: str, db: Session) -> models.QuizQuestion:
    """Fetch a quiz question that belongs to the current user's organization."""
    q = (
        db.query(models.QuizQuestion)
        .join(models.Video, models.QuizQuestion.video_id == models.Video.id)
        .join(models.Module, models.Video.module_id == models.Module.id)
        .filter(models.QuizQuestion.id == question_id, models.Module.organization_id == org_id)
        .first()
    )
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q


# ── Admin: manage quiz questions ─────────────────────────────────────────────

@router.get("/admin/video/{video_id}", response_model=List[schemas.QuizQuestionOut])
def get_quiz_admin(
    video_id: str,
    current_user: models.User = Depends(auth_utils.require_manager),
    db: Session = Depends(get_db),
):
    _org_video(video_id, current_user.organization_id, db)
    return (
        db.query(models.QuizQuestion)
        .filter(models.QuizQuestion.video_id == video_id)
        .order_by(models.QuizQuestion.order_index)
        .all()
    )


@router.post("/admin/video/{video_id}", response_model=schemas.QuizQuestionOut, status_code=201)
def create_quiz_question(
    video_id: str,
    payload: schemas.QuizQuestionCreate,
    current_user: models.User = Depends(auth_utils.require_manager),
    db: Session = Depends(get_db),
):
    _org_video(video_id, current_user.organization_id, db)

    q = models.QuizQuestion(
        video_id=video_id,
        question_text=payload.question_text,
        question_type=payload.question_type,
        order_index=payload.order_index,
        is_required=payload.is_required,
        explanation=payload.explanation,
    )
    db.add(q)
    db.flush()

    for opt in payload.options:
        db.add(models.QuizOption(
            question_id=q.id,
            option_text=opt.option_text,
            is_correct=opt.is_correct,
            order_index=opt.order_index,
        ))

    db.commit()
    db.refresh(q)
    return q


@router.put("/admin/question/{question_id}", response_model=schemas.QuizQuestionOut)
def update_quiz_question(
    question_id: str,
    payload: schemas.QuizQuestionUpdate,
    current_user: models.User = Depends(auth_utils.require_manager),
    db: Session = Depends(get_db),
):
    q = _org_quiz_question(question_id, current_user.organization_id, db)

    for field in ["question_text", "question_type", "order_index", "is_required", "explanation"]:
        val = getattr(payload, field, None)
        if val is not None:
            setattr(q, field, val)

    # Replace options if provided
    if payload.options is not None:
        for opt in q.options:
            db.delete(opt)
        db.flush()
        for opt in payload.options:
            db.add(models.QuizOption(
                question_id=q.id,
                option_text=opt.option_text,
                is_correct=opt.is_correct,
                order_index=opt.order_index,
            ))

    db.commit()
    db.refresh(q)
    return q


@router.delete("/admin/question/{question_id}", status_code=204)
def delete_quiz_question(
    question_id: str,
    current_user: models.User = Depends(auth_utils.require_manager),
    db: Session = Depends(get_db),
):
    q = _org_quiz_question(question_id, current_user.organization_id, db)
    db.delete(q)
    db.commit()


# ── Employee: take quiz ───────────────────────────────────────────────────────

@router.get("/video/{video_id}", response_model=List[schemas.QuizQuestionPublic])
def get_quiz_for_employee(
    video_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _org_video(video_id, current_user.organization_id, db)
    return (
        db.query(models.QuizQuestion)
        .filter(models.QuizQuestion.video_id == video_id)
        .order_by(models.QuizQuestion.order_index)
        .all()
    )


@router.get("/video/{video_id}/my-submission", response_model=schemas.QuizSubmissionResult | None)
def get_my_submission(
    video_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _org_video(video_id, current_user.organization_id, db)
    sub = (
        db.query(models.QuizSubmission)
        .filter(
            models.QuizSubmission.video_id == video_id,
            models.QuizSubmission.user_id == current_user.id,
        )
        .order_by(models.QuizSubmission.submitted_at.desc())
        .first()
    )
    if not sub:
        return None
    return _build_result(sub, db)


@router.post("/submit", response_model=schemas.QuizSubmissionResult, status_code=201)
def submit_quiz(
    payload: schemas.QuizSubmitRequest,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _org_video(payload.video_id, current_user.organization_id, db)
    questions = (
        db.query(models.QuizQuestion)
        .filter(models.QuizQuestion.video_id == payload.video_id)
        .all()
    )
    if not questions:
        raise HTTPException(status_code=404, detail="No quiz found for this video")

    q_map = {q.id: q for q in questions}
    gradeable = 0
    correct = 0

    submission = models.QuizSubmission(
        video_id=payload.video_id,
        user_id=current_user.id,
    )
    db.add(submission)
    db.flush()

    for ans in payload.answers:
        q = q_map.get(ans.question_id)
        if not q:
            continue

        is_correct = None

        if q.question_type in [models.QuestionType.mcq, models.QuestionType.true_false]:
            gradeable += 1
            if ans.selected_option_id:
                opt = db.query(models.QuizOption).filter(models.QuizOption.id == ans.selected_option_id).first()
                is_correct = opt.is_correct if opt else False
                if is_correct:
                    correct += 1
            else:
                is_correct = False
        # short_answer stays None (requires manual review)

        db.add(models.QuizAnswer(
            submission_id=submission.id,
            question_id=ans.question_id,
            selected_option_id=ans.selected_option_id,
            answer_text=ans.answer_text,
            is_correct=is_correct,
        ))

    score = round((correct / gradeable) * 100, 1) if gradeable > 0 else None
    submission.score = score
    submission.max_score = gradeable
    db.commit()
    db.refresh(submission)

    return _build_result(submission, db)


def _build_result(submission: models.QuizSubmission, db: Session) -> schemas.QuizSubmissionResult:
    results = []
    for ans in submission.quiz_answers:
        q = ans.question
        correct_opt = next((o.id for o in q.options if o.is_correct), None) if q.options else None
        results.append(schemas.QuizAnswerResult(
            question_id=q.id,
            question_text=q.question_text,
            question_type=q.question_type,
            selected_option_id=ans.selected_option_id,
            answer_text=ans.answer_text,
            is_correct=ans.is_correct,
            correct_option_id=correct_opt,
            explanation=q.explanation,
        ))
    score = submission.score or 0
    return schemas.QuizSubmissionResult(
        submission_id=submission.id,
        score=submission.score,
        max_score=submission.max_score or 0,
        passed=score >= 70,
        answers=results,
    )
