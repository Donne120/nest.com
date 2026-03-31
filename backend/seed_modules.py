"""
Seed script: creates 13 educational modules covering all Nest functionality
under the Nest Cameroon organisation.

Run AFTER seed_admin.py:
    python seed_modules.py

Safe to re-run — skips any module whose title already exists in the org.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine
import models

ORG_SLUG = "nest-cameroon"
ADMIN_EMAIL = "ngummdieudonne4@gmail.com"

# ── Module definitions ────────────────────────────────────────────────────────
#
# Each dict maps 1-to-1 with Module columns.
# thumbnail_url uses a reliable placeholder image service (no sign-up needed).
# Set is_for_sale=True and price/currency on any module you want to charge for.

# Base URL pattern — width 800, height 450, cropped, auto-formatted
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
        # Bright, welcoming office entrance / open workspace
        "thumbnail_url": _img("1497366216548-37526070297c"),
        "is_for_sale": False,
        "price": None,
        "currency": "RWF",
    },
    {
        "order_index": 2,
        "title": "Setting Up Your Organisation",
        "description": (
            "Step-by-step guide to creating and configuring your Nest "
            "workspace. Covers organisation name, slug, branding, plan "
            "selection, and subscription management."
        ),
        # Clean desk with laptop and planner — setup / configuration feel
        "thumbnail_url": _img("1542744173-8e7e53415bb0"),
        "is_for_sale": False,
        "price": None,
        "currency": "RWF",
    },
    {
        "order_index": 3,
        "title": "Managing Your Team",
        "description": (
            "Everything about users inside Nest. How to invite team members "
            "via email, assign roles (Owner, Educator, Learner), manage "
            "departments, deactivate accounts, and control access."
        ),
        # Diverse team collaborating around a table
        "thumbnail_url": _img("1522071820081-009f0129c71c"),
        "is_for_sale": False,
        "price": None,
        "currency": "RWF",
    },
    {
        "order_index": 4,
        "title": "Creating Courses & Videos",
        "description": (
            "How to build your onboarding content library. Creating modules, "
            "uploading videos to Supabase, setting thumbnails, writing "
            "descriptions, reordering content, and publishing."
        ),
        # Professional camera / video recording setup
        "thumbnail_url": _img("1611532736597-de2d4265fba3"),
        "is_for_sale": False,
        "price": None,
        "currency": "RWF",
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
        # Glowing AI / neural network abstract
        "thumbnail_url": _img("1677442135703-1787eea5ce01"),
        "is_for_sale": False,
        "price": None,
        "currency": "RWF",
    },
    {
        "order_index": 6,
        "title": "Quizzes & Assessments",
        "description": (
            "Creating quizzes to test learner understanding. Covers multiple "
            "choice, true/false, and short-answer question types, setting "
            "pass thresholds, and reviewing results."
        ),
        # Person writing exam / test paper at desk
        "thumbnail_url": _img("1434030216411-0b793f4b4173"),
        "is_for_sale": False,
        "price": None,
        "currency": "RWF",
    },
    {
        "order_index": 7,
        "title": "Assignments & Tasks",
        "description": (
            "How to create assignments for learners, set due dates, review "
            "submissions, and give feedback. Ideal for practical onboarding "
            "tasks beyond video watching."
        ),
        # Checklist / task board with sticky notes
        "thumbnail_url": _img("1484480974693-6ca0a78fb36b"),
        "is_for_sale": False,
        "price": None,
        "currency": "RWF",
    },
    {
        "order_index": 8,
        "title": "Progress Tracking",
        "description": (
            "How learners track their own progress through modules and videos. "
            "Covers completion states, progress percentages, and how admins "
            "can monitor their whole team's advancement."
        ),
        # Dashboard with charts and growth metrics on a monitor
        "thumbnail_url": _img("1551288049-bebda4e38f71"),
        "is_for_sale": False,
        "price": None,
        "currency": "RWF",
    },
    {
        "order_index": 9,
        "title": "1-on-1 Meetings",
        "description": (
            "The meeting feature in Nest. How learners request 1-on-1 sessions "
            "with managers, how managers confirm or decline with a reason, "
            "adding meeting links, and the email notification flow."
        ),
        # Two people in a focused one-on-one conversation
        "thumbnail_url": _img("1573496359142-b8d87734a5a2"),
        "is_for_sale": False,
        "price": None,
        "currency": "RWF",
    },
    {
        "order_index": 10,
        "title": "Analytics & Reporting",
        "description": (
            "Reading your organisation's data. Module completion rates, "
            "per-learner progress, quiz score summaries, and using analytics "
            "to improve your onboarding program over time."
        ),
        # Laptop showing graphs and data analytics
        "thumbnail_url": _img("1460925895917-afdab827c52f"),
        "is_for_sale": False,
        "price": None,
        "currency": "RWF",
    },
    {
        "order_index": 11,
        "title": "Certificates",
        "description": (
            "How Nest issues completion certificates. Triggering certificates "
            "after module completion, customising certificate content, and "
            "where learners can view and download them."
        ),
        # Graduation / achievement — diploma scroll with ribbon
        "thumbnail_url": _img("1523050854058-8df90110c9f1"),
        "is_for_sale": False,
        "price": None,
        "currency": "RWF",
    },
    {
        "order_index": 12,
        "title": "Payments & Billing",
        "description": (
            "How the Nest manual payment system works. Submitting MoMo or "
            "bank transfer proofs, the admin approval flow, how access is "
            "granted automatically after approval, and handling rejections."
        ),
        # Mobile payment / fintech — phone with payment UI
        "thumbnail_url": _img("1556742049-0cfed4f6a45d"),
        "is_for_sale": False,
        "price": None,
        "currency": "RWF",
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
        # Professional job interview across a table
        "thumbnail_url": _img("1586281380349-632531db7ed4"),
        "is_for_sale": False,
        "price": None,
        "currency": "RWF",
    },
]


# ── Runner ────────────────────────────────────────────────────────────────────

def run():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Resolve org
        org = (
            db.query(models.Organization)
            .filter(models.Organization.slug == ORG_SLUG)
            .first()
        )
        if not org:
            print(
                f"ERROR: Organisation '{ORG_SLUG}' not found.\n"
                "Run seed_admin.py first."
            )
            sys.exit(1)

        # Resolve admin user
        admin = (
            db.query(models.User)
            .filter(models.User.email == ADMIN_EMAIL)
            .first()
        )
        if not admin:
            print(
                f"ERROR: Admin user '{ADMIN_EMAIL}' not found.\n"
                "Run seed_admin.py first."
            )
            sys.exit(1)

        created = 0
        skipped = 0

        for data in MODULES:
            exists = (
                db.query(models.Module)
                .filter(
                    models.Module.organization_id == org.id,
                    models.Module.title == data["title"],
                )
                .first()
            )
            if exists:
                print(f"  [skip] '{data['title']}' already exists")
                skipped += 1
                continue

            module = models.Module(
                organization_id=org.id,
                created_by=admin.id,
                title=data["title"],
                description=data["description"],
                thumbnail_url=data.get("thumbnail_url"),
                order_index=data["order_index"],
                is_published=True,
                is_for_sale=data["is_for_sale"],
                price=data["price"],
                currency=data["currency"],
                duration_seconds=0,
            )
            db.add(module)
            print(f"  [add]  '{data['title']}'")
            created += 1

        db.commit()
        print(
            f"\nDone. {created} module(s) created, {skipped} skipped.\n"
            "Log in as the Nest Cameroon admin and upload videos to each module."
        )

    finally:
        db.close()


if __name__ == "__main__":
    run()
