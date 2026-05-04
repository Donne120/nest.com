export type UserRole = 'learner' | 'educator' | 'owner' | 'super_admin';
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
  momo_number: string | null;
  momo_name: string | null;
  payment_orange_number: string | null;
  payment_orange_name: string | null;
  payment_bank_name: string | null;
  payment_bank_account: string | null;
  payment_bank_holder: string | null;
  payment_instructions: string | null;
}

// ─── Per-country payment config ───────────────────────────────────────────────

export interface PaymentCountryConfig {
  id: string;
  country_code: string;
  country_name: string;
  currency_code: string;
  currency_symbol: string;
  provider: string | null;
  number: string | null;
  account_name: string | null;
  provider2: string | null;
  number2: string | null;
  account_name2: string | null;
  price: number | null;
  instructions: string | null;
  is_active: boolean;
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
  payment_verified: boolean;
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
  has_transcript: boolean;
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
  price: number | null;
  is_for_sale: boolean;
  currency: string | null;
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
  learner_id: string;
  module_id: string | null;
  owner_id: string | null;
  requested_at: string | null;
  confirmed_at: string | null;
  note: string | null;
  meeting_link: string | null;
  decline_reason: string | null;
  status: MeetingStatus;
  created_at: string;
  updated_at: string | null;
  learner: User;
  owner: User | null;
  module_title: string | null;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_questions: number;
  pending_questions: number;
  answered_questions: number;
  total_learners: number;
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

// ─── Certificates ─────────────────────────────────────────────────────────────

export interface Certificate {
  id: string;
  cert_number: string;
  module_id: string;
  org_id: string;
  issued_at: string;
  user: User;
  module: Module;
  organization: Organization;
}

// ─── People Analytics ─────────────────────────────────────────────────────────

export interface LearnerPeopleStats {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  joined: string;
  days_since_joined: number;
  last_active_at: string | null;
  days_since_active: number | null;
  completion_pct: number;
  completed_modules: number;
  total_modules: number;
  time_to_complete_days: number | null;
  is_at_risk: boolean;
  is_star: boolean;
}

export interface PeopleReport {
  learners: LearnerPeopleStats[];
  summary: { total: number; stars: number; at_risk: number; avg_completion: number };
}

// ─── Benchmarks ───────────────────────────────────────────────────────────────

export interface BenchmarkData {
  org_completion_rate: number;
  platform_avg_completion_rate: number;
  org_avg_days_to_complete: number | null;
  platform_avg_days_to_complete: number | null;
  org_rank_percentile: number;
  total_orgs_compared: number;
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export type AssignmentType = 'individual' | 'group';
export type AssignmentStatus = 'draft' | 'active' | 'closed';
export type MergeStatus = 'pending' | 'partial' | 'complete';
export type SubmissionStatus = 'draft' | 'submitted';

export interface Assignment {
  id: string;
  organization_id: string;
  module_id: string | null;
  created_by: string;
  title: string;
  description: string | null;
  type: AssignmentType;
  max_group_size: number | null;
  portions: string[] | null;
  deadline: string | null;
  meeting_1_locked: boolean;
  meeting_2_locked: boolean;
  status: AssignmentStatus;
  created_at: string;
  updated_at: string | null;
  creator: User;
  group_count: number;
  submission_count: number;
  // Populated only from /my endpoint
  my_submission_status?: 'not_started' | 'draft' | 'submitted';
  my_group_merge_status?: 'pending' | 'partial' | 'complete' | 'final_submitted';
  my_portion_label?: string | null;
}

export interface GroupMember {
  id: string;
  group_id: string;
  learner_id: string;
  portion_label: string | null;
  portion_index: number;
  submitted_at: string | null;
  learner: User;
}

export interface AssignmentGroup {
  id: string;
  assignment_id: string;
  kickoff_meeting_id: string | null;
  review_meeting_id: string | null;
  merge_status: MergeStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  merged_document: any | null;
  final_submitted_at: string | null;
  instructor_feedback: string | null;
  grade?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reviewed_merged_content?: any | null;
  reviewed_merged_at?: string | null;
  members: GroupMember[];
}

export interface AssignmentSubmission {
  id: string;
  group_member_id: string | null;
  assignment_id: string;
  learner_id: string;
  learner?: User;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any | null;
  word_count: number;
  status: SubmissionStatus;
  submitted_at: string | null;
  updated_at: string | null;
  grade?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reviewed_content?: any | null;
  instructor_feedback?: string | null;
  reviewed_at?: string | null;
}

// ─── ATS ──────────────────────────────────────────────────────────────────────

export type ATSProvider = 'greenhouse' | 'lever' | 'workable';

export interface ATSConnection {
  id: string;
  provider: ATSProvider;
  default_role: UserRole;
  is_active: boolean;
  webhook_secret: string | null;
  created_at: string;
}

// ─── Lessons ──────────────────────────────────────────────────────────────────

export type LessonBlockType = 'text' | 'image';

export interface LessonBlock {
  id: string;
  type: LessonBlockType;
  content?: string;   // text blocks
  url?: string;       // image blocks
  caption?: string;   // image blocks
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  content: LessonBlock[] | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  question_count: number;
}

// ─── Lesson Q&A ───────────────────────────────────────────────────────────────

export interface LessonAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  is_official: boolean;
  is_ai_generated: boolean;
  created_at: string;
  answered_by_user: User;
}

export interface LessonQuestion {
  id: string;
  lesson_id: string;
  block_id: string;
  question_text: string;
  status: QuestionStatus;
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string | null;
  asked_by_user: User;
  answers: LessonAnswer[];
}
