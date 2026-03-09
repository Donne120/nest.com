from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, JSON,
    ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum
import uuid


def gen_uuid():
    return str(uuid.uuid4())


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    employee = "employee"
    manager = "manager"
    admin = "admin"
    super_admin = "super_admin"


class Plan(str, enum.Enum):
    trial = "trial"
    starter = "starter"
    professional = "professional"
    enterprise = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    cancelled = "cancelled"


class QuestionStatus(str, enum.Enum):
    pending = "pending"
    answered = "answered"
    archived = "archived"


class ModuleStatus(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class QuestionType(str, enum.Enum):
    mcq = "mcq"
    short_answer = "short_answer"
    true_false = "true_false"


class MeetingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    declined = "declined"
    completed = "completed"


class TranscriptStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    done = "done"
    failed = "failed"
    too_large = "too_large"
    manual = "manual"


# ─── Organization (Tenant root) ───────────────────────────────────────────────

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)  # URL-safe identifier
    logo_url = Column(String, nullable=True)
    brand_color = Column(String, nullable=True, default="#6366f1")  # hex
    plan = Column(SAEnum(Plan), default=Plan.trial, nullable=False)
    subscription_status = Column(SAEnum(SubscriptionStatus), default=SubscriptionStatus.active, nullable=False)
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="organization", foreign_keys="User.organization_id")
    modules = relationship("Module", back_populates="organization")
    invitations = relationship("Invitation", back_populates="organization")


# ─── Invitation ───────────────────────────────────────────────────────────────

class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(String, primary_key=True, default=gen_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    email = Column(String, nullable=False, index=True)
    token = Column(String, unique=True, nullable=False, index=True, default=gen_uuid)
    role = Column(SAEnum(UserRole), default=UserRole.employee, nullable=False)
    invited_by = Column(String, ForeignKey("users.id"), nullable=False)
    is_accepted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)

    organization = relationship("Organization", back_populates="invitations")
    inviter = relationship("User", foreign_keys=[invited_by])


# ─── User ─────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)  # nullable for super_admin
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.employee, nullable=False)
    avatar_url = Column(String, nullable=True)
    department = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization", back_populates="users", foreign_keys=[organization_id])
    questions = relationship("Question", back_populates="asked_by_user", foreign_keys="Question.asked_by")
    answers = relationship("Answer", back_populates="answered_by_user")
    progress = relationship("UserProgress", back_populates="user")


# ─── Password Reset Token ─────────────────────────────────────────────────────

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True, default=gen_uuid)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")


# ─── Module ───────────────────────────────────────────────────────────────────

class Module(Base):
    __tablename__ = "modules"

    id = Column(String, primary_key=True, default=gen_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)  # nullable for migration
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    resources = Column(JSON, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    duration_seconds = Column(Integer, nullable=False, default=0)
    order_index = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization", back_populates="modules")
    videos = relationship("Video", back_populates="module", order_by="Video.order_index")
    creator = relationship("User", foreign_keys=[created_by])
    progress = relationship("UserProgress", back_populates="module")


# ─── Video ────────────────────────────────────────────────────────────────────

class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True, default=gen_uuid)
    module_id = Column(String, ForeignKey("modules.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    video_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    duration_seconds = Column(Integer, nullable=False, default=0)
    order_index = Column(Integer, default=0)
    captions_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    module = relationship("Module", back_populates="videos")
    questions = relationship("Question", back_populates="video", order_by="Question.timestamp_seconds")
    transcript = relationship("VideoTranscript", back_populates="video", uselist=False, cascade="all, delete-orphan")
    quiz_questions = relationship("QuizQuestion", back_populates="video", order_by="QuizQuestion.order_index", cascade="all, delete-orphan")




# --- Video Transcript ---

class VideoTranscript(Base):
    __tablename__ = "video_transcripts"

    id = Column(String, primary_key=True, default=gen_uuid)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False, unique=True)
    full_text = Column(Text, nullable=True)
    segments = Column(JSON, nullable=True)
    language = Column(String, nullable=True, default="en")
    status = Column(SAEnum(TranscriptStatus), default=TranscriptStatus.pending, nullable=False)
    error_message = Column(String, nullable=True)
    word_count = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    video = relationship("Video", back_populates="transcript")

# ─── Q&A ──────────────────────────────────────────────────────────────────────

class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=gen_uuid)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    asked_by = Column(String, ForeignKey("users.id"), nullable=False)
    timestamp_seconds = Column(Float, nullable=False)
    question_text = Column(Text, nullable=False)
    status = Column(SAEnum(QuestionStatus), default=QuestionStatus.pending, nullable=False)
    is_public = Column(Boolean, default=True)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    video = relationship("Video", back_populates="questions")
    asked_by_user = relationship("User", back_populates="questions", foreign_keys=[asked_by])
    answers = relationship("Answer", back_populates="question", order_by="Answer.created_at")


class Answer(Base):
    __tablename__ = "answers"

    id = Column(String, primary_key=True, default=gen_uuid)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    answered_by = Column(String, ForeignKey("users.id"), nullable=False)
    answer_text = Column(Text, nullable=False)
    is_official = Column(Boolean, default=False)
    is_ai_generated = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    question = relationship("Question", back_populates="answers")
    answered_by_user = relationship("User", back_populates="answers")


# ─── Progress ─────────────────────────────────────────────────────────────────

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    module_id = Column(String, ForeignKey("modules.id"), nullable=False)
    video_id = Column(String, ForeignKey("videos.id"), nullable=True)
    status = Column(SAEnum(ModuleStatus), default=ModuleStatus.not_started)
    progress_seconds = Column(Float, default=0)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    last_viewed_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="progress")
    module = relationship("Module", back_populates="progress")


# ─── Quiz ─────────────────────────────────────────────────────────────────────

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String, primary_key=True, default=gen_uuid)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(SAEnum(QuestionType), nullable=False, default=QuestionType.mcq)
    order_index = Column(Integer, default=0)
    is_required = Column(Boolean, default=True)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    video = relationship("Video", back_populates="quiz_questions")
    options = relationship("QuizOption", back_populates="question", order_by="QuizOption.order_index", cascade="all, delete-orphan")
    answers = relationship("QuizAnswer", back_populates="question")


class QuizOption(Base):
    __tablename__ = "quiz_options"

    id = Column(String, primary_key=True, default=gen_uuid)
    question_id = Column(String, ForeignKey("quiz_questions.id"), nullable=False)
    option_text = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)

    question = relationship("QuizQuestion", back_populates="options")


class QuizSubmission(Base):
    __tablename__ = "quiz_submissions"

    id = Column(String, primary_key=True, default=gen_uuid)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    score = Column(Float, nullable=True)
    max_score = Column(Integer, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    quiz_answers = relationship("QuizAnswer", back_populates="submission", cascade="all, delete-orphan")


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(String, primary_key=True, default=gen_uuid)
    submission_id = Column(String, ForeignKey("quiz_submissions.id"), nullable=False)
    question_id = Column(String, ForeignKey("quiz_questions.id"), nullable=False)
    selected_option_id = Column(String, ForeignKey("quiz_options.id"), nullable=True)
    answer_text = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)

    submission = relationship("QuizSubmission", back_populates="quiz_answers")
    question = relationship("QuizQuestion", back_populates="answers")
    selected_option = relationship("QuizOption", foreign_keys=[selected_option_id])


# ─── Video Notes (personal learner notes) ────────────────────────────────────

class VideoNote(Base):
    __tablename__ = "video_notes"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    content = Column(Text, nullable=False)
    timestamp_seconds = Column(Float, nullable=True)   # None = general note
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", foreign_keys=[user_id])
    video = relationship("Video", foreign_keys=[video_id])


# ─── Notifications ────────────────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    reference_id = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])


# ─── Meeting Bookings ─────────────────────────────────────────────────────────

class MeetingBooking(Base):
    __tablename__ = "meeting_bookings"

    id = Column(String, primary_key=True, default=gen_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    employee_id = Column(String, ForeignKey("users.id"), nullable=False)
    module_id = Column(String, ForeignKey("modules.id"), nullable=True)
    admin_id = Column(String, ForeignKey("users.id"), nullable=True)  # assigned on confirm

    requested_at = Column(DateTime(timezone=True), nullable=True)   # preferred time from employee
    confirmed_at = Column(DateTime(timezone=True), nullable=True)   # confirmed time by admin
    note = Column(Text, nullable=True)                               # employee context note
    meeting_link = Column(String, nullable=True)                     # Zoom/Meet/Teams URL
    decline_reason = Column(Text, nullable=True)

    status = Column(SAEnum(MeetingStatus), default=MeetingStatus.pending, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization")
    employee = relationship("User", foreign_keys=[employee_id])
    admin = relationship("User", foreign_keys=[admin_id])
    module = relationship("Module")
