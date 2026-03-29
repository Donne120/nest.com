# Collaborative Assignment Engine
## Feature Plan for Nest EdTech Platform

---

## Overview

Instructors create assignments inside course modules. Learners complete them directly on the platform using a rich workspace that supports text, math, tables, code, and formatting. Group assignments are auto-distributed, auto-merged, and auto-scheduled for two team meetings before final submission.

---

## 1. What We Are Adding

### 1.1 Assignment Types
- **Individual Assignment** — one learner, one submission
- **Group Assignment** — system forms groups, distributes portions, merges work

### 1.2 In-Platform Workspace
A rich editor built into the platform where all work is done. No external tools.

Supports:
- Text formatting (bold, italic, headings, bullet lists, numbered lists)
- Math equations (inline and block) via KaTeX
- Tables (add/remove rows and columns)
- Code blocks with syntax highlighting
- Links and images
- File attachments

Works for every level — primary school to PhD.

### 1.3 Two-Meeting Workflow (Group Only)
- **Meeting 1 (Kickoff)** — auto-scheduled after groups are formed. Team sees what the system assigned each member and aligns before starting.
- **Meeting 2 (Review)** — auto-scheduled after all portions are submitted. Team reviews the merged work before final submission.
- Instructor can **lock** either meeting to prevent time changes.
- Attendance is tracked automatically per meeting.

### 1.4 Auto-Merge
When all group members submit their portions, the system compiles them into one structured document — labeled by section and contributor — ready for the review meeting.

### 1.5 Final Submission
After Meeting 2, the merged document is submitted to the instructor as the group's final work.

---

## 2. Database — New Models

### `Assignment`
Lives inside a Module. Created by an Educator.

| Field | Type | Description |
|---|---|---|
| id | String (UUID) | Primary key |
| module_id | String (FK) | Which module it belongs to |
| created_by | String (FK) | Educator who created it |
| title | String | Assignment title |
| description | Text | Full instructions (rich text) |
| type | Enum | `individual` or `group` |
| max_group_size | Integer | Max learners per group (group only) |
| portions | JSON | List of task portions for distribution e.g. ["Introduction", "Analysis", "Conclusion"] |
| deadline | DateTime | When all work must be submitted |
| meeting_1_locked | Boolean | Kickoff meeting locked by instructor |
| meeting_2_locked | Boolean | Review meeting locked by instructor |
| status | Enum | `draft`, `active`, `closed` |
| created_at | DateTime | — |

---

### `AssignmentGroup`
One group of learners assigned to a group assignment.

| Field | Type | Description |
|---|---|---|
| id | String (UUID) | Primary key |
| assignment_id | String (FK) | Which assignment |
| kickoff_meeting_id | String (FK, nullable) | Auto-scheduled Meeting 1 |
| review_meeting_id | String (FK, nullable) | Auto-scheduled Meeting 2 |
| merged_document | Text (JSON) | Compiled work after all portions submitted |
| merge_status | Enum | `pending`, `partial`, `complete` |
| final_submitted_at | DateTime (nullable) | When group submitted to instructor |

---

### `GroupMember`
One learner inside a group, with their specific assigned portion.

| Field | Type | Description |
|---|---|---|
| id | String (UUID) | Primary key |
| group_id | String (FK) | Which group |
| learner_id | String (FK) | Which learner |
| portion_label | String | The task portion assigned e.g. "Introduction" |
| portion_index | Integer | Order in the final merged document |
| submitted_at | DateTime (nullable) | When this learner submitted their work |

---

### `AssignmentSubmission`
The actual work a learner writes for their portion.

| Field | Type | Description |
|---|---|---|
| id | String (UUID) | Primary key |
| group_member_id | String (FK) | Whose submission |
| assignment_id | String (FK) | Which assignment |
| learner_id | String (FK) | Redundant FK for quick queries |
| content | Text (JSON) | TipTap document content |
| word_count | Integer | Auto-calculated on save |
| status | Enum | `draft`, `submitted` |
| submitted_at | DateTime (nullable) | — |
| updated_at | DateTime | Last saved (auto-save every 30s) |

---

### Changes to Existing Models

**`Meeting` model — add 2 fields:**
- `assignment_id` (String FK, nullable) — links a meeting to an assignment
- `locked` (Boolean, default False) — instructor lock, prevents time edits

---

## 3. Backend — New API Routes

All routes live under `/api/assignments`

### Instructor Routes (require `educator` role)

| Method | Endpoint | What it does |
|---|---|---|
| POST | `/api/assignments` | Create a new assignment |
| GET | `/api/assignments` | List all assignments in org |
| GET | `/api/assignments/{id}` | Get assignment details |
| PUT | `/api/assignments/{id}` | Edit assignment |
| DELETE | `/api/assignments/{id}` | Delete assignment |
| POST | `/api/assignments/{id}/activate` | Publish assignment → triggers group formation |
| GET | `/api/assignments/{id}/groups` | View all groups and their progress |
| GET | `/api/assignments/{id}/submissions` | View all submissions |
| PUT | `/api/assignments/{id}/lock-meeting/{1 or 2}` | Lock/unlock a meeting |

### Learner Routes (require `learner` role)

| Method | Endpoint | What it does |
|---|---|---|
| GET | `/api/assignments/my` | Get all assignments for current learner |
| GET | `/api/assignments/{id}/my-submission` | Get current learner's submission |
| PUT | `/api/assignments/{id}/my-submission` | Save (draft) or submit work |
| GET | `/api/assignments/{id}/my-group` | Get group info, members, portions |
| GET | `/api/assignments/{id}/merged` | View merged document (after all submitted) |

### System (internal logic)

| Function | Trigger | What it does |
|---|---|---|
| `form_groups()` | On assignment activate | Randomly assigns learners to groups, distributes portions |
| `schedule_kickoff_meeting()` | After groups formed | Creates Meeting 1 for each group (24hrs from now) |
| `check_and_merge()` | On every submission | If all members submitted → merge → schedule Meeting 2 |
| `schedule_review_meeting()` | After merge | Creates Meeting 2 for each group (48hrs before deadline) |
| `submit_to_instructor()` | After Meeting 2 attendance confirmed | Marks group work as final, notifies instructor |

---

## 4. Frontend — New Pages and Components

### Educator Side

#### New Page: `AssignmentsPage` (`/admin/assignments`)
- List of all assignments with status, type, deadline
- Button to create new assignment

#### New Page: `AssignmentEditor` (`/admin/assignments/new` and `/admin/assignments/{id}/edit`)
- Title, instructions (rich editor — instructor writes the brief here too)
- Type toggle: Individual / Group
- If group: set max group size, add portion labels
- Set deadline
- Save as draft or Publish

#### New Page: `AssignmentDetail` (`/admin/assignments/{id}`)
- Overview: how many groups, how many submitted, deadline countdown
- Table of all groups showing each member's submission status
- Lock/unlock Meeting 1 and Meeting 2 per group
- View merged documents per group
- View final submissions

---

### Learner Side

#### New Page: `MyAssignmentsPage` (`/assignments`)
- List of active assignments with deadlines and status
- Individual vs Group badge
- Progress indicator

#### New Page: `AssignmentWorkspace` (`/assignments/{id}/work`)
This is the main workspace. Split-screen layout:

**Left panel:**
- Assignment title and instructions
- For group: shows their portion label and what teammates are doing

**Right panel (the editor):**
- Full TipTap rich editor
- Toolbar: Bold, Italic, Headings, Lists, Table, Math (KaTeX), Code block, Link
- Auto-saves every 30 seconds
- Word count
- Submit button (disabled until minimum content)

**Bottom bar:**
- Deadline countdown
- Group member status (who has submitted, who is in progress)
- Meeting 1 and Meeting 2 dates

#### New Page: `GroupMergedView` (`/assignments/{id}/merged`)
- Read-only view of the compiled document
- Each section labeled with the contributor's name
- Available after all members submit
- Used during Meeting 2 for review

---

## 5. The Rich Editor (TipTap)

### Library
**TipTap** — used in frontend only, React component.

### Extensions to install
```
@tiptap/starter-kit          — base formatting
@tiptap/extension-table      — tables
@tiptap/extension-link       — links
@tiptap/extension-image      — images
@tiptap/extension-code-block-lowlight — code with syntax highlighting
tiptap-extension-mathematics — KaTeX math equations
katex                        — math rendering
```

### What the toolbar includes
| Button | What it does |
|---|---|
| B / I / U | Bold, italic, underline |
| H1 H2 H3 | Headings |
| • 1. | Bullet and numbered lists |
| ⊞ | Insert table |
| ∑ | Insert math equation (KaTeX) |
| `< >` | Code block |
| 🔗 | Insert link |
| 📷 | Insert image (uploads to Supabase) |

### Auto-save
Every 30 seconds the editor sends a silent PUT to save draft. A small "Saved" indicator shows in the corner. No data loss.

---

## 6. Group Formation Logic

When instructor activates an assignment:

1. Fetch all active learners in the organization
2. Shuffle the list randomly
3. Split into groups of `max_group_size`
4. For each group, assign one portion label per member (from the instructor's portions list)
5. If portions > members in a group → combine portions for one member
6. If members > portions → assign extra members as "support" role on an existing portion
7. Create `AssignmentGroup` and `GroupMember` records
8. Auto-schedule Meeting 1 for each group

---

## 7. Meeting Auto-Schedule Logic

### Meeting 1 (Kickoff)
- Scheduled **24 hours after assignment is activated**
- Default duration: 30 minutes
- Title: `"[Assignment Title] — Team Kickoff"`
- Learners can reschedule unless instructor locks it
- Purpose: team sees portions, asks questions, aligns

### Meeting 2 (Review)
- Scheduled **48 hours before the assignment deadline**
- Triggered only after all group members have submitted their portions
- Default duration: 45 minutes
- Title: `"[Assignment Title] — Review Before Submission"`
- Learners can reschedule unless instructor locks it
- Purpose: team reviews merged document, decides if any edits needed

### Attendance Tracking
- Uses existing meeting attendance model
- If a member misses Meeting 2, their submission is still included in the merge
- Instructor can see attendance per meeting in assignment detail view

---

## 8. Merge Logic

When the last group member submits:

1. Fetch all `AssignmentSubmission` records for the group ordered by `portion_index`
2. Build a merged TipTap JSON document:
   - Section header: `"[Portion Label] — [Learner Name]"`
   - Followed by that learner's content
   - Divider between sections
3. Save to `AssignmentGroup.merged_document`
4. Set `merge_status` to `complete`
5. Trigger `schedule_review_meeting()`
6. Notify all group members: "All portions submitted — your review meeting is scheduled"

---

## 9. Final Submission Flow

After Meeting 2:
1. Any group member can click **Submit to Instructor**
2. System marks `AssignmentGroup.final_submitted_at`
3. Instructor gets a notification in their dashboard
4. Instructor sees the merged document in `AssignmentDetail` page
5. Instructor can leave feedback (simple text comment for now)

---

## 10. Build Order

### Phase 1 — Foundation
- [ ] Add `Assignment`, `AssignmentGroup`, `GroupMember`, `AssignmentSubmission` models
- [ ] Alembic migration
- [ ] Add `assignment_id` and `locked` to `Meeting` model

### Phase 2 — Backend Routes
- [ ] Instructor CRUD routes for assignments
- [ ] Group formation logic
- [ ] Learner submission routes (save draft + submit)
- [ ] Merge logic
- [ ] Meeting auto-schedule integration

### Phase 3 — Editor
- [ ] Install and configure TipTap with all extensions
- [ ] Build `AssignmentWorkspace` page with split layout
- [ ] Auto-save logic
- [ ] Math equation toolbar button

### Phase 4 — Instructor UI
- [ ] `AssignmentsPage` list view
- [ ] `AssignmentEditor` create/edit form
- [ ] `AssignmentDetail` progress + group view
- [ ] Meeting lock controls

### Phase 5 — Learner UI
- [ ] `MyAssignmentsPage`
- [ ] `GroupMergedView`
- [ ] Deadline countdowns and group status indicators

### Phase 6 — Polish
- [ ] Notifications (assignment activated, portion submitted, merge complete, meeting scheduled)
- [ ] Attendance surfaced in assignment detail
- [ ] Instructor feedback on final submission

---

## 11. What This Does Not Include (Yet)

- AI feedback on submissions (future: AI reads submission against transcript context)
- Peer grading
- Plagiarism detection
- File upload submissions (Phase 1 is text/rich-content only)
- Rubric/grading system (instructor gives qualitative feedback only for now)

---

*Last updated: 2026-03-28*
