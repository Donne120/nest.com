from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, JSON,
    ForeignKey, Enum as SAEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum
import uuid
import secrets


def gen_uuid():
    return str(uuid.uuid4())


def gen_invite_token():
    """Cryptographically secure random token for invitations and security-sensitive links."""
    return secrets.token_urlsafe(32)


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    learner = "learner"
    educator = "educator"
    owner = "owner"
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


# ─── Revoked tokens (logout blocklist) ───────────────────────────────────────

class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    id = Column(String, primary_key=True, default=gen_uuid)
    jti = Column(String, unique=True, nullable=False, index=True)  # JWT ID
    revoked_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)   # for cleanup


class ATSProvider(str, enum.Enum):
    greenhouse = "greenhouse"
    lever = "lever"
    workable = "workable"


class PaymentType(str, enum.Enum):
    teacher_subscription = "teacher_subscription"
    module_purchase = "module_purchase"
    learner_access = "learner_access"  # student pays org for general course access


class PaymentMethod(str, enum.Enum):
    mtn_momo = "mtn_momo"
    orange_money = "orange_money"
    bank_transfer = "bank_transfer"
    other = "other"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class MeetingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    declined = "declined"
    completed = "completed"


class AssignmentType(str, enum.Enum):
    individual = "individual"
    group = "group"


class AssignmentStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    closed = "closed"


class MergeStatus(str, enum.Enum):
    pending = "pending"
    partial = "partial"
    complete = "complete"


class SubmissionStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"


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
    momo_number = Column(String, nullable=True)   # MTN MoMo number
    momo_name = Column(String, nullable=True)      # MTN MoMo account name
    # ── Additional payment methods ────────────────────────────────────────────
    payment_orange_number = Column(String, nullable=True)
    payment_orange_name   = Column(String, nullable=True)
    payment_bank_name     = Column(String, nullable=True)
    payment_bank_account  = Column(String, nullable=True)
    payment_bank_holder   = Column(String, nullable=True)
    payment_instructions  = Column(String, nullable=True)  # free-text note to learners
    subscription_end = Column(DateTime(timezone=True), nullable=True)
    renewal_notified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="organization", foreign_keys="User.organization_id")
    modules = relationship("Module", back_populates="organization")
    invitations = relationship("Invitation", back_populates="organization")
    invite_links = relationship("InviteLink", back_populates="organization")
    payment_country_configs = relationship(
        "PaymentCountryConfig", back_populates="organization",
        cascade="all, delete-orphan",
    )


# ─── Per-country payment config ───────────────────────────────────────────────

class PaymentCountryConfig(Base):
    __tablename__ = "payment_country_configs"

    id           = Column(String, primary_key=True, default=gen_uuid)
    org_id       = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    country_code = Column(String(4), nullable=False)   # ISO 3166-1 alpha-2: CM, RW …
    country_name = Column(String, nullable=False)       # "Cameroon", "Rwanda" …
    currency_code   = Column(String(10), nullable=False)  # XAF, RWF, KES …
    currency_symbol = Column(String(10), nullable=False)  # FCFA, Fr, KSh …

    # Primary mobile-money / payment method
    provider     = Column(String, nullable=True)   # "MTN MoMo", "M-Pesa" …
    number       = Column(String, nullable=True)
    account_name = Column(String, nullable=True)

    # Optional secondary method (e.g. Orange Money alongside MTN)
    provider2     = Column(String, nullable=True)
    number2       = Column(String, nullable=True)
    account_name2 = Column(String, nullable=True)

    # Recommended price in local currency (pre-fills the form)
    price = Column(Float, nullable=True)

    # Country-specific payment instructions shown to the learner
    instructions = Column(Text, nullable=True)

    is_active  = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="payment_country_configs")

    __table_args__ = (
        UniqueConstraint("org_id", "country_code", name="uq_org_country"),
    )


# ─── Invitation ───────────────────────────────────────────────────────────────

class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(String, primary_key=True, default=gen_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    email = Column(String, nullable=False, index=True)
    token = Column(String, unique=True, nullable=False, index=True, default=gen_invite_token)
    role = Column(SAEnum(UserRole), default=UserRole.learner, nullable=False)
    invited_by = Column(String, ForeignKey("users.id"), nullable=False)
    is_accepted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)

    organization = relationship("Organization", back_populates="invitations")
    inviter = relationship("User", foreign_keys=[invited_by])


# ─── InviteLink (bulk / access-code shareable links) ─────────────────────────

class InviteLink(Base):
    __tablename__ = "invite_links"

    id            = Column(String, primary_key=True, default=gen_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    created_by    = Column(String, ForeignKey("users.id"), nullable=False)

    # URL slug — share as /join/{token}
    token         = Column(String, unique=True, nullable=False, index=True, default=gen_invite_token)

    label         = Column(String, nullable=True)          # friendly name e.g. "Cohort 3 - April 2026"
    role          = Column(SAEnum(UserRole), default=UserRole.learner, nullable=False)

    # Access control
    free_access   = Column(Boolean, default=False, nullable=False)  # skip payment
    access_code   = Column(String, nullable=True)           # optional PIN to enter on join

    # Limits
    max_uses      = Column(Integer, nullable=True)          # None = unlimited
    use_count     = Column(Integer, default=0, nullable=False)
    expires_at    = Column(DateTime(timezone=True), nullable=True)  # None = never expires

    is_active     = Column(Boolean, default=True, nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    organization  = relationship("Organization", back_populates="invite_links")
    creator       = relationship("User", foreign_keys=[created_by])


# ─── User ─────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)  # nullable for super_admin
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.learner, nullable=False)
    avatar_url = Column(String, nullable=True)
    department = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    payment_verified = Column(Boolean, default=False, nullable=False, server_default='false')
    email_verified = Column(Boolean, default=False, nullable=False, server_default='false')
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
    token = Column(String, unique=True, nullable=False, index=True, default=gen_invite_token)
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
    ai_notes = Column(Text, nullable=True)   # educator notes to guide AI answers
    thumbnail_url = Column(String, nullable=True)
    duration_seconds = Column(Integer, nullable=False, default=0)
    order_index = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)
    price = Column(Float, nullable=True)
    is_for_sale = Column(Boolean, default=False, nullable=False)
    currency = Column(String, nullable=True, default="RWF")
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    # Soft delete — set instead of hard DELETE so all-time module count is preserved
    # for plan limit enforcement (prevents delete-reupload fraud).
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    organization = relationship("Organization", back_populates="modules")
    videos = relationship("Video", back_populates="module", order_by="Video.order_index")
    lessons = relationship("Lesson", back_populates="module", order_by="Lesson.order_index")
    creator = relationship("User", foreign_keys=[created_by])
    progress = relationship("UserProgress", back_populates="module")


# ─── Video ────────────────────────────────────────────────────────────────────

class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True, default=gen_uuid)
    module_id = Column(String, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
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
    video_id = Column(String, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, unique=True)
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
    video_id = Column(String, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
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
    question_id = Column(String, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
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
    module_id = Column(String, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    video_id = Column(String, ForeignKey("videos.id", ondelete="SET NULL"), nullable=True)
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
    video_id = Column(String, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
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
    question_id = Column(String, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    option_text = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)

    question = relationship("QuizQuestion", back_populates="options")


class QuizSubmission(Base):
    __tablename__ = "quiz_submissions"

    id = Column(String, primary_key=True, default=gen_uuid)
    video_id = Column(String, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    score = Column(Float, nullable=True)
    max_score = Column(Integer, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    quiz_answers = relationship("QuizAnswer", back_populates="submission", cascade="all, delete-orphan")


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(String, primary_key=True, default=gen_uuid)
    submission_id = Column(String, ForeignKey("quiz_submissions.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    selected_option_id = Column(String, ForeignKey("quiz_options.id", ondelete="SET NULL"), nullable=True)
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
    video_id = Column(String, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
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
    learner_id = Column(String, ForeignKey("users.id"), nullable=False)
    module_id = Column(String, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)  # assigned on confirm

    requested_at = Column(DateTime(timezone=True), nullable=True)   # preferred time from learner
    confirmed_at = Column(DateTime(timezone=True), nullable=True)   # confirmed time by owner
    note = Column(Text, nullable=True)                               # learner context note
    meeting_link = Column(String, nullable=True)                     # Zoom/Meet/Teams URL
    decline_reason = Column(Text, nullable=True)

    status = Column(SAEnum(MeetingStatus), default=MeetingStatus.pending, nullable=False)
    # Assignment integration
    assignment_id = Column(String, ForeignKey("assignments.id", ondelete="SET NULL"), nullable=True)
    locked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization")
    learner = relationship("User", foreign_keys=[learner_id])
    owner = relationship("User", foreign_keys=[owner_id])
    module = relationship("Module")
    assignment = relationship("Assignment", foreign_keys=[assignment_id])


# ─── Completion Certificates ──────────────────────────────────────────────────

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String, primary_key=True, default=gen_uuid)
    cert_number = Column(String, unique=True, nullable=False, index=True)  # NEST-2026-00001
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    module_id = Column(String, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    module = relationship("Module")
    organization = relationship("Organization")


# ─── ATS Integration ──────────────────────────────────────────────────────────

# ─── Assignments ──────────────────────────────────────────────────────────────

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String, primary_key=True, default=gen_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    module_id = Column(String, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    type = Column(SAEnum(AssignmentType), nullable=False, default=AssignmentType.individual)
    max_group_size = Column(Integer, nullable=True)
    portions = Column(JSON, nullable=True)  # list of strings e.g. ["Introduction", "Analysis"]
    deadline = Column(DateTime(timezone=True), nullable=True)
    meeting_1_locked = Column(Boolean, default=False, nullable=False)
    meeting_2_locked = Column(Boolean, default=False, nullable=False)
    status = Column(SAEnum(AssignmentStatus), default=AssignmentStatus.draft, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization")
    creator = relationship("User", foreign_keys=[created_by])
    module = relationship("Module")
    groups = relationship("AssignmentGroup", back_populates="assignment", cascade="all, delete-orphan")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentGroup(Base):
    __tablename__ = "assignment_groups"

    id = Column(String, primary_key=True, default=gen_uuid)
    assignment_id = Column(String, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    kickoff_meeting_id = Column(String, ForeignKey("meeting_bookings.id", ondelete="SET NULL"), nullable=True)
    review_meeting_id = Column(String, ForeignKey("meeting_bookings.id", ondelete="SET NULL"), nullable=True)
    merged_document = Column(JSON, nullable=True)
    merge_status = Column(SAEnum(MergeStatus), default=MergeStatus.pending, nullable=False)
    final_submitted_at = Column(DateTime(timezone=True), nullable=True)
    instructor_feedback = Column(Text, nullable=True)
    grade = Column(String, nullable=True)
    reviewed_merged_content = Column(JSON, nullable=True)
    reviewed_merged_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assignment = relationship("Assignment", back_populates="groups")
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan", order_by="GroupMember.portion_index")
    kickoff_meeting = relationship("MeetingBooking", foreign_keys=[kickoff_meeting_id])
    review_meeting = relationship("MeetingBooking", foreign_keys=[review_meeting_id])


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(String, primary_key=True, default=gen_uuid)
    group_id = Column(String, ForeignKey("assignment_groups.id", ondelete="CASCADE"), nullable=False)
    learner_id = Column(String, ForeignKey("users.id"), nullable=False)
    portion_label = Column(String, nullable=True)
    portion_index = Column(Integer, default=0, nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("AssignmentGroup", back_populates="members")
    learner = relationship("User", foreign_keys=[learner_id])
    submission = relationship("AssignmentSubmission", back_populates="group_member", uselist=False)


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(String, primary_key=True, default=gen_uuid)
    group_member_id = Column(String, ForeignKey("group_members.id", ondelete="CASCADE"), nullable=True)
    assignment_id = Column(String, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    learner_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(JSON, nullable=True)  # TipTap JSON document
    word_count = Column(Integer, default=0, nullable=False)
    status = Column(SAEnum(SubmissionStatus), default=SubmissionStatus.draft, nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    grade = Column(String, nullable=True)                        # e.g. "A", "85/100", "Pass"
    reviewed_content = Column(JSON, nullable=True)               # TipTap doc with comment marks
    instructor_feedback = Column(Text, nullable=True)            # overall written feedback
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    group_member = relationship("GroupMember", back_populates="submission")
    assignment = relationship("Assignment", back_populates="submissions")
    learner = relationship("User", foreign_keys=[learner_id])


# ─── ATS Integration ──────────────────────────────────────────────────────────

class ATSConnection(Base):
    __tablename__ = "ats_connections"

    id = Column(String, primary_key=True, default=gen_uuid)
    org_id = Column(String, ForeignKey("organizations.id"), unique=True, nullable=False)
    provider = Column(SAEnum(ATSProvider), nullable=False)
    api_key = Column(String, nullable=False)
    webhook_secret = Column(String, nullable=True, default=gen_uuid)
    default_role = Column(SAEnum(UserRole), default=UserRole.learner, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization")


# ─── Payment Submissions ──────────────────────────────────────────────────────

class PaymentSubmission(Base):
    __tablename__ = "payment_submissions"

    id = Column(String, primary_key=True, default=gen_uuid)
    payer_id = Column(String, ForeignKey("users.id"), nullable=False)
    payment_type = Column(SAEnum(PaymentType), nullable=False)
    payment_method = Column(SAEnum(PaymentMethod), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False, default="RWF")
    phone_number = Column(String, nullable=True)
    transaction_reference = Column(String, nullable=True)
    proof_image_url = Column(String, nullable=True)
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.pending, nullable=False)
    notes = Column(Text, nullable=True)
    plan = Column(SAEnum(Plan), nullable=True)
    module_id = Column(String, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True)
    payee_id = Column(String, ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    reviewed_by = Column(String, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    payer = relationship("User", foreign_keys=[payer_id])
    payee = relationship("User", foreign_keys=[payee_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    module = relationship("Module", foreign_keys=[module_id])


# ─── Lessons (notes/screenshot-based course content) ─────────────────────────

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(String, primary_key=True, default=gen_uuid)
    module_id = Column(
        String, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False
    )
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    content = Column(JSON, nullable=True)  # list of LessonBlock dicts
    order_index = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    module = relationship("Module", back_populates="lessons")
    creator = relationship("User", foreign_keys=[created_by])
    questions = relationship(
        "LessonQuestion",
        back_populates="lesson",
        order_by="LessonQuestion.created_at",
        cascade="all, delete-orphan",
    )


class LessonQuestion(Base):
    __tablename__ = "lesson_questions"

    id = Column(String, primary_key=True, default=gen_uuid)
    lesson_id = Column(
        String, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    block_id = Column(String, nullable=False)   # anchor to a specific block
    asked_by = Column(String, ForeignKey("users.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    status = Column(
        SAEnum(QuestionStatus), default=QuestionStatus.pending, nullable=False
    )
    is_public = Column(Boolean, default=True)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lesson = relationship("Lesson", back_populates="questions")
    asked_by_user = relationship("User", foreign_keys=[asked_by])
    answers = relationship(
        "LessonAnswer",
        back_populates="question",
        order_by="LessonAnswer.created_at",
        cascade="all, delete-orphan",
    )


class LessonAnswer(Base):
    __tablename__ = "lesson_answers"

    id = Column(String, primary_key=True, default=gen_uuid)
    question_id = Column(
        String, ForeignKey("lesson_questions.id", ondelete="CASCADE"), nullable=False
    )
    answered_by = Column(String, ForeignKey("users.id"), nullable=False)
    answer_text = Column(Text, nullable=False)
    is_official = Column(Boolean, default=False)
    is_ai_generated = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    question = relationship("LessonQuestion", back_populates="answers")
    answered_by_user = relationship("User", foreign_keys=[answered_by])


# ─── Module Access (purchased by student) ────────────────────────────────────

class ModuleAccess(Base):
    __tablename__ = "module_access"

    id = Column(String, primary_key=True, default=gen_uuid)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    module_id = Column(String, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    payment_submission_id = Column(String, ForeignKey("payment_submissions.id", ondelete="SET NULL"), nullable=True)
    granted_by = Column(String, ForeignKey("users.id"), nullable=True)
    granted_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", foreign_keys=[student_id])
    module = relationship("Module", foreign_keys=[module_id])
    payment = relationship("PaymentSubmission", foreign_keys=[payment_submission_id])
    grantor = relationship("User", foreign_keys=[granted_by])
