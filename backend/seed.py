"""
Multi-tenant seed script.
Creates 2 demo organizations with full content.

Org 1 — Acme Corp
  admin@acme.com / admin123
  manager@acme.com / manager123
  alice@acme.com / employee123
  bob@acme.com / employee123

Org 2 — TechStart Inc
  admin@techstart.com / admin123
  dev@techstart.com / employee123

Platform super-admin (no org)
  superadmin@nestapp.com / superadmin123
"""
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
from auth import hash_password

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ── Clean slate ───────────────────────────────────────────────────────────────
db.query(models.QuizAnswer).delete()
db.query(models.QuizSubmission).delete()
db.query(models.QuizOption).delete()
db.query(models.QuizQuestion).delete()
db.query(models.Answer).delete()
db.query(models.Question).delete()
db.query(models.UserProgress).delete()
db.query(models.Video).delete()
db.query(models.Module).delete()
db.query(models.Invitation).delete()
db.query(models.Notification).delete()
db.query(models.User).delete()
db.query(models.Organization).delete()
db.commit()

# ─── Organization 1: Acme Corp ────────────────────────────────────────────────

acme = models.Organization(
    name="Acme Corp",
    slug="acme-corp",
    brand_color="#6366f1",
    plan=models.Plan.professional,
    subscription_status=models.SubscriptionStatus.active,
    trial_ends_at=None,
)
db.add(acme)
db.flush()

acme_admin = models.User(
    organization_id=acme.id,
    email="admin@acme.com",
    full_name="Alex Admin",
    hashed_password=hash_password("admin123"),
    role=models.UserRole.admin,
    department="Leadership",
)
acme_manager = models.User(
    organization_id=acme.id,
    email="manager@acme.com",
    full_name="Maria Manager",
    hashed_password=hash_password("manager123"),
    role=models.UserRole.manager,
    department="People & Ops",
)
acme_alice = models.User(
    organization_id=acme.id,
    email="alice@acme.com",
    full_name="Alice Chen",
    hashed_password=hash_password("employee123"),
    role=models.UserRole.employee,
    department="Engineering",
)
acme_bob = models.User(
    organization_id=acme.id,
    email="bob@acme.com",
    full_name="Bob Okafor",
    hashed_password=hash_password("employee123"),
    role=models.UserRole.employee,
    department="Marketing",
)
db.add_all([acme_admin, acme_manager, acme_alice, acme_bob])
db.flush()

# Acme modules
acme_mod1 = models.Module(
    organization_id=acme.id,
    title="Welcome to Acme Corp",
    description="Everything you need to know to get started at Acme.",
    order_index=0,
    created_by=acme_admin.id,
)
acme_mod2 = models.Module(
    organization_id=acme.id,
    title="Tools & Systems",
    description="Set up your development environment and internal tools.",
    order_index=1,
    created_by=acme_admin.id,
)
acme_mod3 = models.Module(
    organization_id=acme.id,
    title="Security & Compliance",
    description="Critical security policies every Acme employee must understand.",
    order_index=2,
    created_by=acme_admin.id,
)
db.add_all([acme_mod1, acme_mod2, acme_mod3])
db.flush()

# Acme videos
v1 = models.Video(module_id=acme_mod1.id, title="Welcome from the CEO", video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration_seconds=596, order_index=0)
v2 = models.Video(module_id=acme_mod1.id, title="Our Culture & Values", video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration_seconds=653, order_index=1)
v3 = models.Video(module_id=acme_mod2.id, title="Setting Up Your Dev Environment", video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration_seconds=852, order_index=0)
v4 = models.Video(module_id=acme_mod2.id, title="Internal Tools Walkthrough", video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration_seconds=451, order_index=1)
v5 = models.Video(module_id=acme_mod3.id, title="Data Security Basics", video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration_seconds=723, order_index=0)
db.add_all([v1, v2, v3, v4, v5])
db.flush()

# Acme Q&A
q1 = models.Question(video_id=v1.id, asked_by=acme_alice.id, timestamp_seconds=45.0, question_text="What does the CEO mean by 'radical transparency'?", status=models.QuestionStatus.answered)
q2 = models.Question(video_id=v2.id, asked_by=acme_bob.id, timestamp_seconds=120.5, question_text="How often do we do all-hands meetings?", status=models.QuestionStatus.pending)
q3 = models.Question(video_id=v3.id, asked_by=acme_alice.id, timestamp_seconds=300.0, question_text="Can I use WSL2 instead of the native setup?", status=models.QuestionStatus.answered)
db.add_all([q1, q2, q3])
db.flush()

a1 = models.Answer(question_id=q1.id, answered_by=acme_manager.id, answer_text="It means every decision at Acme is documented and shared company-wide so anyone can review the reasoning.", is_official=True)
a2 = models.Answer(question_id=q3.id, answered_by=acme_manager.id, answer_text="Yes! WSL2 is fully supported. See the engineering wiki for the WSL2-specific setup guide.", is_official=True)
db.add_all([a1, a2])

# Acme quiz for v1
qq1 = models.QuizQuestion(video_id=v1.id, question_text="What is Acme Corp's primary mission statement?", question_type=models.QuestionType.mcq, order_index=0)
db.add(qq1)
db.flush()
db.add_all([
    models.QuizOption(question_id=qq1.id, option_text="Maximize shareholder value", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq1.id, option_text="Build products that matter", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq1.id, option_text="Move fast and break things", is_correct=False, order_index=2),
])

# Acme progress
db.add(models.UserProgress(user_id=acme_alice.id, module_id=acme_mod1.id, status=models.ModuleStatus.completed, progress_seconds=1249, completed_at=datetime.utcnow() - timedelta(days=2)))
db.add(models.UserProgress(user_id=acme_alice.id, module_id=acme_mod2.id, status=models.ModuleStatus.in_progress, progress_seconds=450))

# ─── Organization 2: TechStart Inc ────────────────────────────────────────────

techstart = models.Organization(
    name="TechStart Inc",
    slug="techstart-inc",
    brand_color="#10b981",
    plan=models.Plan.trial,
    subscription_status=models.SubscriptionStatus.active,
    trial_ends_at=datetime.utcnow() + timedelta(days=9),
)
db.add(techstart)
db.flush()

ts_admin = models.User(
    organization_id=techstart.id,
    email="admin@techstart.com",
    full_name="Sam Singh",
    hashed_password=hash_password("admin123"),
    role=models.UserRole.admin,
    department="Founder",
)
ts_dev = models.User(
    organization_id=techstart.id,
    email="dev@techstart.com",
    full_name="Priya Dev",
    hashed_password=hash_password("employee123"),
    role=models.UserRole.employee,
    department="Engineering",
)
db.add_all([ts_admin, ts_dev])
db.flush()

ts_mod1 = models.Module(
    organization_id=techstart.id,
    title="TechStart Onboarding",
    description="Welcome to the fastest-growing startup in the valley.",
    order_index=0,
    created_by=ts_admin.id,
)
db.add(ts_mod1)
db.flush()

ts_v1 = models.Video(module_id=ts_mod1.id, title="Company Overview", video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration_seconds=480, order_index=0)
db.add(ts_v1)
db.flush()

ts_q1 = models.Question(video_id=ts_v1.id, asked_by=ts_dev.id, timestamp_seconds=90.0, question_text="What is our Series A timeline?", status=models.QuestionStatus.pending)
db.add(ts_q1)

# ─── Platform super-admin (no org) ────────────────────────────────────────────

super_admin = models.User(
    organization_id=None,
    email="superadmin@nestapp.com",
    full_name="Platform Admin",
    hashed_password=hash_password("superadmin123"),
    role=models.UserRole.super_admin,
)
db.add(super_admin)

db.commit()
print("Multi-tenant seed complete.\n")
print("  Acme Corp (professional plan)")
print("    admin@acme.com / admin123")
print("    manager@acme.com / manager123")
print("    alice@acme.com / employee123")
print("    bob@acme.com / employee123\n")
print("  TechStart Inc (trial — 9 days remaining)")
print("    admin@techstart.com / admin123")
print("    dev@techstart.com / employee123\n")
print("  Platform super-admin")
print("    superadmin@nestapp.com / superadmin123")
db.close()
