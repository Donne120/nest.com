export type UserRole = 'employee' | 'manager' | 'admin' | 'super_admin';
export type QuestionStatus = 'pending' | 'answered' | 'archived';
export type ModuleStatus = 'not_started' | 'in_progress' | 'completed';
export type Plan = 'trial' | 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

// ─── Organization ─────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
  plan: Plan;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

// ─── Invitation ───────────────────────────────────────────────────────────────

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  is_accepted: boolean;
  created_at: string;
  expires_at: string;
  invite_url?: string | null;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  organization_id: string | null;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  department: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
  organization: Organization | null;
}

// ─── Q&A ──────────────────────────────────────────────────────────────────────

export interface Answer {
  id: string;
  question_id: string;
  answer_text: string;
  is_official: boolean;
  is_ai_generated: boolean;
  created_at: string;
  answered_by_user: User;
}

export interface Question {
  id: string;
  video_id: string;
  timestamp_seconds: number;
  question_text: string;
  status: QuestionStatus;
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string | null;
  asked_by_user: User;
  answers: Answer[];
}

export interface TimelineMarker {
  timestamp_seconds: number;
  question_id: string;
  question_preview: string;
  status: QuestionStatus;
  answer_count: number;
}

// ─── Content ──────────────────────────────────────────────────────────────────

export interface Video {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  order_index: number;
  captions_url: string | null;
  created_at: string;
  question_count: number;
}

export interface ModuleResource {
  id: string;
  title: string;
  url: string;
  type: 'link' | 'doc' | 'pdf' | 'video';
}

export interface Module {
  id: string;
  title: string;
  description: string | null;
  resources: ModuleResource[] | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  order_index: number;
  is_published: boolean;
  created_at: string;
  video_count: number;
  question_count: number;
  status?: ModuleStatus;
  progress_seconds?: number;
  last_viewed_at?: string | null;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

// ─── Meetings ─────────────────────────────────────────────────────────────────

export type MeetingStatus = 'pending' | 'confirmed' | 'declined' | 'completed';

export interface Meeting {
  id: string;
  organization_id: string;
  employee_id: string;
  module_id: string | null;
  admin_id: string | null;
  requested_at: string | null;
  confirmed_at: string | null;
  note: string | null;
  meeting_link: string | null;
  decline_reason: string | null;
  status: MeetingStatus;
  created_at: string;
  updated_at: string | null;
  employee: User;
  admin: User | null;
  module_title: string | null;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_questions: number;
  pending_questions: number;
  answered_questions: number;
  total_employees: number;
  avg_response_time_hours: number;
  modules_with_questions: number;
}

export interface ModuleAnalytics {
  module_id: string;
  module_title: string;
  total_questions: number;
  answered_questions: number;
  pending_questions: number;
  avg_response_time_hours: number;
  top_confusion_timestamps: number[];
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export type QuestionType = 'mcq' | 'short_answer' | 'true_false';

export interface QuizOption {
  id: string;
  option_text: string;
  is_correct?: boolean;
  order_index: number;
}

export interface QuizQuestion {
  id: string;
  video_id: string;
  question_text: string;
  question_type: QuestionType;
  order_index: number;
  is_required: boolean;
  explanation?: string | null;
  options: QuizOption[];
  created_at?: string;
}

export interface QuizAnswerSubmit {
  question_id: string;
  selected_option_id?: string;
  answer_text?: string;
}

export interface QuizAnswerResult {
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  selected_option_id?: string | null;
  answer_text?: string | null;
  is_correct: boolean | null;
  correct_option_id?: string | null;
  explanation?: string | null;
}

export interface QuizSubmissionResult {
  submission_id: string;
  score: number | null;
  max_score: number;
  passed: boolean;
  answers: QuizAnswerResult[];
}
