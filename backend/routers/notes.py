from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/api/notes", tags=["notes"])


def _own_note(note_id: str, user_id: str, db: Session) -> models.VideoNote:
    note = db.query(models.VideoNote).filter(
        models.VideoNote.id == note_id,
        models.VideoNote.user_id == user_id,
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.get("/video/{video_id}", response_model=List[schemas.NoteOut])
def get_notes(
    video_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.VideoNote)
        .filter(
            models.VideoNote.video_id == video_id,
            models.VideoNote.user_id == current_user.id,
        )
        .order_by(models.VideoNote.timestamp_seconds.asc().nullslast(), models.VideoNote.created_at.asc())
        .all()
    )


@router.post("/video/{video_id}", response_model=schemas.NoteOut, status_code=201)
def create_note(
    video_id: str,
    payload: schemas.NoteCreate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    note = models.VideoNote(
        user_id=current_user.id,
        video_id=video_id,
        content=payload.content,
        timestamp_seconds=payload.timestamp_seconds,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/{note_id}", response_model=schemas.NoteOut)
def update_note(
    note_id: str,
    payload: schemas.NoteUpdate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    note = _own_note(note_id, current_user.id, db)
    note.content = payload.content
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=204)
def delete_note(
    note_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    note = _own_note(note_id, current_user.id, db)
    db.delete(note)
    db.commit()
