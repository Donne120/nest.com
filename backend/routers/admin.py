"""
Admin seed endpoint — one-time setup for production.

POST /api/admin/seed
Headers: X-Seed-Secret: <your SEED_SECRET env var>

Creates:
  - Nest Cameroon organisation
  - super_admin account (ngumdieudonne4@gmail.com)
  - 13 educational modules with thumbnails

Safe to call multiple times — skips anything that already exists.
Also callable with admin JWT to patch thumbnails on existing modules.
"""

import hmac
import logging
from fastapi import APIRouter, Header, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel

from database import get_db
from config import settings
from auth import hash_password
import models

limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])

# ── Constants ──────────────────────────────────────────────────────────────────

ORG_NAME = "Nest Cameroon"
ORG_SLUG = "nest-cameroon"
ADMIN_EMAIL = "ngumdieudonne4@gmail.com"
ADMIN_NAME = "Nest Cameroon Admin"


def _img(photo_id: str) -> str:
    return (
        f"https://images.unsplash.com/photo-{photo_id}"
        "?w=800&h=450&fit=crop&auto=format&q=80"
    )


MODULES = [
    {
        "order_index": 1,
        "title": "Welcome to Nest",
        "description": (
            "A complete overview of the Nest onboarding platform. "
            "Learn what Nest is, who it's for, and how every feature "
            "fits together before you dive deeper into the other modules."
        ),
        "thumbnail_url": _img("1497366216548-37526070297c"),
    },
    {
        "order_index": 2,
        "title": "Setting Up Your Organisation",
        "description": (
            "Step-by-step guide to creating and configuring your Nest "
            "workspace. Covers organisation name, slug, branding, plan "
            "selection, and subscription management."
        ),
        "thumbnail_url": _img("1542744173-8e7e53415bb0"),
    },
    {
        "order_index": 3,
        "title": "Managing Your Team",
        "description": (
            "Everything about users inside Nest. How to invite team members "
            "via email, assign roles (Owner, Educator, Learner), manage "
            "departments, deactivate accounts, and control access."
        ),
        "thumbnail_url": _img("1522071820081-009f0129c71c"),
    },
    {
        "order_index": 4,
        "title": "Creating Courses & Videos",
        "description": (
            "How to build your onboarding content library. Creating modules, "
            "uploading videos to Supabase, setting thumbnails, writing "
            "descriptions, reordering content, and publishing."
        ),
        "thumbnail_url": _img("1611532736597-de2d4265fba3"),
    },
    {
        "order_index": 5,
        "title": "Transcription & AI Q&A",
        "description": (
            "Using Nest's AI features. Automatic video transcription with "
            "Groq, asking questions at specific timestamps, how the AI "
            "answers using transcript context, and building a reusable "
            "knowledge base for future hires."
        ),
        "thumbnail_url": _img("1677442135703-1787eea5ce01"),
    },
    {
        "order_index": 6,
        "title": "Quizzes & Assessments",
        "description": (
            "Creating quizzes to test learner understanding. Covers multiple "
            "choice, true/false, and short-answer question types, setting "
            "pass thresholds, and reviewing results."
        ),
        "thumbnail_url": _img("1434030216411-0b793f4b4173"),
    },
    {
        "order_index": 7,
        "title": "Assignments & Tasks",
        "description": (
            "How to create assignments for learners, set due dates, review "
            "submissions, and give feedback. Ideal for practical onboarding "
            "tasks beyond video watching."
        ),
        "thumbnail_url": _img("1484480974693-6ca0a78fb36b"),
    },
    {
        "order_index": 8,
        "title": "Progress Tracking",
        "description": (
            "How learners track their own progress through modules and videos. "
            "Covers completion states, progress percentages, and how admins "
            "can monitor their whole team's advancement."
        ),
        "thumbnail_url": _img("1551288049-bebda4e38f71"),
    },
    {
        "order_index": 9,
        "title": "1-on-1 Meetings",
        "description": (
            "The meeting feature in Nest. How learners request 1-on-1 sessions "
            "with managers, how managers confirm or decline with a reason, "
            "adding meeting links, and the email notification flow."
        ),
        "thumbnail_url": _img("1573496359142-b8d87734a5a2"),
    },
    {
        "order_index": 10,
        "title": "Analytics & Reporting",
        "description": (
            "Reading your organisation's data. Module completion rates, "
            "per-learner progress, quiz score summaries, and using analytics "
            "to improve your onboarding program over time."
        ),
        "thumbnail_url": _img("1460925895917-afdab827c52f"),
    },
    {
        "order_index": 11,
        "title": "Certificates",
        "description": (
            "How Nest issues completion certificates. Triggering certificates "
            "after module completion, customising certificate content, and "
            "where learners can view and download them."
        ),
        "thumbnail_url": _img("1523050854058-8df90110c9f1"),
    },
    {
        "order_index": 12,
        "title": "Payments & Billing",
        "description": (
            "How the Nest manual payment system works. Submitting MoMo or "
            "bank transfer proofs, the admin approval flow, how access is "
            "granted automatically after approval, and handling rejections."
        ),
        "thumbnail_url": _img("1556742049-0cfed4f6a45d"),
    },
    {
        "order_index": 13,
        "title": "ATS — Hiring Pipeline",
        "description": (
            "Using Nest's Applicant Tracking System. Managing candidates, "
            "moving them through hiring stages, connecting with external ATS "
            "providers (Greenhouse, Lever, Workable), and turning new hires "
            "into onboarded employees."
        ),
        "thumbnail_url": _img("1586281380349-632531db7ed4"),
    },
]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _seed(db: Session, admin_password: str) -> dict:
    results = {
        "organisation": None,
        "admin_user": None,
        "modules_created": 0,
        "modules_updated": 0,
    }

    # Organisation
    org = (
        db.query(models.Organization)
        .filter(models.Organization.slug == ORG_SLUG)
        .first()
    )
    if not org:
        org = models.Organization(
            name=ORG_NAME,
            slug=ORG_SLUG,
            plan=models.Plan.enterprise,
            subscription_status=models.SubscriptionStatus.active,
            is_active=True,
        )
        db.add(org)
        db.flush()
        results["organisation"] = "created"
        logger.info(f"[seed] Created org: {ORG_NAME}")
    else:
        results["organisation"] = "already exists"

    # Admin user — search by correct email OR the old typo email so we can fix it
    OLD_ADMIN_EMAIL = "ngummdieudonne4@gmail.com"
    admin = (
        db.query(models.User)
        .filter(models.User.email.in_([ADMIN_EMAIL, OLD_ADMIN_EMAIL]))
        .first()
    )
    if not admin:
        if not admin_password:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Admin user does not exist yet. "
                    "Pass admin_password in the request body."
                ),
            )
        admin = models.User(
            organization_id=org.id,
            email=ADMIN_EMAIL,
            full_name=ADMIN_NAME,
            hashed_password=hash_password(admin_password),
            role=models.UserRole.super_admin,
            is_active=True,
        )
        db.add(admin)
        db.flush()
        results["admin_user"] = "created"
        logger.info(f"[seed] Created super_admin: {ADMIN_EMAIL}")
    else:
        # Patch email and/or password if they need correcting
        patched = []
        if admin.email != ADMIN_EMAIL:
            admin.email = ADMIN_EMAIL
            patched.append("email")
        if admin_password:
            admin.hashed_password = hash_password(admin_password)
            patched.append("password")
        if patched:
            results["admin_user"] = f"updated ({', '.join(patched)})"
            logger.info(f"[seed] Patched super_admin: {', '.join(patched)}")
        else:
            results["admin_user"] = "already exists (no changes)"

    # Modules — create or patch thumbnail
    for data in MODULES:
        existing = (
            db.query(models.Module)
            .filter(
                models.Module.organization_id == org.id,
                models.Module.title == data["title"],
            )
            .first()
        )
        if existing:
            if existing.thumbnail_url != data["thumbnail_url"]:
                existing.thumbnail_url = data["thumbnail_url"]
                results["modules_updated"] += 1
        else:
            module = models.Module(
                organization_id=org.id,
                created_by=admin.id,
                title=data["title"],
                description=data["description"],
                thumbnail_url=data["thumbnail_url"],
                order_index=data["order_index"],
                is_published=True,
                is_for_sale=False,
                price=None,
                currency="RWF",
                duration_seconds=0,
            )
            db.add(module)
            results["modules_created"] += 1

    db.commit()
    return results


# ── Endpoint ───────────────────────────────────────────────────────────────────


class SeedRequest(BaseModel):
    admin_password: str = ""


@router.post("/seed")
@limiter.limit("3/hour")
def seed(
    request: Request,
    body: SeedRequest,
    x_seed_secret: str = Header(..., alias="X-Seed-Secret"),
    db: Session = Depends(get_db),
):
    """
    One-time production setup. Requires the X-Seed-Secret header to match
    the SEED_SECRET environment variable set on Render.

    IMPORTANT: Remove or disable this endpoint once your production database
    is seeded. It is rate-limited to 3 calls/hour as an extra safeguard.
    """
    # Require a strong secret (minimum 20 chars) to be explicitly set
    if not settings.SEED_SECRET or len(settings.SEED_SECRET) < 20:
        raise HTTPException(
            status_code=503,
            detail=(
                "SEED_SECRET env var is not set or is too short. "
                "Set it to at least 20 random characters in your Render env vars."
            ),
        )
    # Constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(x_seed_secret, settings.SEED_SECRET):
        raise HTTPException(status_code=403, detail="Invalid seed secret.")

    results = _seed(db, body.admin_password)
    return {"status": "ok", "results": results}


# ── Lesson content seed ────────────────────────────────────────────────────────

def _uid() -> str:
    import uuid
    return str(uuid.uuid4())


def _block(btype: str, content: str = "", url: str = "", caption: str = "") -> dict:
    return {"id": _uid(), "type": btype, "content": content, "url": url, "caption": caption}


_UNSPLASH = "https://images.unsplash.com/photo-{id}?w=1200&h=675&fit=crop&auto=format&q=80"


def _img_block(photo_id: str, caption: str) -> dict:
    return _block("image", url=_UNSPLASH.format(id=photo_id), caption=caption)


# ── Module A: How to Use & Navigate Nest (notes-only) ─────────────────────────

LESSON_MODULE_A = {
    "title": "How to Use & Navigate Nest",
    "description": (
        "A complete walkthrough of the Nest platform. Learn every screen, "
        "every feature, and every shortcut — from logging in for the first time "
        "to tracking your team's progress as a manager."
    ),
    "thumbnail_url": _img("1497366216548-37526070297c"),
    "order_index": 14,
}

LESSON_MODULE_A_LESSONS = [
    {
        "title": "Welcome to Your Dashboard",
        "description": "Your first stop after logging in — what everything means and how to navigate.",
        "order_index": 1,
        "content": [
            _block("text", content=(
                "# Welcome to Nest!\n\n"
                "Nest is your organisation's home for onboarding, learning, and knowledge sharing. "
                "Everything lives in one place: video courses, written note lessons, quizzes, "
                "assignments, 1-on-1 meetings, and an AI assistant that knows your content.\n\n"
                "This guide will walk you through every part of the platform so you feel confident "
                "from day one."
            )),
            _img_block("1551288049-bebda4e38f71",
                       "The Nest dashboard — your central hub for learning and progress"),
            _block("text", content=(
                "## What's on the Dashboard\n\n"
                "**Module Progress Cards** — each module you're enrolled in shows a circular "
                "progress ring. Click any card to jump straight back to where you left off.\n\n"
                "**Recent Activity Feed** — see new questions from colleagues, educator answers, "
                "and freshly published content.\n\n"
                "**Quick Stats** — total modules, completion percentage, and any pending "
                "assignments or unanswered questions."
            )),
            _block("text", content=(
                "## The Navigation Bar\n\n"
                "The top navbar is always visible across every page:\n\n"
                "- **Home** — returns to the dashboard\n"
                "- **Modules** — browse the full course library\n"
                "- **Progress** — your personal learning history\n"
                "- **✨ Nest Assistant** — the sparkle icon opens the AI chat (ask it anything "
                "about the platform or your courses)\n"
                "- **🔔 Notifications** — answers to your questions, meeting confirmations, "
                "assignment feedback\n"
                "- **Your avatar** — profile settings, change password, log out"
            )),
        ],
    },
    {
        "title": "Browsing the Module Library",
        "description": "Find courses, understand module cards, and start learning.",
        "order_index": 2,
        "content": [
            _block("text", content=(
                "# The Module Library\n\n"
                "Click **Modules** in the navbar to see every course your organisation has published. "
                "Each card shows the module thumbnail, title, a short description, and your "
                "current progress percentage."
            )),
            _img_block("1434030216411-0b793f4b4173",
                       "Module library — all your organisation's courses in one grid"),
            _block("text", content=(
                "## Reading a Module Card\n\n"
                "| Element | What it tells you |\n"
                "|---------|-------------------|\n"
                "| Thumbnail | Visual preview of the course topic |\n"
                "| Progress ring | How much you've completed (0–100%) |\n"
                "| Duration | Total watch/read time |\n"
                "| Lesson count | How many videos + note lessons are inside |\n"
                "| Status badge | *New*, *In Progress*, or *Completed* |"
            )),
            _block("text", content=(
                "## Opening a Module\n\n"
                "Click any module card to open its detail page. You'll see:\n\n"
                "1. **About** tab — full description, learning objectives\n"
                "2. **Curriculum** tab — the ordered list of all videos and note lessons\n"
                "3. **Q&A** tab — all questions asked by everyone in your org about this module\n\n"
                "Hit **Start Course** (or **Continue**) to jump into the first unfinished item."
            )),
        ],
    },
    {
        "title": "Video Lessons — Watch & Ask Questions",
        "description": "How to watch a video, use the timestamp Q&A, and interact with answers.",
        "order_index": 3,
        "content": [
            _block("text", content=(
                "# Watching a Video Lesson\n\n"
                "Click any video in the curriculum to open the video player. "
                "The player fills the left two-thirds of the screen; "
                "the Q&A sidebar occupies the right third."
            )),
            _img_block("1611532736597-de2d4265fba3",
                       "The video player with the Q&A sidebar open on the right"),
            _block("text", content=(
                "## Pinning a Question to a Timestamp\n\n"
                "Confused about something you just heard? Here's how to ask:\n\n"
                "1. **Pause** the video at the moment that confused you.\n"
                "2. Click the **gold timestamp pill** below the progress bar "
                "(it shows the current time, e.g. `2:34`).\n"
                "3. Type your question in the popup and hit **Ask**.\n\n"
                "Your question is now pinned to that exact second. Anyone who opens "
                "this video will see your question highlighted right at that timestamp."
            )),
            _block("text", content=(
                "## Exploring Existing Q&A\n\n"
                "The sidebar shows all questions for this video. You can:\n\n"
                "- **Filter** by All / Pending / Answered / Mine\n"
                "- **Search** by keyword\n"
                "- **Click a question** — the video jumps to that timestamp automatically\n"
                "- **Reply** to any question to add your own insight\n\n"
                "Educators can mark an answer as **Official** ✓, and the AI can generate "
                "an answer from the video transcript using the **Ask AI** button."
            )),
        ],
    },
    {
        "title": "Note Lessons — Read & Pin Questions",
        "description": "How note lessons work and how to ask questions on any block.",
        "order_index": 4,
        "content": [
            _block("text", content=(
                "# Note Lessons\n\n"
                "Not all knowledge fits in a video. Note lessons are structured written guides "
                "made of **blocks** — text blocks for explanations and image blocks for "
                "screenshots, diagrams, or visual examples.\n\n"
                "You're reading a note lesson right now!"
            )),
            _img_block("1677442135703-1787eea5ce01",
                       "A note lesson with text and image blocks"),
            _block("text", content=(
                "## Asking a Question on a Block\n\n"
                "Just like pinning a question to a video timestamp, you can pin a question "
                "to any block in a note lesson:\n\n"
                "1. **Hover** over any text or image block.\n"
                "2. A **📌 Ask about this** button appears at the top-right of the block.\n"
                "3. Click it, type your question, and hit **Ask**.\n\n"
                "Your question is anchored to that specific block. The Q&A sidebar on the right "
                "shows which block each question belongs to."
            )),
            _block("text", content=(
                "## The Note Lesson Q&A Sidebar\n\n"
                "The sidebar works exactly like the video Q&A sidebar:\n\n"
                "- **Block label** — a small pill shows which section the question is about\n"
                "- **Clicking a question** — scrolls the lesson content to that block and "
                "highlights it with a gold border\n"
                "- **Filters & search** — same All / Pending / Answered / Mine tabs\n"
                "- **Official answers** — educators can mark answers official\n"
                "- **AI answers** — educators can trigger an AI-generated answer"
            )),
        ],
    },
    {
        "title": "Quizzes, Assignments & Certificates",
        "description": "Test your knowledge, submit work, and earn completion certificates.",
        "order_index": 5,
        "content": [
            _block("text", content=(
                "# Testing Your Knowledge\n\n"
                "After you finish a module's videos and lessons, you may find a **Quiz** — "
                "a set of questions your educator created to check your understanding."
            )),
            _img_block("1434030216411-0b793f4b4173",
                       "Quiz screen with multiple-choice and true/false questions"),
            _block("text", content=(
                "## Taking a Quiz\n\n"
                "1. Open the module and click the **Quiz** tab (or it may appear after the last lesson).\n"
                "2. Answer each question — multiple choice, true/false, or short answer.\n"
                "3. Submit when finished. Your score appears instantly.\n"
                "4. If you didn't pass the threshold, you can retake the quiz.\n\n"
                "Your score is saved to your progress record and visible to your manager."
            )),
            _block("text", content=(
                "## Assignments\n\n"
                "Some modules include **Assignments** — practical tasks beyond watching or reading. "
                "You'll see a due date and a text box to write your submission.\n\n"
                "After you submit, your educator reviews it and leaves written feedback. "
                "You'll get a notification when feedback arrives.\n\n"
                "## Certificates 🎓\n\n"
                "Once you complete all content in a module (and pass any quiz), Nest automatically "
                "issues a **completion certificate**. Find all your certificates under "
                "**Profile → Certificates**. You can download them as PDFs."
            )),
        ],
    },
    {
        "title": "Progress Tracking & the Nest Assistant",
        "description": "Monitor your learning journey and use the AI to get instant help.",
        "order_index": 6,
        "content": [
            _block("text", content=(
                "# Tracking Your Progress\n\n"
                "Go to **Progress** in the navbar to see your full learning history:\n\n"
                "- **Per-module progress** — completion percentage, time spent, quiz scores\n"
                "- **Completion timeline** — when you finished each module\n"
                "- **Pending items** — assignments waiting for submission, unanswered questions\n\n"
                "Managers see a **team view** — every learner's progress across all modules "
                "in one dashboard, with the ability to drill into any individual's record."
            )),
            _img_block("1460925895917-afdab827c52f",
                       "Progress dashboard showing module completion rates and team analytics"),
            _block("text", content=(
                "# The Nest Assistant ✨\n\n"
                "Click the **✨ sparkle icon** in the navbar at any time to open the Nest Assistant. "
                "This is a multi-turn AI chat that:\n\n"
                "- **Knows the whole platform** — ask \"how do I invite a team member?\" and "
                "it gives you exact steps\n"
                "- **Remembers context** within the conversation — you can ask follow-up questions\n"
                "- **Streams responses** — answers appear word-by-word as they're generated\n\n"
                "The assistant is powered by Claude and has full knowledge of every Nest feature. "
                "Think of it as a help desk that's available 24/7."
            )),
            _block("text", content=(
                "## Tips for Getting the Best Answers\n\n"
                "- Be specific: *\"How do I upload a video to a module?\"* beats *\"videos?\"*\n"
                "- Ask follow-ups: the assistant remembers the whole conversation\n"
                "- Ask about workflows: *\"Walk me through inviting a new hire from scratch\"*\n"
                "- Ask for comparisons: *\"What's the difference between a video lesson and a "
                "note lesson?\"*"
            )),
        ],
    },
]


# ── Module B: Nest for Teams — Video + Notes combined ─────────────────────────

LESSON_MODULE_B = {
    "title": "Nest for Teams — Manager's Complete Guide",
    "description": (
        "A mixed course for team leads and managers. Combines demo videos showing "
        "the platform in action with deep-dive note lessons covering every management "
        "workflow: invitations, content creation, progress monitoring, and 1-on-1 meetings."
    ),
    "thumbnail_url": _img("1522071820081-009f0129c71c"),
    "order_index": 15,
}

# Demo video (public sample — replace with real recordings)
_DEMO_VIDEO_URL = (
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
)

LESSON_MODULE_B_VIDEOS = [
    {
        "title": "Platform Walkthrough — Live Demo",
        "description": "A quick screencast of the full Nest interface: dashboard, modules, video player, and note lessons.",
        "video_url": _DEMO_VIDEO_URL,
        "thumbnail_url": _img("1497366216548-37526070297c"),
        "duration_seconds": 120,
        "order_index": 1,
    },
    {
        "title": "Creating a Module — Step by Step",
        "description": "Screencast showing how to create a new module, upload a video, add a note lesson, and publish.",
        "video_url": _DEMO_VIDEO_URL,
        "thumbnail_url": _img("1611532736597-de2d4265fba3"),
        "duration_seconds": 180,
        "order_index": 3,
    },
]

LESSON_MODULE_B_LESSONS = [
    {
        "title": "Inviting & Managing Team Members",
        "description": "How to bring new hires into Nest and control their access.",
        "order_index": 2,
        "content": [
            _block("text", content=(
                "# Inviting Your Team\n\n"
                "As a manager (Owner or Educator role), you can invite anyone in your "
                "organisation to Nest. They'll receive a welcome email with a one-click "
                "login link."
            )),
            _img_block("1522071820081-009f0129c71c",
                       "The invitation panel — send an email invite with a single click"),
            _block("text", content=(
                "## How to Invite Someone\n\n"
                "1. Go to **Settings → Team** (or **Organisation → Members**).\n"
                "2. Click **Invite Member**.\n"
                "3. Enter their email address and choose their role:\n"
                "   - **Learner** — can watch videos, read lessons, ask questions, take quizzes\n"
                "   - **Educator** — can do everything a Learner can, plus create content, "
                "answer questions officially, and manage assignments\n"
                "   - **Owner** — full control including billing and member management\n"
                "4. Click **Send Invite**. They get an email immediately."
            )),
            _block("text", content=(
                "## Managing Existing Members\n\n"
                "From the Team page you can:\n\n"
                "- **Change a member's role** — promote a Learner to Educator, etc.\n"
                "- **Deactivate an account** — they can no longer log in but their "
                "progress data is preserved\n"
                "- **Reactivate** — restore access at any time\n"
                "- **View their progress** — click any member to see their module "
                "completion rates, quiz scores, and question history"
            )),
        ],
    },
    {
        "title": "Creating & Publishing Content",
        "description": "Build video courses and note lessons your team will love.",
        "order_index": 4,
        "content": [
            _block("text", content=(
                "# Building Your Content Library\n\n"
                "Nest supports two content types inside a module:\n\n"
                "| Type | Best for |\n"
                "|------|----------|\n"
                "| **Video Lesson** | Screen recordings, presentations, demos |\n"
                "| **Note Lesson** | Written guides, step-by-step instructions, screenshots |"
            )),
            _img_block("1484480974693-6ca0a78fb36b",
                       "The admin module editor — add videos and note lessons side by side"),
            _block("text", content=(
                "## Creating a Note Lesson\n\n"
                "1. Open any module in the **Admin Module Editor**.\n"
                "2. Scroll to **Note Lessons** and click **+ Add Lesson**.\n"
                "3. Enter a title. The lesson is created immediately.\n"
                "4. Click **Edit** to open the block editor.\n"
                "5. Add content blocks:\n"
                "   - **+ Text** — a rich text area (supports Markdown: `**bold**`, `# heading`, lists)\n"
                "   - **+ Image** — upload a screenshot or diagram from your computer\n"
                "6. Drag blocks to reorder them.\n"
                "7. Click **Save Lesson** when done.\n\n"
                "The lesson is published immediately and visible to all Learners in your org."
            )),
            _block("text", content=(
                "## Best Practices for Note Lessons\n\n"
                "- **Start with a text block** that explains what the lesson covers.\n"
                "- **Alternate text and images** — explanation → screenshot → explanation.\n"
                "- **Keep blocks focused** — one idea per block makes Q&A pinning more useful. "
                "Learners pin questions to individual blocks, so smaller blocks = more precise questions.\n"
                "- **Use Markdown headings** (`## Section Name`) to create visual structure.\n"
                "- **End with a summary block** — bullet points of key takeaways."
            )),
        ],
    },
    {
        "title": "1-on-1 Meetings & Learner Support",
        "description": "Schedule check-ins, confirm sessions, and give meaningful feedback.",
        "order_index": 5,
        "content": [
            _block("text", content=(
                "# 1-on-1 Meetings in Nest\n\n"
                "Nest has a built-in meeting booking system so learners can request "
                "a 1-on-1 session with their manager without leaving the platform."
            )),
            _img_block("1573496359142-b8d87734a5a2",
                       "The meetings panel — upcoming sessions and pending requests"),
            _block("text", content=(
                "## The Booking Flow\n\n"
                "**Learner side:**\n"
                "1. Open **Meetings** from the sidebar.\n"
                "2. Click **Request a Meeting**.\n"
                "3. Pick a preferred time slot and add a short note about the topic.\n"
                "4. Submit — their manager gets a notification immediately.\n\n"
                "**Manager side:**\n"
                "1. You receive an email + in-app notification.\n"
                "2. Open **Meetings** and find the pending request.\n"
                "3. **Confirm** — add a video call link (Zoom, Google Meet, Teams) and a message.\n"
                "4. **Decline** — add a reason so the learner knows why.\n"
                "5. The learner gets an email with the outcome."
            )),
            _block("text", content=(
                "## Tips for Effective 1-on-1s\n\n"
                "- Check the learner's progress before the meeting — Nest shows you their "
                "exact completion status, quiz scores, and questions they've asked.\n"
                "- Review the Q&A thread — their questions reveal exactly where they're stuck.\n"
                "- After the meeting, leave a note in the assignment system so the conversation "
                "is documented for future reference."
            )),
        ],
    },
]


def _seed_lessons(db: Session) -> dict:
    """Create the two demo modules with note lessons (and video stubs for Module B)."""
    results = {
        "module_a_lessons": 0,
        "module_b_videos": 0,
        "module_b_lessons": 0,
        "skipped": [],
    }

    # Find the org
    org = db.query(models.Organization).filter(
        models.Organization.slug == ORG_SLUG
    ).first()
    if not org:
        raise HTTPException(status_code=404, detail="Nest Cameroon org not found. Run /seed first.")

    admin = db.query(models.User).filter(
        models.User.organization_id == org.id,
        models.User.role == models.UserRole.super_admin,
    ).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Super admin not found. Run /seed first.")

    # ── Module A ─────────────────────────────────────────────────────────────
    mod_a = db.query(models.Module).filter(
        models.Module.organization_id == org.id,
        models.Module.title == LESSON_MODULE_A["title"],
    ).first()
    if not mod_a:
        mod_a = models.Module(
            organization_id=org.id,
            created_by=admin.id,
            is_published=True,
            is_for_sale=False,
            duration_seconds=0,
            currency="RWF",
            **{k: v for k, v in LESSON_MODULE_A.items()},
        )
        db.add(mod_a)
        db.flush()

    for ldata in LESSON_MODULE_A_LESSONS:
        existing = db.query(models.Lesson).filter(
            models.Lesson.module_id == mod_a.id,
            models.Lesson.title == ldata["title"],
        ).first()
        if existing:
            results["skipped"].append(ldata["title"])
            continue
        lesson = models.Lesson(
            module_id=mod_a.id,
            created_by=admin.id,
            is_published=True,
            **ldata,
        )
        db.add(lesson)
        results["module_a_lessons"] += 1

    # ── Module B ─────────────────────────────────────────────────────────────
    mod_b = db.query(models.Module).filter(
        models.Module.organization_id == org.id,
        models.Module.title == LESSON_MODULE_B["title"],
    ).first()
    if not mod_b:
        mod_b = models.Module(
            organization_id=org.id,
            created_by=admin.id,
            is_published=True,
            is_for_sale=False,
            duration_seconds=0,
            currency="RWF",
            **{k: v for k, v in LESSON_MODULE_B.items()},
        )
        db.add(mod_b)
        db.flush()

    for vdata in LESSON_MODULE_B_VIDEOS:
        existing = db.query(models.Video).filter(
            models.Video.module_id == mod_b.id,
            models.Video.title == vdata["title"],
        ).first()
        if existing:
            results["skipped"].append(vdata["title"])
            continue
        video = models.Video(module_id=mod_b.id, **vdata)
        db.add(video)
        results["module_b_videos"] += 1

    for ldata in LESSON_MODULE_B_LESSONS:
        existing = db.query(models.Lesson).filter(
            models.Lesson.module_id == mod_b.id,
            models.Lesson.title == ldata["title"],
        ).first()
        if existing:
            results["skipped"].append(ldata["title"])
            continue
        lesson = models.Lesson(
            module_id=mod_b.id,
            created_by=admin.id,
            is_published=True,
            **ldata,
        )
        db.add(lesson)
        results["module_b_lessons"] += 1

    # ── Assignments ───────────────────────────────────────────────────────────
    from datetime import datetime, timezone, timedelta

    # Individual assignment → Module A
    _indiv_title = "Platform Navigation — Written Reflection"
    existing_indiv = db.query(models.Assignment).filter(
        models.Assignment.organization_id == org.id,
        models.Assignment.title == _indiv_title,
    ).first()
    if existing_indiv:
        results["skipped"].append(_indiv_title)
    else:
        db.add(models.Assignment(
            organization_id=org.id,
            module_id=mod_a.id,
            created_by=admin.id,
            title=_indiv_title,
            description=(
                "After completing all lessons in this module, write a short reflection "
                "(300–500 words) covering:\n\n"
                "1. Which part of the Nest interface was easiest to understand and why.\n"
                "2. One feature you think will save you the most time in your daily work.\n"
                "3. A question you still have that wasn't answered by the lessons.\n\n"
                "Submit as plain text — no formatting required."
            ),
            type=models.AssignmentType.individual,
            max_group_size=None,
            portions=None,
            deadline=datetime.now(timezone.utc) + timedelta(days=7),
            status=models.AssignmentStatus.active,
        ))
        results["assignments_created"] = results.get("assignments_created", 0) + 1

    # Group assignment → Module B
    _group_title = "Team Onboarding Process Design"
    existing_group = db.query(models.Assignment).filter(
        models.Assignment.organization_id == org.id,
        models.Assignment.title == _group_title,
    ).first()
    if existing_group:
        results["skipped"].append(_group_title)
    else:
        db.add(models.Assignment(
            organization_id=org.id,
            module_id=mod_b.id,
            created_by=admin.id,
            title=_group_title,
            description=(
                "Working in a group of up to 4 people, design an onboarding plan for a new "
                "employee joining your team. Each group member is responsible for one portion "
                "of the document. Use the Nest platform features you learned in this module "
                "as the backbone of your onboarding process.\n\n"
                "The final merged document should include all four portions and be submitted "
                "together after your group's review meeting."
            ),
            type=models.AssignmentType.group,
            max_group_size=4,
            portions=[
                "Week 1 — Orientation & Platform Setup",
                "Week 2 — Core Training Modules",
                "Week 3 — Practice Tasks & Assignments",
                "Week 4 — Review, Q&A, and Certification",
            ],
            deadline=datetime.now(timezone.utc) + timedelta(days=14),
            status=models.AssignmentStatus.active,
        ))
        results["assignments_created"] = results.get("assignments_created", 0) + 1

    db.commit()
    return results


@router.post("/seed-lessons")
@limiter.limit("5/hour")
def seed_lessons(
    request: Request,
    x_seed_secret: str = Header(..., alias="X-Seed-Secret"),
    db: Session = Depends(get_db),
):
    """Seed two demo modules: a notes-only course and a mixed video+notes course."""
    if not settings.SEED_SECRET or len(settings.SEED_SECRET) < 20:
        raise HTTPException(status_code=503, detail="SEED_SECRET not configured.")
    if not hmac.compare_digest(x_seed_secret, settings.SEED_SECRET):
        raise HTTPException(status_code=403, detail="Invalid seed secret.")

    results = _seed_lessons(db)
    return {"status": "ok", "results": results}
