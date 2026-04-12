from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime
from models import UserRole, QuestionStatus, ModuleStatus, QuestionType, Plan, SubscriptionStatus, MeetingStatus, ATSProvider, AssignmentType, AssignmentStatus, MergeStatus, SubmissionStatus


# ─── Organization ─────────────────────────────────────────────────────────────

class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = None  # auto-generated if omitted


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    logo_url: Optional[str] = None
    brand_color: Optional[str] = None  # hex string e.g. "#6366f1"
    momo_number: Optional[str] = None  # teacher's MoMo number for student payments
    momo_name: Optional[str] = None    # account holder name shown to students


class OrganizationOut(BaseModel):
    id: str
    name: str
    slug: str
    logo_url: Optional[str]
    brand_color: Optional[str]
    momo_number: Optional[str]
    momo_name: Optional[str]
    plan: Plan
    subscription_status: SubscriptionStatus
    trial_ends_at: Optional[datetime]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Auth ─────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"
    organization: Optional[OrganizationOut] = None


class TokenData(BaseModel):
    user_id: str
    org_id: Optional[str] = None


# ─── Register Org (Company signup) ────────────────────────────────────────────

class RegisterOrgRequest(BaseModel):
    org_name: str = Field(..., min_length=2, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)


# ─── Password Reset / Change ──────────────────────────────────────────────────

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


# ─── Invitations ──────────────────────────────────────────────────────────────

class InvitationCreate(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.learner


class InvitationOut(BaseModel):
    id: str
    email: str
    role: UserRole
    is_accepted: bool
    created_at: datetime
    expires_at: datetime
    invite_url: Optional[str] = None  # populated on create response only

    class Config:
        from_attributes = True


class InviteInfoOut(BaseModel):
    """Public info returned before accepting an invite (no auth required)."""
    org_name: str
    org_logo_url: Optional[str]
    org_momo_number: Optional[str]
    invited_role: UserRole
    expires_at: datetime


class AcceptInviteRequest(BaseModel):
    token: str
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)


# ─── User ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole = UserRole.learner
    department: Optional[str] = Field(None, max_length=100)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=500)


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserOut(BaseModel):
    id: str
    organization_id: Optional[str]
    email: str
    full_name: str
    role: UserRole
    avatar_url: Optional[str]
    department: Optional[str]
    is_active: bool
    payment_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Module ───────────────────────────────────────────────────────────────────

class ModuleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    resources: Optional[list] = None
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    order_index: int = 0
    ai_notes: Optional[str] = None


class ModuleUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    resources: Optional[list] = None
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    order_index: Optional[int] = None
    is_published: Optional[bool] = None
    ai_notes: Optional[str] = None


class ModuleOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    resources: Optional[list] = None
    thumbnail_url: Optional[str]
    ai_notes: Optional[str] = None
    duration_seconds: int
    order_index: int
    is_published: bool
    created_at: datetime
    video_count: int = 0
    question_count: int = 0

    class Config:
        from_attributes = True


class ModuleWithProgress(ModuleOut):
    status: ModuleStatus = ModuleStatus.not_started
    progress_seconds: float = 0
    last_viewed_at: Optional[datetime] = None


# ─── Video ────────────────────────────────────────────────────────────────────

class VideoCreate(BaseModel):
    module_id: str
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    video_url: str = Field(..., max_length=500)
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    duration_seconds: int = 0
    order_index: int = 0
    captions_url: Optional[str] = Field(None, max_length=500)


class VideoUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    video_url: Optional[str] = Field(None, max_length=500)
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    duration_seconds: Optional[int] = None
    captions_url: Optional[str] = Field(None, max_length=500)


class VideoOut(BaseModel):
    id: str
    module_id: str
    title: str
    description: Optional[str]
    video_url: str
    thumbnail_url: Optional[str]
    duration_seconds: int
    order_index: int
    captions_url: Optional[str]
    created_at: datetime
    question_count: int = 0

    class Config:
        from_attributes = True


# ─── Answer ───────────────────────────────────────────────────────────────────

class AnswerCreate(BaseModel):
    answer_text: str = Field(..., min_length=1, max_length=10000)
    is_official: bool = False


class AnswerOut(BaseModel):
    id: str
    question_id: str
    answer_text: str
    is_official: bool
    is_ai_generated: bool = False
    created_at: datetime
    answered_by_user: UserOut

    class Config:
        from_attributes = True


# ─── Question ─────────────────────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    video_id: str
    timestamp_seconds: float
    question_text: str = Field(..., min_length=1, max_length=2000)
    is_public: bool = True


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = Field(None, min_length=1, max_length=2000)
    status: Optional[QuestionStatus] = None
    is_public: Optional[bool] = None


class QuestionOut(BaseModel):
    id: str
    video_id: str
    timestamp_seconds: float
    question_text: str
    status: QuestionStatus
    is_public: bool
    view_count: int
    created_at: datetime
    updated_at: Optional[datetime]
    asked_by_user: UserOut
    answers: List[AnswerOut] = []

    class Config:
        from_attributes = True


# ─── Timeline Marker ──────────────────────────────────────────────────────────

class TimelineMarker(BaseModel):
    timestamp_seconds: float
    question_id: str
    question_preview: str
    status: QuestionStatus
    answer_count: int


# ─── Notification ─────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: str
    type: str
    title: str
    message: str
    reference_id: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True



# --- Transcript ---

class TranscriptManualSet(BaseModel):
    text: str

class TranscriptOut(BaseModel):
    id: str
    video_id: str
    full_text: Optional[str]
    segments: Optional[list] = None
    language: Optional[str]
    status: str
    error_message: Optional[str]
    word_count: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# ─── Analytics ────────────────────────────────────────────────────────────────

class ModuleAnalytics(BaseModel):
    module_id: str
    module_title: str
    total_questions: int
    answered_questions: int
    pending_questions: int
    avg_response_time_hours: float
    top_confusion_timestamps: List[float]


class DashboardStats(BaseModel):
    total_questions: int
    pending_questions: int
    answered_questions: int
    total_learners: int
    avg_response_time_hours: float
    modules_with_questions: int


# ─── Progress ─────────────────────────────────────────────────────────────────

class ProgressUpdate(BaseModel):
    video_id: str
    progress_seconds: float
    duration_seconds: Optional[int] = None   # real duration from player; saves to DB if video has 0
    status: Optional[ModuleStatus] = None


# ─── Quiz ─────────────────────────────────────────────────────────────────────

class QuizOptionCreate(BaseModel):
    option_text: str
    is_correct: bool = False
    order_index: int = 0


class QuizOptionOut(BaseModel):
    id: str
    option_text: str
    is_correct: bool
    order_index: int

    class Config:
        from_attributes = True


class QuizOptionPublic(BaseModel):
    id: str
    option_text: str
    order_index: int

    class Config:
        from_attributes = True


class QuizQuestionCreate(BaseModel):
    question_text: str
    question_type: QuestionType
    order_index: int = 0
    is_required: bool = True
    explanation: Optional[str] = None
    options: List[QuizOptionCreate] = []


class QuizQuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[QuestionType] = None
    order_index: Optional[int] = None
    is_required: Optional[bool] = None
    explanation: Optional[str] = None
    options: Optional[List[QuizOptionCreate]] = None


class QuizQuestionOut(BaseModel):
    id: str
    video_id: str
    question_text: str
    question_type: QuestionType
    order_index: int
    is_required: bool
    explanation: Optional[str]
    created_at: datetime
    options: List[QuizOptionOut] = []

    class Config:
        from_attributes = True


class QuizQuestionPublic(BaseModel):
    id: str
    video_id: str
    question_text: str
    question_type: QuestionType
    order_index: int
    is_required: bool
    options: List[QuizOptionPublic] = []

    class Config:
        from_attributes = True


class QuizAnswerSubmit(BaseModel):
    question_id: str
    selected_option_id: Optional[str] = None
    answer_text: Optional[str] = None


class QuizSubmitRequest(BaseModel):
    video_id: str
    answers: List[QuizAnswerSubmit]


class QuizAnswerResult(BaseModel):
    question_id: str
    question_text: str
    question_type: QuestionType
    selected_option_id: Optional[str]
    answer_text: Optional[str]
    is_correct: Optional[bool]
    correct_option_id: Optional[str]
    explanation: Optional[str]


class QuizSubmissionResult(BaseModel):
    submission_id: str
    score: Optional[float]
    max_score: int
    passed: bool
    answers: List[QuizAnswerResult]


# ─── Admin Course Management ───────────────────────────────────────────────────

class VideoReorder(BaseModel):
    video_id: str
    order_index: int


Token.model_rebuild()


# ─── Video Notes ──────────────────────────────────────────────────────────────

# ─── Meetings ─────────────────────────────────────────────────────────────────

class MeetingCreate(BaseModel):
    module_id: Optional[str] = None
    requested_at: Optional[datetime] = None
    note: Optional[str] = Field(None, max_length=1000)


class MeetingConfirm(BaseModel):
    confirmed_at: datetime
    meeting_link: str = Field(..., min_length=5, max_length=500)


class MeetingDecline(BaseModel):
    decline_reason: Optional[str] = Field(None, max_length=500)


class MeetingOut(BaseModel):
    id: str
    organization_id: str
    learner_id: str
    module_id: Optional[str]
    owner_id: Optional[str]
    requested_at: Optional[datetime]
    confirmed_at: Optional[datetime]
    note: Optional[str]
    meeting_link: Optional[str]
    decline_reason: Optional[str]
    status: MeetingStatus
    created_at: datetime
    updated_at: Optional[datetime]
    learner: UserOut
    owner: Optional[UserOut]
    module_title: Optional[str] = None

    class Config:
        from_attributes = True


# ─── Video Notes ──────────────────────────────────────────────────────────────

# ─── Certificates ─────────────────────────────────────────────────────────────

class CertificateOut(BaseModel):
    id: str
    cert_number: str
    module_id: str
    org_id: str
    issued_at: datetime
    user: "UserOut"
    module: "ModuleOut"
    organization: "OrganizationOut"

    class Config:
        from_attributes = True


# ─── People Analytics ─────────────────────────────────────────────────────────

class LearnerPeopleStats(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: Optional[str]
    joined: datetime
    days_since_joined: int
    last_active_at: Optional[datetime]
    days_since_active: Optional[int]
    completion_pct: int
    completed_modules: int
    total_modules: int
    time_to_complete_days: Optional[int]
    is_at_risk: bool
    is_star: bool


class PeopleReport(BaseModel):
    learners: List[LearnerPeopleStats]
    summary: dict


# ─── Benchmarks ───────────────────────────────────────────────────────────────

class BenchmarkData(BaseModel):
    org_completion_rate: float
    platform_avg_completion_rate: float
    org_avg_days_to_complete: Optional[float]
    platform_avg_days_to_complete: Optional[float]
    org_rank_percentile: int
    total_orgs_compared: int


# ─── ATS ──────────────────────────────────────────────────────────────────────

class ATSConnectionCreate(BaseModel):
    provider: ATSProvider
    api_key: str
    default_role: UserRole = UserRole.learner


class ATSConnectionOut(BaseModel):
    id: str
    provider: ATSProvider
    default_role: UserRole
    is_active: bool
    webhook_secret: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class NoteCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    timestamp_seconds: Optional[float] = None


class NoteUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class NoteOut(BaseModel):
    id: str
    content: str
    timestamp_seconds: Optional[float]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─── Assignments ──────────────────────────────────────────────────────────────

class AssignmentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    type: AssignmentType = AssignmentType.individual
    module_id: Optional[str] = None
    max_group_size: Optional[int] = Field(None, ge=2, le=50)
    portions: Optional[List[str]] = None
    deadline: Optional[datetime] = None


class AssignmentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    module_id: Optional[str] = None
    max_group_size: Optional[int] = Field(None, ge=2, le=50)
    portions: Optional[List[str]] = None
    deadline: Optional[datetime] = None
    meeting_1_locked: Optional[bool] = None
    meeting_2_locked: Optional[bool] = None


class AssignmentOut(BaseModel):
    id: str
    organization_id: str
    module_id: Optional[str]
    created_by: str
    title: str
    description: Optional[str]
    type: AssignmentType
    max_group_size: Optional[int]
    portions: Optional[List[str]]
    deadline: Optional[datetime]
    meeting_1_locked: bool
    meeting_2_locked: bool
    status: AssignmentStatus
    created_at: datetime
    updated_at: Optional[datetime]
    creator: "UserOut"
    group_count: int = 0
    submission_count: int = 0
    # Learner-specific fields (populated only on /my endpoint)
    my_submission_status: Optional[str] = None      # 'not_started' | 'draft' | 'submitted'
    my_group_merge_status: Optional[str] = None     # 'pending' | 'partial' | 'complete' | 'final_submitted'
    my_portion_label: Optional[str] = None

    class Config:
        from_attributes = True


class GroupMemberOut(BaseModel):
    id: str
    group_id: str
    learner_id: str
    portion_label: Optional[str]
    portion_index: int
    submitted_at: Optional[datetime]
    learner: "UserOut"

    class Config:
        from_attributes = True


class AssignmentGroupOut(BaseModel):
    id: str
    assignment_id: str
    kickoff_meeting_id: Optional[str]
    review_meeting_id: Optional[str]
    merge_status: MergeStatus
    merged_document: Optional[Any] = None
    final_submitted_at: Optional[datetime]
    instructor_feedback: Optional[str]
    grade: Optional[str] = None
    reviewed_merged_content: Optional[Any] = None
    reviewed_merged_at: Optional[datetime] = None
    members: List[GroupMemberOut] = []

    class Config:
        from_attributes = True


class GroupReview(BaseModel):
    grade: Optional[str] = None
    reviewed_merged_content: Optional[Any] = None
    instructor_feedback: Optional[str] = None


class AssignmentSubmissionOut(BaseModel):
    id: str
    group_member_id: Optional[str]
    assignment_id: str
    learner_id: str
    learner: Optional["UserOut"] = None
    content: Optional[Any] = None
    word_count: int
    status: SubmissionStatus
    submitted_at: Optional[datetime]
    updated_at: Optional[datetime]
    grade: Optional[str] = None
    reviewed_content: Optional[Any] = None
    instructor_feedback: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SubmissionSave(BaseModel):
    content: Optional[Any] = None
    word_count: int = 0
    submit: bool = False  # True = final submit, False = save draft


class FeedbackCreate(BaseModel):
    feedback: str = Field(..., min_length=1, max_length=5000)


class SubmissionReview(BaseModel):
    grade: Optional[str] = None
    reviewed_content: Optional[Any] = None   # TipTap doc with comment marks embedded
    instructor_feedback: Optional[str] = None


# ─── Lessons ──────────────────────────────────────────────────────────────────

class LessonBlock(BaseModel):
    id: str
    type: str  # 'text' | 'image'
    content: Optional[str] = None   # text block body
    url: Optional[str] = None       # image block URL
    caption: Optional[str] = None   # image block caption


class LessonCreate(BaseModel):
    module_id: str
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    content: Optional[List[LessonBlock]] = None
    order_index: int = 0


class LessonUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    content: Optional[List[LessonBlock]] = None
    order_index: Optional[int] = None
    is_published: Optional[bool] = None


class LessonOut(BaseModel):
    id: str
    module_id: str
    title: str
    description: Optional[str]
    content: Optional[List[LessonBlock]] = None
    order_index: int
    is_published: bool
    created_at: datetime
    question_count: int = 0

    class Config:
        from_attributes = True


# ─── Lesson Q&A ───────────────────────────────────────────────────────────────

class LessonAnswerCreate(BaseModel):
    answer_text: str = Field(..., min_length=1, max_length=10000)
    is_official: bool = False


class LessonAnswerOut(BaseModel):
    id: str
    question_id: str
    answer_text: str
    is_official: bool
    is_ai_generated: bool = False
    created_at: datetime
    answered_by_user: UserOut

    class Config:
        from_attributes = True


class LessonQuestionCreate(BaseModel):
    lesson_id: str
    block_id: str
    question_text: str = Field(..., min_length=1, max_length=2000)
    is_public: bool = True


class LessonQuestionUpdate(BaseModel):
    question_text: Optional[str] = Field(None, min_length=1, max_length=2000)
    status: Optional[QuestionStatus] = None
    is_public: Optional[bool] = None


class LessonQuestionOut(BaseModel):
    id: str
    lesson_id: str
    block_id: str
    question_text: str
    status: QuestionStatus
    is_public: bool
    view_count: int
    created_at: datetime
    updated_at: Optional[datetime]
    asked_by_user: UserOut
    answers: List[LessonAnswerOut] = []

    class Config:
        from_attributes = True


# ─── InviteLink ───────────────────────────────────────────────────────────────

class InviteLinkCreate(BaseModel):
    label: Optional[str] = None
    role: str = "learner"
    free_access: bool = False
    access_code: Optional[str] = Field(None, min_length=4, max_length=32)
    max_uses: Optional[int] = Field(None, ge=1)
    expires_days: Optional[int] = Field(None, ge=1, le=365)   # days from now; None = never


class InviteLinkOut(BaseModel):
    id: str
    token: str
    label: Optional[str]
    role: str
    free_access: bool
    access_code: Optional[str]
    max_uses: Optional[int]
    use_count: int
    expires_at: Optional[datetime]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class JoinLinkInfo(BaseModel):
    """Public info returned before the student registers."""
    org_name: str
    org_logo_url: Optional[str]
    label: Optional[str]
    role: str
    free_access: bool
    requires_code: bool      # True if access_code is set (don't expose the actual code)
    max_uses: Optional[int]
    use_count: int
    expires_at: Optional[datetime]


class JoinLinkRegister(BaseModel):
    """Payload the student submits to register via a bulk invite link."""
    full_name: str = Field(..., min_length=1, max_length=120)
    email: str
    password: str = Field(..., min_length=6)
    access_code: Optional[str] = None   # required if link has an access_code set
