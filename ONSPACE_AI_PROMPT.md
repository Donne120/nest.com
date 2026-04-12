# Nest — Mobile App Prompt for OnSpace AI

> **Use this document as the complete specification to build the Nest mobile app.**
> Every screen, feature, user role, data model, API contract, and design rule is described here.
> Nothing should be inferred — build exactly what is written.

---

## 1. What Is Nest?

Nest is a **multi-tenant employee onboarding SaaS platform**. Companies ("organizations") sign up, invite their new hires as learners, and create onboarding content (video lessons, note-based lessons, quizzes, assignments). Learners go through the content, ask questions at specific points (timestamps on videos, block anchors on notes), book 1-on-1 meetings with their manager, and earn completion certificates.

The platform has **four user roles**:
| Role | What they do |
|---|---|
| `learner` | Takes modules, watches videos, reads lessons, asks questions, submits assignments, books meetings |
| `educator` | Creates/edits modules and content, answers questions, manages assignments and meetings |
| `owner` | Same as educator + manages billing, org settings, invitations, ATS integration |
| `super_admin` | Platform-level admin, can see all orgs (internal Nest staff only) |

**Live backend:** `https://nest-com.onrender.com/api`
**Auth:** JWT Bearer token in `Authorization: Bearer <token>` header

---

## 2. Design System

### Colors
| Token | Hex | Use |
|---|---|---|
| Background | `#0b0c0f` | All screens base |
| Surface | `#13141a` | Cards, modals, panels |
| Surface-2 | `#1c1e27` | Elevated surfaces, inputs |
| Border | `rgba(255,255,255,0.07)` | All dividers and borders |
| Border-hover | `rgba(255,255,255,0.15)` | On hover/focus |
| Gold | `#e8c97e` | Primary accent — headings, active states, CTAs |
| Gold-dim | `rgba(232,201,126,0.12)` | Gold tint backgrounds |
| Coral | `#c45c3c` | Destructive actions, errors, logout |
| Text-primary | `#e8e4dc` | Main body text |
| Text-secondary | `#9ca3af` | Labels, subtitles |
| Text-muted | `#6b6b78` | Placeholders, timestamps |
| Success | `rgba(74,222,128,0.15)` + border `rgba(74,222,128,0.25)` | Correct answers, approved states |
| Brand (per-org) | Set by org `brand_color` field | Replaces accent where org customises |

### Typography
- **Serif / Display:** Lora — used for org name, module titles, headings
- **Body:** System sans-serif (Inter preferred)
- **Mono:** Monospace for timestamps, code snippets
- Base font size: 14px, line-height 1.55

### Spacing & Radius
- Border radius: 8px (small), 12px (card), 16px (modal), 24px (pill)
- Card padding: 16–20px
- Screen horizontal padding: 16px

### Shadows
- Cards: `0 4px 24px rgba(0,0,0,0.4)`
- Modals/Panels: `0 24px 80px rgba(0,0,0,0.6)`
- Navbar: `0 1px 0 rgba(0,0,0,0.3)`

### Interactive States
- Hover: add `rgba(255,255,255,0.04)` background tint
- Active/selected: background `#1c1e27`, text `#e8e4dc`
- Disabled: 40% opacity

---

## 3. Navigation Structure

### Bottom Navigation (learner)
Tabs visible to all learners:
1. **Home** — modules list
2. **Meetings** — book and view meetings
3. **Assignments** — individual and group assignments
4. **Profile** — account, appearance, settings

### Bottom Navigation (educator/owner)
1. **Modules** — manage modules
2. **Admin** — admin dashboard (analytics, people, questions, etc.)
3. **Profile**

### Top Bar (all screens)
- Left: Org logo or org name in Lora serif gold
- Right icons (left to right): Search, Nest Assistant (sparkle ✨), Notifications bell, User avatar
- Tapping user avatar opens a slide-up sheet: full_name, email, "Profile & Appearance", "Sign out"

---

## 4. Authentication Screens

### 4.1 Login Screen
- Email input, Password input (toggle show/hide)
- "Sign in" button (gold, full width)
- "Forgot password?" link → Forgot Password screen
- "Don't have an account? Sign up" link

**API:** `POST /api/auth/login`
```json
Request: { "email": "...", "password": "..." }
Response: { "access_token": "...", "token_type": "bearer", "user": { ...UserObject } }
```

### 4.2 Signup Screen
- Full name, Email, Password, Confirm password
- "Create account" button
- "Already have an account? Sign in" link

**API:** `POST /api/auth/register`
```json
Request: { "full_name": "...", "email": "...", "password": "..." }
Response: { "access_token": "...", "user": { ...UserObject } }
```

### 4.3 Forgot Password Screen
- Email input
- "Send reset link" button
- Success: "Check your email" confirmation message

**API:** `POST /api/auth/forgot-password`
```json
Request: { "email": "..." }
```

### 4.4 Reset Password Screen
- New password + confirm (deep link with `?token=...`)
- "Reset password" button

**API:** `POST /api/auth/reset-password`
```json
Request: { "token": "...", "new_password": "..." }
```

### 4.5 Invite Accept Screen
- Shown when user opens invite link `/invite?token=...`
- Displays org name and inviter
- "Accept & Create Account" form: full_name, password

**API:** `POST /api/invitations/accept`
```json
Request: { "token": "...", "full_name": "...", "password": "..." }
```

### UserObject shape
```json
{
  "id": "uuid",
  "email": "...",
  "full_name": "...",
  "role": "learner|educator|owner|super_admin",
  "avatar_url": "url or null",
  "department": "string or null",
  "payment_verified": true,
  "organization_id": "uuid",
  "created_at": "ISO datetime"
}
```

---

## 5. Onboarding Tour (First Login)

After first login, show a 6-step walkthrough overlay:

**For learners:**
1. Welcome — "Welcome to [OrgName]! Your onboarding starts here."
2. Modules — "Browse your learning modules here."
3. Video Q&A — "Ask questions at any timestamp in a video."
4. Meetings — "Book 1-on-1 sessions with your manager."
5. Assignments — "Complete individual and group assignments."
6. Nest Assistant — "Get instant help from the AI assistant anytime."

**For managers (educator/owner):**
1. Welcome — "Welcome! You're set up as a manager."
2. Admin Panel — "Manage your team, content, and analytics here."
3. Q&A Inbox — "Answer learner questions from the Q&A inbox."
4. Meetings — "Confirm and schedule meetings with learners."
5. Assignments — "Create and review assignments."
6. Nest Assistant — "Use the AI to help answer common questions."

Persisted in `localStorage` key `nest_onboarding`. Tapping "Skip" or "Done" marks it complete.

---

## 6. Learner Screens

### 6.1 Modules List (Home)
Displays a scrollable grid (2 columns) of module cards.

**API:** `GET /api/modules`
```json
Response: [
  {
    "id": "uuid",
    "title": "...",
    "description": "...",
    "thumbnail_url": "url or null",
    "is_published": true,
    "video_count": 3,
    "lesson_count": 5,
    "total_duration_minutes": 42,
    "created_at": "..."
  }
]
```

**Module Card:**
- Thumbnail image (16:9 ratio, dark placeholder if null)
- Title (Lora, 15px, gold on dark)
- Subtitle: `{video_count} videos · {lesson_count} lessons`
- Progress ring or bar (from UserProgress data)
- If `payment_verified = false` AND module requires payment: show lock icon overlay

**Header:**
- `"{OrgName}'s Modules"` in Lora serif
- Subtitle: `"{N} modules · Your onboarding journey"`

### 6.2 Module Detail Screen
Shows module overview and its content list.

**API:** `GET /api/modules/{id}`
```json
Response: {
  "id": "uuid",
  "title": "...",
  "description": "...",
  "thumbnail_url": "...",
  "videos": [ { "id": "uuid", "title": "...", "duration_seconds": 300, "thumbnail_url": "...", "order_index": 0 } ],
  "lessons": [ { "id": "uuid", "title": "...", "description": "...", "order_index": 0 } ],
  "assignments": [ { "id": "uuid", "title": "...", "type": "individual|group", "deadline": "...", "status": "draft|active|closed" } ],
  "quizzes": [ { "id": "uuid", "title": "...", "question_count": 5 } ]
}
```

**Layout:**
- Hero: thumbnail with gradient overlay, module title in Lora, description
- "Continue Learning" CTA button (gold) → goes to next incomplete video/lesson
- Section list:
  - **Videos** — tappable rows with thumbnail, title, duration; completed ones show ✓ checkmark
  - **Lessons** — tappable rows with title; completed ones show ✓
  - **Assignments** — tappable rows with type badge and deadline
- Sticky bottom "Continue" button showing next item

**Progress API:** `GET /api/progress/module/{module_id}` → `{ "percent_complete": 60, "completed_videos": [list of video ids], "completed_lessons": [list of lesson ids] }`

### 6.3 Video Player Screen
Full-screen video playback with learning tools.

**API:** `GET /api/videos/{id}` → `{ "id", "title", "description", "video_url", "transcript": [...], "duration_seconds", "module_id", ... }`

**Layout:**
- Video player (embed or native player with `video_url`)
- Below player:
  - Title, module breadcrumb
  - Row of action buttons (horizontally scrollable on narrow screens):
    - **"Mark complete"** — `POST /api/progress/video/{video_id}/complete` — turns gold when done
    - **"Ask AI"** — opens AI Study Notebook modal (see §6.3.1)
    - **"Notes"** — opens floating notes panel (see §6.3.2)
    - **"Quiz"** — opens quiz sheet if quiz exists (see §6.3.3)
  - Tab strip: **Notes | Assignments | About**
    - Notes tab: shows saved notes for this video
    - Assignments tab: shows assignments linked to this module
    - About tab: shows video description and transcript

**Q&A (timestamp-anchored):**
- Tapping any moment in the transcript shows a "Ask a question here" button
- `POST /api/videos/{video_id}/questions` → `{ "question_text": "...", "timestamp_seconds": 42 }`
- Question appears in a side panel with timestamp chip (e.g. "2:34")
- Instructor answers are shown below each question

**Progress:** On "Mark complete", also calls `POST /api/progress/module/{module_id}/check-completion` to auto-issue certificate when all content is done.

#### 6.3.1 Ask AI Modal (Study Notebook)
A rich-text notebook panel that lets learners write notes and get AI answers.

- Text editor area (TipTap or similar rich text)
- "Ask AI about this video" button → sends note text + video transcript context
- **API:** `POST /api/ai/notebook`
  ```json
  Request: { "video_id": "...", "question": "...", "context": "..." }
  Response (streaming SSE): data: {"token": "..."}\n ... data: [DONE]
  ```
- AI response streams in below the question
- Full history of past notebook entries per video

#### 6.3.2 Notes Panel
Floating panel for timestamped personal notes.

- Input: textarea + "Pin timestamp" toggle + Save button
- List of saved notes, each showing timestamp chip (tappable to seek video) and note text
- Edit / Delete buttons per note
- Export button: downloads all notes as `.txt`

**API:**
- `GET /api/notes/video/{video_id}` → list of notes
- `POST /api/notes/video/{video_id}` → `{ "content": "...", "timestamp_seconds": 42 }` or without timestamp
- `PUT /api/notes/{id}` → `{ "content": "..." }`
- `DELETE /api/notes/{id}`

#### 6.3.3 Quiz Sheet
Modal/bottom sheet quiz flow.

- One question at a time with progress indicator (e.g. "2 / 5")
- Question types: **MCQ** (tap to select option), **True/False** (two buttons), **Short Answer** (text input)
- After each answer: show correct/incorrect feedback with explanation
- End screen: score percentage, "Retake" or "Done" button

**API:**
- `GET /api/quiz/video/{video_id}` → `{ "questions": [{ "id", "text", "type", "options": ["A","B","C","D"], "correct_answer", "explanation" }] }`
- `POST /api/quiz/submit` → `{ "video_id": "...", "answers": [{ "question_id": "...", "answer": "..." }] }`

### 6.4 Lesson (Notes-Based) Screen
For text/image/block-structured lessons (no video).

**API:** `GET /api/lessons/{id}` → `{ "id", "title", "description", "content": [blocks], "module_id", ... }`

**Block types in `content` array:**
- `{ "type": "heading", "id": "uuid", "text": "..." }`
- `{ "type": "paragraph", "id": "uuid", "text": "..." }`
- `{ "type": "image", "id": "uuid", "url": "...", "caption": "..." }`
- `{ "type": "callout", "id": "uuid", "variant": "info|warning|tip", "text": "..." }`
- `{ "type": "divider", "id": "uuid" }`

**Layout:**
- Scrollable content rendering blocks
- Each block has a subtle "Ask a question about this" button (appears on long press / tap)
- **Block Q&A:** opens a side drawer with questions anchored to that block
  - `POST /api/lessons/{lesson_id}/questions` → `{ "block_id": "...", "question_text": "..." }`
  - Questions shown with block context, answers from educators
- Bottom action: "Mark lesson complete" → `POST /api/progress/lesson/{lesson_id}/complete`

### 6.5 Assignments Screen
List of all assignments for the learner.

**API:** `GET /api/assignments/my` → list of assignments

**Assignment card shows:**
- Title, type badge (Individual / Group), deadline, status chip
- Tapping → Assignment Workspace

### 6.6 Assignment Workspace Screen
Full-screen document editor for writing and submitting an assignment.

**Layout:**
- Top bar: assignment title, deadline countdown, breadcrumb
- Collapsible left brief panel: assignment description / instructions
- Main editor: TipTap rich text editor (headings, paragraphs, bold, italic, bullet list, numbered list, image upload)
- Bottom bar: word count, "Save draft" button, "Submit" button

**For group assignments:**
- Each member is assigned a "portion" (e.g. "Week 1: Orientation", "Week 2: Deep Dive")
- Member sees only their portion in the editor
- Group members listed in sidebar with their portion label and submission status (draft / submitted)
- After all members submit: "Merge & Finalize" button generates combined document

**API:**
- `GET /api/assignments/{id}/workspace` → `{ "assignment", "submission", "group_member", "group" }`
- `POST /api/assignments/{id}/submissions` → create/update draft `{ "content": TipTapJSON, "word_count": N }`
- `PUT /api/assignments/submissions/{sub_id}/submit` → finalize submission
- `GET /api/assignments/{id}/group` → group info, members, merge status

### 6.7 Meetings Screen
**API:** `GET /api/meetings/my` → list of meeting bookings

**States visible:**
- Pending (waiting for manager to confirm)
- Confirmed (meeting link available)
- Declined (with reason)
- Completed

**"Book a Meeting" flow:**
1. Tap "+ Request Meeting" button
2. Select module (optional dropdown)
3. Pick preferred date/time (date picker)
4. Add context note (textarea, optional)
5. Submit → `POST /api/meetings/request` → `{ "module_id": "...", "requested_at": "ISO", "note": "..." }`
6. Success: confirmation card appears in list

**Confirmed meeting card shows:**
- Meeting time, module, meeting link button (opens in browser), note

### 6.8 Profile & Settings Screen
**Layout:**
- Avatar (tappable to upload new photo) — `PUT /api/auth/me/avatar`
- Full name (editable)
- Email (read-only)
- Department (editable)
- "Save changes" → `PUT /api/auth/me` → `{ "full_name": "...", "department": "..." }`
- **Appearance section:** accent color picker (updates org `brand_color` for this user's view)
- **Security section:** "Change password" → `PUT /api/auth/me/password` → `{ "current_password": "...", "new_password": "..." }`
- "Sign out" button (coral/red)

**API:** `GET /api/auth/me` → UserObject

### 6.9 Notifications
Bell icon in top bar shows unread count badge.

**API:**
- `GET /api/analytics/notifications?unread_only=false` → list
- `PUT /api/analytics/notifications/read-all` → mark all read

**Notification types:**
- `meeting_confirmed` — "Your meeting has been confirmed"
- `meeting_declined` — "Your meeting request was declined: [reason]"
- `meeting_request` (for managers) — "New meeting request from [name]"
- `question_answered` — "Your question has been answered"
- `assignment_reviewed` — "Your assignment has been reviewed"
- `payment_approved` — "Your payment was approved"
- `payment_rejected` — "Your payment was rejected: [reason]"

Tapping notification: navigate to relevant screen based on type.

### 6.10 Search Screen
**Trigger:** Search icon in top bar, or Ctrl+K shortcut

**API:** `GET /api/search?q={query}` → `{ "modules": [...], "videos": [...], "lessons": [...], "questions": [...] }`

**Layout:**
- Full-screen modal with search input (autofocused)
- Recent searches below when empty
- Results grouped by type: Modules, Videos, Lessons, Questions
- Each result tappable → navigates to that screen

### 6.11 Certificates Screen
**API:** `GET /api/certificates/my` → list

**Certificate card shows:**
- Module name, certificate number (e.g. `NEST-2026-00001`), issue date
- "View Certificate" → opens certificate page (printable, shareable)
- Certificates are auto-issued when all videos + lessons in a module are marked complete

---

## 7. Admin / Manager Screens

> Shown to users with role `educator` or `owner`. Accessible from "Admin" bottom nav tab.

### 7.1 Admin Dashboard
Overview metrics at a glance.

**API:** `GET /api/analytics/dashboard` → `{ "total_learners": N, "active_this_week": N, "completion_rate": 0.72, "pending_questions": N, "pending_meetings": N, "recent_activity": [...] }`

**Cards:**
- Total learners, Active learners (7 days), Avg completion rate, Pending Q&As, Upcoming meetings
- Recent activity feed (question asked, module started, assignment submitted)

### 7.2 Modules Manager
List of all modules with edit/create controls.

**API:** `GET /api/admin/modules` → full module list with stats

**Actions:**
- "+ New Module" → create module form
- Tap module → Module Editor screen
- Toggle publish/unpublish
- Delete module

**Create/Edit Module form fields:**
- Title, Description, Thumbnail (upload), Brand color, Is published toggle

**API:**
- `POST /api/modules` → create
- `PUT /api/modules/{id}` → update
- `DELETE /api/modules/{id}` → delete

### 7.3 Module Content Editor
Editor for a single module's videos and lessons.

**Tabs:**
1. **Videos** — ordered list of videos; reorder, add, remove
2. **Lessons** — ordered list of note lessons; reorder, add, remove
3. **Assignments** — link or create assignments for this module
4. **Quizzes** — create/edit quiz questions

**Add Video:**
- Title, Description, upload video file → uploads to Supabase Storage
- `POST /api/videos` (multipart form with file)

**Add Lesson:**
- Title, Description, then block editor:
  - Add Heading / Paragraph / Image / Callout / Divider blocks
  - Drag to reorder blocks
  - `POST /api/lessons` with `{ "module_id": "...", "title": "...", "content": [blocks] }`

**Quiz editor:**
- Add MCQ, True/False, or Short Answer questions
- MCQ: question text + 4 options + mark correct one + optional explanation
- `POST /api/quiz` → `{ "video_id": "...", "questions": [...] }`

### 7.4 People Manager
**API:** `GET /api/admin/users` → list of org users

**Table/List shows:** Name, Email, Role, Department, Payment status, Join date

**Actions:**
- "Invite" → opens invite form: email, role selector → `POST /api/invitations/send` → `{ "email": "...", "role": "learner" }`
- Tap user → User detail (edit role, verify payment, deactivate)
- Approve payment: `PUT /api/admin/users/{id}/verify-payment`
- Change role: `PUT /api/admin/users/{id}/role` → `{ "role": "..." }`

### 7.5 Q&A Inbox
All learner questions across all modules.

**API:** `GET /api/admin/questions?status=pending` → list

**Filters:** All, Pending, Answered, Archived
**Sort:** Newest, Most viewed

**Question row shows:**
- Learner name, module/video/lesson, question text (truncated), timestamp, status badge

**Question Detail Screen:**
- Full question text
- Context: which video (with timestamp link) or lesson block
- Answer thread below
- "Write answer" textarea → `POST /api/questions/{id}/answers` → `{ "answer_text": "...", "is_official": true }`
- "Ask AI for draft answer" button → calls `POST /api/ai/answer-suggestion` → `{ "question_id": "..." }` → pre-fills textarea
- Archive question button

### 7.6 Meetings Manager
**API:** `GET /api/admin/meetings` → all org meeting requests

**Filters:** Pending, Confirmed, Completed, Declined

**Meeting row shows:** Learner, requested time, module, status

**Confirm meeting flow:**
1. Tap meeting → detail sheet
2. "Confirm" button → opens form: pick confirmed datetime, paste meeting link (Zoom/Meet URL)
3. Submit → `PUT /api/meetings/{id}/confirm` → `{ "confirmed_at": "ISO", "meeting_link": "https://..." }`
4. Learner receives "meeting_confirmed" notification

**Decline:**
- `PUT /api/meetings/{id}/decline` → `{ "reason": "..." }`

### 7.7 Assignments Manager
**API:** `GET /api/admin/assignments` → list

**Create Assignment form:**
- Title, Description, Module (dropdown), Type (Individual / Group), Deadline picker
- For Group: Max group size (2–6), Portions list (comma-separated or add one by one)
- Status: Draft / Active / Closed

**Submission Review:**
- See all submissions per assignment
- Tap submission → full rich text view of learner's work
- Add grade (text field) + written feedback + annotated comments inline
- `PUT /api/admin/submissions/{id}/review` → `{ "grade": "A", "instructor_feedback": "...", "reviewed_content": TipTapJSON }`

**Group Assignment view:**
- Shows all groups, members, portions, merge status
- "Merge submissions" button → triggers AI merge of all member documents
- Review merged document, add group-level feedback and grade

### 7.8 Analytics
**API:** `GET /api/analytics/org` → detailed analytics

**Charts:**
- Learner progress distribution (% complete histogram)
- Module completion rates (bar chart per module)
- Active learners over time (7-day line chart)
- Q&A volume over time

**Export:** "Download CSV" button for any chart

### 7.9 Payments Manager (owner only)
**API:** `GET /api/payments` → list of payment submissions

**Payment row shows:** Learner name, payment type, amount, method, date submitted, status

**Status types:** Pending (review needed), Approved, Rejected

**Approve/Reject:**
- Tap → payment detail: proof image, transaction reference, phone number
- "Approve" → `PUT /api/payments/{id}/approve` → learner's `payment_verified` flips to true
- "Reject" → `PUT /api/payments/{id}/reject` → `{ "reason": "..." }` → learner notified by email

### 7.10 Org Settings (owner only)
**API:** `GET /api/organizations/me` → org object

**Editable fields:**
- Org name, Logo (upload), Brand color (hex picker)
- MoMo payment number
- Subscription plan display (read-only)

**Save:** `PUT /api/organizations/me`

**ATS Integration section:**
- Connect to Greenhouse / Lever / Workable via API key
- `POST /api/ats/connect` → `{ "provider": "greenhouse", "api_key": "..." }`
- When connected: new hires auto-invited from ATS webhooks

### 7.11 Invite Management
**API:** `GET /api/invitations` → list (for owner)

**Table shows:** Email, Role, Sent date, Status (pending/accepted/expired)

**Resend invite:** `POST /api/invitations/{id}/resend`
**Revoke invite:** `DELETE /api/invitations/{id}`

---

## 8. Payments Flow (Learner)

### 8.1 Pricing Screen
Shows available plans.

**Plans:**
- **Trial** — Free, limited access
- **Starter** — Monthly subscription
- **Professional** — Monthly subscription with more features
- **Enterprise** — Custom pricing

**Payment methods:** MTN MoMo, Orange Money, Bank Transfer, Other

**"Subscribe" button → Payment Submission form:**
- Select plan, select payment method
- If MoMo/Orange: phone number input, transaction reference input
- Upload proof of payment image (screenshot)
- Amount (pre-filled based on plan)
- "Submit" → `POST /api/payments/submit` → `{ "payment_type": "teacher_subscription", "payment_method": "mtn_momo", "amount": 5000, "currency": "XAF", "phone_number": "...", "transaction_reference": "...", "proof_image_url": "...", "plan": "starter" }`

### 8.2 Payment Status Screen
Shows status of submitted payment.

- If `pending`: "Your payment is under review. We'll notify you once approved."
- If `approved`: Green success screen, payment_verified = true
- If `rejected`: Red screen with rejection reason, "Try again" button

---

## 9. Nest Assistant (AI Chat)

Accessible via sparkle ✨ icon in top bar. Floats over any screen.

**UI:**
- Floating panel, 360px wide on desktop, near-full-width on mobile
- Minimizable (tap header to collapse/expand)
- Header: Sparkles icon, "Nest Assistant", "Ask anything about the platform" subtitle
- Close (X), minimize (chevron), clear chat (rotate-ccw) buttons in header
- When empty: shows 4 suggestion chips (quick-start questions)
- Message bubbles: user right-aligned (gold tint bg), assistant left-aligned (with sparkle avatar)
- Markdown rendered: bold, code, headings, bullet lists
- Input: textarea (auto-resizes up to 3 lines), send button (gold when active)

**API:** `POST /api/ai/platform-ask`
```json
Request: {
  "question": "How do I book a meeting?",
  "history": [{ "role": "user|assistant", "content": "..." }]
}
Response: text/event-stream SSE
  data: {"token": "..."}\n
  data: {"token": "..."}\n
  data: [DONE]
```

**Default suggestion chips:**
- "How do I ask a question during a video?"
- "Where can I find my assignments?"
- "How do I book a meeting?"
- "What does the AI Study Notebook do?"

---

## 10. API Reference Summary

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/register` | Create account |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/me` | Update profile |
| PUT | `/api/auth/me/password` | Change password |
| PUT | `/api/auth/me/avatar` | Upload avatar |
| POST | `/api/auth/forgot-password` | Send reset link |
| POST | `/api/auth/reset-password` | Apply new password |

### Modules & Content
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/modules` | List accessible modules |
| GET | `/api/modules/{id}` | Module detail with videos, lessons |
| POST | `/api/modules` | Create module (educator+) |
| PUT | `/api/modules/{id}` | Update module |
| DELETE | `/api/modules/{id}` | Delete module |
| GET | `/api/videos/{id}` | Video detail |
| POST | `/api/videos` | Upload video |
| GET | `/api/lessons/{id}` | Lesson detail |
| POST | `/api/lessons` | Create lesson |
| PUT | `/api/lessons/{id}` | Update lesson |

### Progress
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/progress/module/{id}` | Module progress for current user |
| POST | `/api/progress/video/{id}/complete` | Mark video complete |
| POST | `/api/progress/lesson/{id}/complete` | Mark lesson complete |

### Q&A (Videos)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/videos/{id}/questions` | Questions for video |
| POST | `/api/videos/{id}/questions` | Ask question (with timestamp_seconds) |
| POST | `/api/questions/{id}/answers` | Answer a question |

### Q&A (Lessons)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/lessons/{id}/questions` | Questions for lesson |
| POST | `/api/lessons/{id}/questions` | Ask question (with block_id) |
| POST | `/api/lesson-questions/{id}/answers` | Answer lesson question |

### Notes
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notes/video/{id}` | Get notes for video |
| POST | `/api/notes/video/{id}` | Create note |
| PUT | `/api/notes/{id}` | Update note |
| DELETE | `/api/notes/{id}` | Delete note |

### Meetings
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/meetings/my` | Learner's meetings |
| POST | `/api/meetings/request` | Request meeting |
| GET | `/api/admin/meetings` | All org meetings (manager) |
| PUT | `/api/meetings/{id}/confirm` | Confirm meeting |
| PUT | `/api/meetings/{id}/decline` | Decline meeting |

### Assignments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/assignments/my` | Learner's assignments |
| GET | `/api/assignments/{id}/workspace` | Assignment workspace data |
| POST | `/api/assignments/{id}/submissions` | Save draft |
| PUT | `/api/assignments/submissions/{id}/submit` | Submit assignment |
| GET | `/api/admin/assignments` | All org assignments |
| POST | `/api/admin/assignments` | Create assignment |
| PUT | `/api/admin/submissions/{id}/review` | Review submission |

### Certificates
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/certificates/my` | My certificates |
| GET | `/api/certificates/{id}` | Certificate detail |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/notifications` | Get notifications |
| PUT | `/api/analytics/notifications/read-all` | Mark all read |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payments/submit` | Submit payment proof |
| GET | `/api/payments/my` | My payment submissions |
| GET | `/api/payments` | All org payments (admin) |
| PUT | `/api/payments/{id}/approve` | Approve payment |
| PUT | `/api/payments/{id}/reject` | Reject payment |

### Search
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/search?q=query` | Global search |

### AI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/platform-ask` | Chat with Nest Assistant |
| POST | `/api/ai/notebook` | AI study notebook per video |
| POST | `/api/ai/answer-suggestion` | Draft answer for a Q&A question |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/admin/users` | All users |
| PUT | `/api/admin/users/{id}/verify-payment` | Approve user access |
| PUT | `/api/admin/users/{id}/role` | Change user role |
| POST | `/api/invitations/send` | Send invite email |
| GET | `/api/invitations` | List invitations |
| GET | `/api/organizations/me` | Org settings |
| PUT | `/api/organizations/me` | Update org settings |
| POST | `/api/ats/connect` | Connect ATS |

---

## 11. Data Models (Key Shapes)

### Module
```json
{
  "id": "uuid",
  "organization_id": "uuid",
  "title": "string",
  "description": "string",
  "thumbnail_url": "url|null",
  "brand_color": "#6366f1",
  "is_published": true,
  "created_at": "ISO"
}
```

### Video
```json
{
  "id": "uuid",
  "module_id": "uuid",
  "title": "string",
  "description": "string",
  "video_url": "url",
  "thumbnail_url": "url|null",
  "duration_seconds": 300,
  "order_index": 0,
  "transcript": [{ "start": 0.0, "end": 5.2, "text": "Welcome to..." }]
}
```

### Lesson
```json
{
  "id": "uuid",
  "module_id": "uuid",
  "title": "string",
  "description": "string",
  "order_index": 0,
  "is_published": true,
  "content": [
    { "type": "heading", "id": "uuid", "text": "Introduction" },
    { "type": "paragraph", "id": "uuid", "text": "..." },
    { "type": "image", "id": "uuid", "url": "...", "caption": "..." },
    { "type": "callout", "id": "uuid", "variant": "info", "text": "..." }
  ]
}
```

### Assignment
```json
{
  "id": "uuid",
  "module_id": "uuid",
  "title": "string",
  "description": "string",
  "type": "individual|group",
  "max_group_size": 4,
  "portions": ["Week 1: Orientation", "Week 2: Deep Dive", "Week 3: Application", "Week 4: Review"],
  "deadline": "ISO|null",
  "status": "draft|active|closed"
}
```

### MeetingBooking
```json
{
  "id": "uuid",
  "learner_id": "uuid",
  "module_id": "uuid|null",
  "requested_at": "ISO",
  "confirmed_at": "ISO|null",
  "note": "string|null",
  "meeting_link": "url|null",
  "decline_reason": "string|null",
  "status": "pending|confirmed|declined|completed"
}
```

### Notification
```json
{
  "id": "uuid",
  "type": "meeting_confirmed|meeting_declined|meeting_request|question_answered|assignment_reviewed|payment_approved|payment_rejected",
  "title": "string",
  "message": "string",
  "reference_id": "uuid|null",
  "is_read": false,
  "created_at": "ISO"
}
```

### Certificate
```json
{
  "id": "uuid",
  "cert_number": "NEST-2026-00001",
  "user_id": "uuid",
  "module_id": "uuid",
  "module_title": "string",
  "org_name": "string",
  "issued_at": "ISO"
}
```

---

## 12. Key UX Rules

1. **Dark theme everywhere.** Background `#0b0c0f`, no white screens anywhere.
2. **Gold = primary action.** All main CTAs, active nav items, and progress indicators use `#e8c97e`.
3. **Coral = danger.** Delete, reject, sign out actions use `#c45c3c`.
4. **44px minimum tap target.** All buttons and interactive elements must be at least 44px tall.
5. **Loading states.** Every data fetch must show a skeleton loader, not a blank screen.
6. **Empty states.** Every list screen must have a friendly empty state with an icon and message.
7. **Error states.** Network errors must show a toast notification and a retry button.
8. **Scroll-aware header.** Top bar hides on scroll down, reappears on scroll up.
9. **Pull to refresh.** All list screens support pull-to-refresh.
10. **Offline notice.** Show a banner if the device is offline.
11. **Modals.** Appear from bottom (bottom sheet style), dismiss on backdrop tap, have a drag handle.
12. **Forms.** Inline validation on blur. Disabled submit until all required fields filled.
13. **Progress persistence.** Video playback position is saved locally and resumed on reopen.
14. **Role-gated UI.** Admin/manager-only screens and buttons must be hidden from learners — never just disabled.
15. **Notifications badge.** Bell icon shows red dot badge when `unread > 0`. Badge disappears after viewing.
16. **Lora font.** Used for org name in top bar, module titles, and certificate headings. All other text uses system sans-serif.
17. **Org branding.** The `brand_color` from the org's settings replaces the default `#6366f1` accent in progress bars and active states (gold remains gold — it is a fixed design token, not overridden by brand color).

---

## 13. Mobile-Specific Considerations

- Bottom navigation always visible (not inside a hamburger menu)
- No horizontal scroll on main content (all lists/grids adapt vertically)
- Video player: full-width, 16:9 aspect ratio, native controls
- Notes panel: slides up from bottom, max-height 60% of screen
- Nest Assistant panel: bottom-anchored, height 420px max, minimizable
- Notification dropdown: full-width at top of screen (not anchored to bell icon)
- Assignment workspace editor: full-screen with floating toolbar
- Search: full-screen modal
- Admin tables: card layout (not tables) on mobile
- Meetings time picker: native date/time picker
- All modals/sheets: safe-area-inset-bottom padding for iPhone notch

---

## 14. Multi-Tenancy Rules

- Every API call is scoped to the logged-in user's `organization_id` automatically on the backend
- Users can only see content that belongs to their organization
- Org logo and name appear in the top bar — fetched from `GET /api/auth/me` which returns `organization` object
- A user with no `organization_id` is a super_admin with access to all orgs
- Learners without `payment_verified = true` see modules but are blocked from accessing content (show upgrade/payment prompt)

---

## 15. File Storage

- All file uploads (video, thumbnail, lesson images, payment proof, avatars) go to **Supabase Storage**
- The app should allow the backend to handle upload (send file to backend, backend returns URL)
- Upload endpoint: `POST /api/upload` (multipart form, field `file`, optional `bucket` param)
- Returns: `{ "url": "https://supabase-url/storage/..." }`

---

## 16. Notifications Polling

- Poll `GET /api/analytics/notifications?unread_only=false` every 30 seconds
- Cache last known unread count to show badge even between poll cycles
- `PUT /api/analytics/notifications/read-all` called when notification drawer is opened with unread items

---

*End of specification. Build the complete Nest mobile app exactly as described above. When in doubt, refer to the design system in Section 2 and the UX rules in Section 12.*
