"""
Full-course seed: "Product Thinking: From Zero to Launch"
=========================================================
Organisation: Nest Demo Academy  (slug: nest-demo)

Accounts
--------
  owner@nestdemo.com   / demo123   (owner)   – Jordan Lee
  coach@nestdemo.com   / demo123   (educator) – Dr. Sarah Kim
  marcus@nestdemo.com  / demo123   (learner)  – Marcus Thompson  [in-progress]
  aisha@nestdemo.com   / demo123   (learner)  – Aisha Patel       [completed mod1]
  carlos@nestdemo.com  / demo123   (learner)  – Carlos Rivera     [just started]
  yuki@nestdemo.com    / demo123   (learner)  – Yuki Tanaka       [not started]

Course: "Product Thinking: From Zero to Launch" — 5 videos, rich Q&A, 3 quiz
types, 1 individual assignment, 1 group assignment (3 portions).

Run from inside backend/:
  python seed_full_course.py
"""

import sys, os, json
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
from auth import hash_password
from routers.assignments import _schedule_kickoff_meeting, _check_and_merge

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ── helpers ───────────────────────────────────────────────────────────────────

def tiptap(text: str) -> dict:
    """Minimal TipTap 'doc' node wrapping a single paragraph."""
    return {
        "type": "doc",
        "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": text}]}
        ],
    }


def tiptap_rich(paragraphs: list[str]) -> dict:
    """Multi-paragraph TipTap doc. Skips empty strings to avoid TipTap errors."""
    return {
        "type": "doc",
        "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": p}]}
            for p in paragraphs if p.strip()
        ],
    }


NOW = datetime.now(timezone.utc)

# ── Clean out previous nest-demo data (if re-running) ─────────────────────────

existing_org = db.query(models.Organization).filter_by(slug="nest-demo").first()
if existing_org:
    oid = existing_org.id
    # Delete in dependency order
    for uid in [u.id for u in db.query(models.User).filter_by(organization_id=oid).all()]:
        db.query(models.Answer).filter_by(answered_by=uid).delete()
        db.query(models.Question).filter_by(asked_by=uid).delete()
        db.query(models.UserProgress).filter_by(user_id=uid).delete()
        db.query(models.Notification).filter_by(user_id=uid).delete()
        db.query(models.VideoNote).filter_by(user_id=uid).delete()
    # Assignments cascade
    for asgn in db.query(models.Assignment).filter_by(organization_id=oid).all():
        db.query(models.AssignmentSubmission).filter_by(assignment_id=asgn.id).delete()
        for grp in db.query(models.AssignmentGroup).filter_by(assignment_id=asgn.id).all():
            db.query(models.GroupMember).filter_by(group_id=grp.id).delete()
        db.query(models.AssignmentGroup).filter_by(assignment_id=asgn.id).delete()
    db.query(models.Assignment).filter_by(organization_id=oid).delete()
    # Meetings
    db.query(models.MeetingBooking).filter_by(organization_id=oid).delete()
    # Modules → videos → quiz/questions
    for mod in db.query(models.Module).filter_by(organization_id=oid).all():
        for vid in db.query(models.Video).filter_by(module_id=mod.id).all():
            db.query(models.QuizAnswer).filter(
                models.QuizAnswer.question_id.in_(
                    db.query(models.QuizQuestion.id).filter_by(video_id=vid.id)
                )
            ).delete(synchronize_session=False)
            db.query(models.QuizOption).filter(
                models.QuizOption.question_id.in_(
                    db.query(models.QuizQuestion.id).filter_by(video_id=vid.id)
                )
            ).delete(synchronize_session=False)
            db.query(models.QuizQuestion).filter_by(video_id=vid.id).delete()
            db.query(models.QuizSubmission).filter_by(video_id=vid.id).delete()
            db.query(models.Answer).filter(
                models.Answer.question_id.in_(
                    db.query(models.Question.id).filter_by(video_id=vid.id)
                )
            ).delete(synchronize_session=False)
            db.query(models.Question).filter_by(video_id=vid.id).delete()
            db.query(models.VideoNote).filter_by(video_id=vid.id).delete()
        db.query(models.Video).filter_by(module_id=mod.id).delete()
    db.query(models.Module).filter_by(organization_id=oid).delete()
    db.query(models.Invitation).filter_by(organization_id=oid).delete()
    db.query(models.User).filter_by(organization_id=oid).delete()
    db.query(models.Organization).filter_by(id=oid).delete()
    db.commit()
    print("Cleaned previous nest-demo data.")

# ═════════════════════════════════════════════════════════════════════════════
# ORGANISATION
# ═════════════════════════════════════════════════════════════════════════════

org = models.Organization(
    name="Nest Demo Academy",
    slug="nest-demo",
    brand_color="#7c3aed",
    plan=models.Plan.professional,
    subscription_status=models.SubscriptionStatus.active,
)
db.add(org)
db.flush()

# ═════════════════════════════════════════════════════════════════════════════
# USERS
# ═════════════════════════════════════════════════════════════════════════════

owner = models.User(
    organization_id=org.id,
    email="owner@nestdemo.com",
    full_name="Jordan Lee",
    hashed_password=hash_password("demo123"),
    role=models.UserRole.owner,
    department="Leadership",
)
coach = models.User(
    organization_id=org.id,
    email="coach@nestdemo.com",
    full_name="Dr. Sarah Kim",
    hashed_password=hash_password("demo123"),
    role=models.UserRole.educator,
    department="Product",
)
marcus = models.User(
    organization_id=org.id,
    email="marcus@nestdemo.com",
    full_name="Marcus Thompson",
    hashed_password=hash_password("demo123"),
    role=models.UserRole.learner,
    department="Engineering",
)
aisha = models.User(
    organization_id=org.id,
    email="aisha@nestdemo.com",
    full_name="Aisha Patel",
    hashed_password=hash_password("demo123"),
    role=models.UserRole.learner,
    department="Design",
)
carlos = models.User(
    organization_id=org.id,
    email="carlos@nestdemo.com",
    full_name="Carlos Rivera",
    hashed_password=hash_password("demo123"),
    role=models.UserRole.learner,
    department="Marketing",
)
yuki = models.User(
    organization_id=org.id,
    email="yuki@nestdemo.com",
    full_name="Yuki Tanaka",
    hashed_password=hash_password("demo123"),
    role=models.UserRole.learner,
    department="Data",
)
db.add_all([owner, coach, marcus, aisha, carlos, yuki])
db.flush()

# ═════════════════════════════════════════════════════════════════════════════
# MODULE
# ═════════════════════════════════════════════════════════════════════════════

module = models.Module(
    organization_id=org.id,
    title="Product Thinking: From Zero to Launch",
    description=(
        "A practical deep-dive into modern product development. You will learn how to "
        "identify real user problems, prioritise ruthlessly, ship a Minimum Viable Product, "
        "and measure whether it actually worked. Suitable for engineers, designers, and "
        "marketers who want to think like a product manager."
    ),
    resources=json.dumps([
        {
            "title": "Inspired — Marty Cagan",
            "url": "https://www.svpg.com/inspired-how-to-create-products-customers-love/",
            "type": "book",
        },
        {
            "title": "The Lean Startup — Eric Ries",
            "url": "http://theleanstartup.com/",
            "type": "book",
        },
        {
            "title": "JTBD Framework Overview",
            "url": "https://jtbd.info/",
            "type": "article",
        },
        {
            "title": "Product Hunt — discover what ships",
            "url": "https://www.producthunt.com/",
            "type": "link",
        },
    ]),
    order_index=0,
    is_published=True,
    created_by=coach.id,
)
db.add(module)
db.flush()

# ═════════════════════════════════════════════════════════════════════════════
# VIDEOS (5)
# ═════════════════════════════════════════════════════════════════════════════

v1 = models.Video(
    module_id=module.id,
    title="What Is Product Thinking?",
    description="We unpack the mental model shift from 'feature factory' to genuine product ownership.",
    video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration_seconds=742,
    order_index=0,
)
v2 = models.Video(
    module_id=module.id,
    title="Understanding Your Users",
    description="Interviews, surveys, and observation — how to listen so users tell you the truth.",
    video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration_seconds=918,
    order_index=1,
)
v3 = models.Video(
    module_id=module.id,
    title="Defining the Problem Space",
    description="Jobs-to-be-done, problem statements, and why solutions should come last.",
    video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration_seconds=1056,
    order_index=2,
)
v4 = models.Video(
    module_id=module.id,
    title="Building Your MVP",
    description="What 'minimum' really means, how to scope a first release, and avoiding scope creep.",
    video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration_seconds=884,
    order_index=3,
)
v5 = models.Video(
    module_id=module.id,
    title="Measuring What Matters",
    description="North Star metrics, leading vs. lagging indicators, and how to run a product review.",
    video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration_seconds=796,
    order_index=4,
)
db.add_all([v1, v2, v3, v4, v5])
db.flush()

# ═════════════════════════════════════════════════════════════════════════════
# Q&A  (questions + official answers)
# ═════════════════════════════════════════════════════════════════════════════

# --- Video 1 Q&A ---
q1a = models.Question(
    video_id=v1.id,
    asked_by=marcus.id,
    timestamp_seconds=85.0,
    question_text="Is product thinking only for product managers, or is it useful for engineers too?",
    status=models.QuestionStatus.answered,
    is_public=True,
)
q1b = models.Question(
    video_id=v1.id,
    asked_by=aisha.id,
    timestamp_seconds=320.0,
    question_text="You mentioned 'outcome over output' — how do you convince a stakeholder who just wants features shipped?",
    status=models.QuestionStatus.answered,
    is_public=True,
)
q1c = models.Question(
    video_id=v1.id,
    asked_by=carlos.id,
    timestamp_seconds=612.0,
    question_text="What is the difference between a product manager and a product owner?",
    status=models.QuestionStatus.pending,
    is_public=True,
)
db.add_all([q1a, q1b, q1c])
db.flush()

db.add_all([
    models.Answer(
        question_id=q1a.id,
        answered_by=coach.id,
        answer_text=(
            "Absolutely useful for everyone. Engineers who think in products ship features that "
            "actually solve problems instead of ones that just pass acceptance criteria. It also "
            "makes conversations with PMs much more productive."
        ),
        is_official=True,
    ),
    models.Answer(
        question_id=q1b.id,
        answered_by=coach.id,
        answer_text=(
            "Frame outcomes in terms stakeholders care about: revenue, retention, or NPS. "
            "Show them a past feature that shipped but didn't move the metric — then ask "
            "'would we have built this differently if we had started with the outcome?'. "
            "That usually opens the conversation."
        ),
        is_official=True,
    ),
])

# --- Video 2 Q&A ---
q2a = models.Question(
    video_id=v2.id,
    asked_by=aisha.id,
    timestamp_seconds=140.0,
    question_text="How many user interviews do you need before you can trust a pattern?",
    status=models.QuestionStatus.answered,
    is_public=True,
)
q2b = models.Question(
    video_id=v2.id,
    asked_by=yuki.id,
    timestamp_seconds=480.0,
    question_text="Can we use existing support tickets instead of doing fresh interviews?",
    status=models.QuestionStatus.answered,
    is_public=True,
)
q2c = models.Question(
    video_id=v2.id,
    asked_by=marcus.id,
    timestamp_seconds=775.0,
    question_text="What tools do you recommend for remote user research?",
    status=models.QuestionStatus.pending,
    is_public=True,
)
db.add_all([q2a, q2b, q2c])
db.flush()

db.add_all([
    models.Answer(
        question_id=q2a.id,
        answered_by=coach.id,
        answer_text=(
            "Nielsen Norman research suggests 5 interviews surface ~85% of usability issues. "
            "For discovery research aim for 8-12. Stop when you hear the same themes repeating "
            "without surprises — that is your saturation signal."
        ),
        is_official=True,
    ),
    models.Answer(
        question_id=q2b.id,
        answered_by=coach.id,
        answer_text=(
            "Yes — support tickets are underused gold. Mine them for the language users actually "
            "use (not the language you use), the frequency of each problem, and emotional words "
            "like 'frustrated' or 'confused'. Then do 3-5 follow-up calls to go deeper on the "
            "top themes."
        ),
        is_official=True,
    ),
    models.Answer(
        question_id=q2b.id,
        answered_by=marcus.id,
        answer_text=(
            "We do this at my company — we tag Zendesk tickets with a 'product-signal' label and "
            "review them every sprint. It is surprisingly actionable."
        ),
        is_official=False,
    ),
])

# --- Video 3 Q&A ---
q3a = models.Question(
    video_id=v3.id,
    asked_by=carlos.id,
    timestamp_seconds=200.0,
    question_text="How do you write a good problem statement that the whole team can align on?",
    status=models.QuestionStatus.answered,
    is_public=True,
)
q3b = models.Question(
    video_id=v3.id,
    asked_by=yuki.id,
    timestamp_seconds=890.0,
    question_text="Is JTBD the same as user stories?",
    status=models.QuestionStatus.answered,
    is_public=True,
)
db.add_all([q3a, q3b])
db.flush()

db.add_all([
    models.Answer(
        question_id=q3a.id,
        answered_by=coach.id,
        answer_text=(
            "Use the format: '[User persona] struggles to [do X] because [root cause], "
            "which results in [negative outcome]. We know this is true because [evidence].' "
            "The evidence anchor is the key — it forces you to tie the statement to real data."
        ),
        is_official=True,
    ),
    models.Answer(
        question_id=q3b.id,
        answered_by=coach.id,
        answer_text=(
            "Related but different. User stories describe a feature from the user's perspective: "
            "'As a [role] I want [feature] so that [benefit].' JTBD goes deeper — it asks "
            "what job the user is trying to accomplish in their life, regardless of your product. "
            "JTBD is discovery; user stories are delivery."
        ),
        is_official=True,
    ),
])

# --- Video 4 Q&A ---
q4a = models.Question(
    video_id=v4.id,
    asked_by=marcus.id,
    timestamp_seconds=55.0,
    question_text="Does an MVP always have to be software? Could it be a spreadsheet or a manual process?",
    status=models.QuestionStatus.answered,
    is_public=True,
)
q4b = models.Question(
    video_id=v4.id,
    asked_by=aisha.id,
    timestamp_seconds=660.0,
    question_text="How do you handle stakeholders who want to add more scope to the MVP?",
    status=models.QuestionStatus.pending,
    is_public=True,
)
db.add_all([q4a, q4b])
db.flush()

db.add(models.Answer(
    question_id=q4a.id,
    answered_by=coach.id,
    answer_text=(
        "Absolutely. Dropbox validated the idea with a video before writing a single line of code. "
        "Zapier started as manual Zaps done by humans. The MVP is the minimum experiment to test "
        "your riskiest assumption — the format depends on what that assumption is."
    ),
    is_official=True,
))

# --- Video 5 Q&A ---
q5a = models.Question(
    video_id=v5.id,
    asked_by=yuki.id,
    timestamp_seconds=115.0,
    question_text="What is the difference between a North Star metric and a KPI?",
    status=models.QuestionStatus.answered,
    is_public=True,
)
q5b = models.Question(
    video_id=v5.id,
    asked_by=carlos.id,
    timestamp_seconds=590.0,
    question_text="How often should a product team review their metrics?",
    status=models.QuestionStatus.answered,
    is_public=True,
)
db.add_all([q5a, q5b])
db.flush()

db.add_all([
    models.Answer(
        question_id=q5a.id,
        answered_by=coach.id,
        answer_text=(
            "A North Star is the single metric that best captures the core value your product "
            "delivers to users — e.g., Spotify's is 'time spent listening'. KPIs are operational "
            "health checks (conversion rate, churn, latency). The North Star points the whole "
            "company in one direction; KPIs tell you if the engine is running well."
        ),
        is_official=True,
    ),
    models.Answer(
        question_id=q5b.id,
        answered_by=coach.id,
        answer_text=(
            "Weekly for leading indicators (activation, engagement), monthly for lagging ones "
            "(revenue, churn). Run a full product review quarterly where you ask: 'Is our North "
            "Star still the right one?' Most teams review too infrequently and then are surprised "
            "by annual numbers."
        ),
        is_official=True,
    ),
])

db.flush()

# ═════════════════════════════════════════════════════════════════════════════
# VIDEO NOTES
# ═════════════════════════════════════════════════════════════════════════════

db.add_all([
    models.VideoNote(
        user_id=marcus.id,
        video_id=v1.id,
        content="Outcome over output — need to share this with the team. We keep tracking story points not impact.",
        timestamp_seconds=310.0,
    ),
    models.VideoNote(
        user_id=marcus.id,
        video_id=v2.id,
        content="5-12 interviews for discovery saturation. Book a block of 6 for our next sprint.",
        timestamp_seconds=None,
    ),
    models.VideoNote(
        user_id=aisha.id,
        video_id=v1.id,
        content="Feature factory vs. product thinking — draw this diagram for the design team.",
        timestamp_seconds=88.0,
    ),
    models.VideoNote(
        user_id=aisha.id,
        video_id=v3.id,
        content="Problem statement template: [persona] struggles to [X] because [root cause], resulting in [outcome]. Evidence: [data]",
        timestamp_seconds=205.0,
    ),
    models.VideoNote(
        user_id=yuki.id,
        video_id=v5.id,
        content="North Star = core value delivered to user. KPIs = engine health. Great distinction.",
        timestamp_seconds=120.0,
    ),
])
db.flush()

# ═════════════════════════════════════════════════════════════════════════════
# QUIZZES
# ═════════════════════════════════════════════════════════════════════════════

# ── Video 1 Quiz: 3 questions (MCQ, True/False, Short Answer) ─────────────────

qq1_1 = models.QuizQuestion(
    video_id=v1.id,
    question_text="Which best describes the 'outcome over output' principle?",
    question_type=models.QuestionType.mcq,
    order_index=0,
    is_required=True,
    explanation="Outputs are things we build; outcomes are changes in user behaviour or business results. Great product teams optimise for outcomes.",
)
db.add(qq1_1)
db.flush()
db.add_all([
    models.QuizOption(question_id=qq1_1.id, option_text="Shipping more features per sprint", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq1_1.id, option_text="Optimising for measurable change in user behaviour or business results", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq1_1.id, option_text="Writing cleaner code with fewer bugs", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq1_1.id, option_text="Delivering projects on time and on budget", is_correct=False, order_index=3),
])

qq1_2 = models.QuizQuestion(
    video_id=v1.id,
    question_text="A 'feature factory' is a team that prioritises user outcomes over raw feature count.",
    question_type=models.QuestionType.true_false,
    order_index=1,
    is_required=True,
    explanation="False — a feature factory is the opposite: it prioritises shipping volume. The term is a critique of teams that build without validating impact.",
)
db.add(qq1_2)
db.flush()
db.add_all([
    models.QuizOption(question_id=qq1_2.id, option_text="True", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq1_2.id, option_text="False", is_correct=True, order_index=1),
])

qq1_3 = models.QuizQuestion(
    video_id=v1.id,
    question_text="In your own words, describe one situation at your current job where product thinking would change how a decision was made.",
    question_type=models.QuestionType.short_answer,
    order_index=2,
    is_required=False,
    explanation=None,
)
db.add(qq1_3)
db.flush()

# ── Video 2 Quiz: 3 questions ─────────────────────────────────────────────────

qq2_1 = models.QuizQuestion(
    video_id=v2.id,
    question_text="According to Nielsen Norman research, approximately how many user interviews surface ~85% of usability issues?",
    question_type=models.QuestionType.mcq,
    order_index=0,
    is_required=True,
    explanation="5 interviews catch roughly 85% of issues. Adding more yields diminishing returns, which is why quick iterative rounds of 5 beat one giant study.",
)
db.add(qq2_1)
db.flush()
db.add_all([
    models.QuizOption(question_id=qq2_1.id, option_text="2", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq2_1.id, option_text="5", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq2_1.id, option_text="20", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq2_1.id, option_text="50", is_correct=False, order_index=3),
])

qq2_2 = models.QuizQuestion(
    video_id=v2.id,
    question_text="Support tickets can be a valid substitute for conducting any user interviews.",
    question_type=models.QuestionType.true_false,
    order_index=1,
    is_required=True,
    explanation="False — tickets reveal what users complain about but not the full context of why. Follow-up interviews are still needed to go deeper.",
)
db.add(qq2_2)
db.flush()
db.add_all([
    models.QuizOption(question_id=qq2_2.id, option_text="True", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq2_2.id, option_text="False", is_correct=True, order_index=1),
])

qq2_3 = models.QuizQuestion(
    video_id=v2.id,
    question_text="What is 'saturation' in the context of user research, and how do you know when you have reached it?",
    question_type=models.QuestionType.short_answer,
    order_index=2,
    is_required=True,
    explanation=None,
)
db.add(qq2_3)
db.flush()

# ── Video 3 Quiz: 2 questions ─────────────────────────────────────────────────

qq3_1 = models.QuizQuestion(
    video_id=v3.id,
    question_text="Which of the following is the correct JTBD (Jobs-to-be-Done) framing?",
    question_type=models.QuestionType.mcq,
    order_index=0,
    is_required=True,
    explanation="JTBD focuses on the underlying progress the customer is trying to make in their life, not on the product features.",
)
db.add(qq3_1)
db.flush()
db.add_all([
    models.QuizOption(question_id=qq3_1.id, option_text="'As a user I want a faster search so I can find results quickly'", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq3_1.id, option_text="'When I am trying to make a confident hiring decision, help me compare candidates without switching tabs'", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq3_1.id, option_text="'Search latency should be under 200 ms at the 99th percentile'", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq3_1.id, option_text="'Increase the search click-through rate by 10%'", is_correct=False, order_index=3),
])

qq3_2 = models.QuizQuestion(
    video_id=v3.id,
    question_text="A good problem statement should include evidence that ties it to real user data.",
    question_type=models.QuestionType.true_false,
    order_index=1,
    is_required=True,
    explanation="True — the evidence anchor prevents the team from building solutions to assumed problems that do not actually exist.",
)
db.add(qq3_2)
db.flush()
db.add_all([
    models.QuizOption(question_id=qq3_2.id, option_text="True", is_correct=True, order_index=0),
    models.QuizOption(question_id=qq3_2.id, option_text="False", is_correct=False, order_index=1),
])

# ── Video 4 Quiz: 2 questions ─────────────────────────────────────────────────

qq4_1 = models.QuizQuestion(
    video_id=v4.id,
    question_text="Which example best represents a true MVP?",
    question_type=models.QuestionType.mcq,
    order_index=0,
    is_required=True,
    explanation="The Dropbox explainer video is the classic MVP — it tested demand (the riskiest assumption) with zero engineering.",
)
db.add(qq4_1)
db.flush()
db.add_all([
    models.QuizOption(question_id=qq4_1.id, option_text="A fully designed app with 20 features launched to 10 beta users", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq4_1.id, option_text="A Dropbox explainer video posted online before the product was built", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq4_1.id, option_text="A working prototype that handles only the happy path", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq4_1.id, option_text="A landing page with a 'Coming soon' sign-up form", is_correct=False, order_index=3),
])

qq4_2 = models.QuizQuestion(
    video_id=v4.id,
    question_text="Describe what your team's next MVP could look like if you stripped it down to test only the single riskiest assumption.",
    question_type=models.QuestionType.short_answer,
    order_index=1,
    is_required=False,
    explanation=None,
)
db.add(qq4_2)
db.flush()

# ── Video 5 Quiz: 3 questions ─────────────────────────────────────────────────

qq5_1 = models.QuizQuestion(
    video_id=v5.id,
    question_text="What is the primary purpose of a North Star metric?",
    question_type=models.QuestionType.mcq,
    order_index=0,
    is_required=True,
    explanation="The North Star aligns the entire organisation on what creating value for users looks like.",
)
db.add(qq5_1)
db.flush()
db.add_all([
    models.QuizOption(question_id=qq5_1.id, option_text="Track engineering velocity each sprint", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq5_1.id, option_text="Align the whole company on the core value delivered to users", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq5_1.id, option_text="Replace all other KPIs with a single number", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq5_1.id, option_text="Satisfy investor reporting requirements", is_correct=False, order_index=3),
])

qq5_2 = models.QuizQuestion(
    video_id=v5.id,
    question_text="Leading indicators are always more valuable than lagging indicators.",
    question_type=models.QuestionType.true_false,
    order_index=1,
    is_required=True,
    explanation="False — both matter. Leading indicators (activation, engagement) let you course-correct quickly; lagging indicators (revenue, churn) confirm whether your strategy worked.",
)
db.add(qq5_2)
db.flush()
db.add_all([
    models.QuizOption(question_id=qq5_2.id, option_text="True", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq5_2.id, option_text="False", is_correct=True, order_index=1),
])

qq5_3 = models.QuizQuestion(
    video_id=v5.id,
    question_text="What would you choose as the North Star metric for your current product, and why?",
    question_type=models.QuestionType.short_answer,
    order_index=2,
    is_required=True,
    explanation=None,
)
db.add(qq5_3)
db.flush()

# ═════════════════════════════════════════════════════════════════════════════
# PROGRESS  (per learner state)
# ═════════════════════════════════════════════════════════════════════════════

# Aisha — completed entire module
db.add(models.UserProgress(
    user_id=aisha.id,
    module_id=module.id,
    video_id=v5.id,
    status=models.ModuleStatus.completed,
    progress_seconds=sum([v1.duration_seconds, v2.duration_seconds, v3.duration_seconds,
                          v4.duration_seconds, v5.duration_seconds]),
    completed_at=NOW - timedelta(days=3),
    last_viewed_at=NOW - timedelta(days=3),
))

# Marcus — in progress (through video 3)
db.add(models.UserProgress(
    user_id=marcus.id,
    module_id=module.id,
    video_id=v3.id,
    status=models.ModuleStatus.in_progress,
    progress_seconds=v1.duration_seconds + v2.duration_seconds + 420,
    last_viewed_at=NOW - timedelta(hours=5),
))

# Carlos — just started (video 1 half done)
db.add(models.UserProgress(
    user_id=carlos.id,
    module_id=module.id,
    video_id=v1.id,
    status=models.ModuleStatus.in_progress,
    progress_seconds=350,
    last_viewed_at=NOW - timedelta(hours=1),
))

# Yuki — not started (no progress row)

db.flush()

# ═════════════════════════════════════════════════════════════════════════════
# QUIZ SUBMISSIONS  (Aisha has completed quizzes for v1, v2, v3)
# ═════════════════════════════════════════════════════════════════════════════

def _answer_mcq(db, submission_id, question, correct: bool):
    opts = db.query(models.QuizOption).filter_by(question_id=question.id).all()
    correct_opt = next(o for o in opts if o.is_correct)
    wrong_opt = next(o for o in opts if not o.is_correct)
    chosen = correct_opt if correct else wrong_opt
    db.add(models.QuizAnswer(
        submission_id=submission_id,
        question_id=question.id,
        selected_option_id=chosen.id,
        is_correct=correct,
    ))


def _answer_tf(db, submission_id, question, correct: bool):
    _answer_mcq(db, submission_id, question, correct)


def _answer_short(db, submission_id, question, text: str):
    db.add(models.QuizAnswer(
        submission_id=submission_id,
        question_id=question.id,
        answer_text=text,
        is_correct=None,
    ))


# Aisha — v1 quiz (perfect score)
sub_a_v1 = models.QuizSubmission(video_id=v1.id, user_id=aisha.id, score=2, max_score=2,
                                  submitted_at=NOW - timedelta(days=4))
db.add(sub_a_v1)
db.flush()
_answer_mcq(db, sub_a_v1.id, qq1_1, correct=True)
_answer_tf(db, sub_a_v1.id, qq1_2, correct=True)
_answer_short(db, sub_a_v1.id, qq1_3,
              "In sprint planning we often add features without asking whether they actually "
              "move the activation metric. Product thinking would force us to start with the outcome.")

# Aisha — v2 quiz
sub_a_v2 = models.QuizSubmission(video_id=v2.id, user_id=aisha.id, score=2, max_score=2,
                                  submitted_at=NOW - timedelta(days=3))
db.add(sub_a_v2)
db.flush()
_answer_mcq(db, sub_a_v2.id, qq2_1, correct=True)
_answer_tf(db, sub_a_v2.id, qq2_2, correct=True)
_answer_short(db, sub_a_v2.id, qq2_3,
              "Saturation is when new interviews stop producing new insights. "
              "You notice you can predict what the next participant will say before they say it.")

# Aisha — v3 quiz
sub_a_v3 = models.QuizSubmission(video_id=v3.id, user_id=aisha.id, score=2, max_score=2,
                                  submitted_at=NOW - timedelta(days=3))
db.add(sub_a_v3)
db.flush()
_answer_mcq(db, sub_a_v3.id, qq3_1, correct=True)
_answer_tf(db, sub_a_v3.id, qq3_2, correct=True)

# Marcus — v1 quiz (one wrong)
sub_m_v1 = models.QuizSubmission(video_id=v1.id, user_id=marcus.id, score=1, max_score=2,
                                  submitted_at=NOW - timedelta(hours=6))
db.add(sub_m_v1)
db.flush()
_answer_mcq(db, sub_m_v1.id, qq1_1, correct=True)
_answer_tf(db, sub_m_v1.id, qq1_2, correct=False)   # got it wrong
_answer_short(db, sub_m_v1.id, qq1_3,
              "We track velocity in story points every sprint but never measure whether users "
              "actually changed their behaviour after we shipped the feature.")

# Marcus — v2 quiz
sub_m_v2 = models.QuizSubmission(video_id=v2.id, user_id=marcus.id, score=2, max_score=2,
                                  submitted_at=NOW - timedelta(hours=5))
db.add(sub_m_v2)
db.flush()
_answer_mcq(db, sub_m_v2.id, qq2_1, correct=True)
_answer_tf(db, sub_m_v2.id, qq2_2, correct=True)
_answer_short(db, sub_m_v2.id, qq2_3,
              "Saturation is when you keep hearing the same problems from different participants "
              "and new interviews add no new themes.")

db.flush()

# ═════════════════════════════════════════════════════════════════════════════
# INDIVIDUAL ASSIGNMENT
# ═════════════════════════════════════════════════════════════════════════════

individual_assignment = models.Assignment(
    organization_id=org.id,
    module_id=module.id,
    created_by=coach.id,
    title="User Research Report",
    description=(
        "Conduct at least 3 user interviews (or analyse existing support tickets) "
        "for a product you work on or use regularly. Write a structured report covering: "
        "(1) research method used, (2) key themes identified, (3) top 3 user needs ranked "
        "by frequency and severity, (4) one problem statement using the template from Video 3."
    ),
    type=models.AssignmentType.individual,
    portions=[],
    deadline=NOW + timedelta(days=7),
    status=models.AssignmentStatus.active,
)
db.add(individual_assignment)
db.flush()

# Aisha has submitted a polished report
aisha_submission = models.AssignmentSubmission(
    assignment_id=individual_assignment.id,
    learner_id=aisha.id,
    content=tiptap_rich([
        "User Research Report — Aisha Patel",
        "",
        "Method: I analysed 47 support tickets tagged 'search' from our Zendesk over the last "
        "90 days, then conducted 5 follow-up video calls with users who had submitted those tickets.",
        "",
        "Key Themes:",
        "1. Users could not find items they knew existed (mentioned in 31 of 47 tickets)",
        "2. Filter options were invisible — users did not know they existed",
        "3. Spelling tolerance was poor — one typo broke results completely",
        "",
        "Top 3 User Needs:",
        "1. (High frequency, High severity) Reliable search that returns known items",
        "2. (High frequency, Medium severity) Discoverable filters",
        "3. (Medium frequency, High severity) Forgiving spell-check",
        "",
        "Problem Statement:",
        "Returning users struggle to find items they have previously purchased because "
        "the search engine penalises minor typos and hides filter controls, resulting in "
        "frustration and an increase in support contacts. We know this is true because "
        "31/47 'search' tickets mention known-item retrieval failures (Q4 Zendesk data).",
    ]),
    word_count=198,
    status=models.SubmissionStatus.submitted,
    submitted_at=NOW - timedelta(days=2),
)
db.add(aisha_submission)

# Marcus has a draft
marcus_submission = models.AssignmentSubmission(
    assignment_id=individual_assignment.id,
    learner_id=marcus.id,
    content=tiptap_rich([
        "User Research Report — Marcus Thompson (DRAFT)",
        "",
        "Method: Planning to interview 3 engineers who use our internal developer portal.",
        "",
        "Initial observations from last week's retro:",
        "- Deploy pipeline is hard to find",
        "- Log viewer times out before searches finish",
        "- No clear status page for ongoing incidents",
        "",
        "Will complete after the interviews scheduled for Thursday.",
    ]),
    word_count=55,
    status=models.SubmissionStatus.draft,
)
db.add(marcus_submission)
db.flush()

# ═════════════════════════════════════════════════════════════════════════════
# GROUP ASSIGNMENT  (3 portions, 3 learners)
# ═════════════════════════════════════════════════════════════════════════════

group_assignment = models.Assignment(
    organization_id=org.id,
    module_id=module.id,
    created_by=coach.id,
    title="Product Launch Plan",
    description=(
        "Working in teams of 3, produce a go-to-market plan for a new product feature of your "
        "choice. Each team member owns one section. You must coordinate your sections so they "
        "tell a coherent story. The final merged document will be reviewed in a live session "
        "with Dr. Kim."
    ),
    type=models.AssignmentType.group,
    max_group_size=3,
    portions=["Market Analysis", "Go-to-Market Strategy", "Metrics & KPIs"],
    deadline=NOW + timedelta(days=14),
    status=models.AssignmentStatus.active,
)
db.add(group_assignment)
db.flush()

# Group — created bare, meetings scheduled via the same functions the app uses
team_alpha = models.AssignmentGroup(
    assignment_id=group_assignment.id,
    merge_status=models.MergeStatus.pending,
)
db.add(team_alpha)
db.flush()

# Members
mem_marcus = models.GroupMember(
    group_id=team_alpha.id,
    learner_id=marcus.id,
    portion_label="Market Analysis",
    portion_index=0,
)
mem_aisha = models.GroupMember(
    group_id=team_alpha.id,
    learner_id=aisha.id,
    portion_label="Go-to-Market Strategy",
    portion_index=1,
)
mem_carlos = models.GroupMember(
    group_id=team_alpha.id,
    learner_id=carlos.id,
    portion_label="Metrics & KPIs",
    portion_index=2,
)
db.add_all([mem_marcus, mem_aisha, mem_carlos])
db.flush()
db.refresh(team_alpha)

# Auto-schedule kickoff meeting (same logic as activate_assignment)
_schedule_kickoff_meeting(team_alpha, group_assignment, db)
db.flush()

# All three portions (submitted) — demonstrates complete merge + review meeting
aisha_group_sub = models.AssignmentSubmission(
    assignment_id=group_assignment.id,
    learner_id=aisha.id,
    group_member_id=mem_aisha.id,
    content=tiptap_rich([
        "Go-to-Market Strategy — Aisha Patel",
        "Target channels: (1) Direct outreach to power users identified via usage analytics, "
        "(2) In-app announcement banner for all active users, (3) Product Hunt launch on Tuesday.",
        "Pricing: Free tier unchanged; new feature gated at Pro ($29/mo). Offer 30-day trial "
        "to existing free users who activate the feature in the first 2 weeks.",
        "Messaging: Lead with the user problem ('Stop losing hours to broken search') not the "
        "feature ('Introducing Smart Search v2'). Every channel must use the same problem framing.",
        "Timeline: Week 1 — Internal beta (50 power users). "
        "Week 2 — Fix critical bugs, prep assets. "
        "Week 3 — Public launch + Product Hunt. "
        "Week 4 — Retrospective, iterate.",
    ]),
    word_count=147,
    status=models.SubmissionStatus.submitted,
    submitted_at=NOW - timedelta(hours=4),
)
db.add(aisha_group_sub)
mem_aisha.submitted_at = NOW - timedelta(hours=4)

marcus_group_sub = models.AssignmentSubmission(
    assignment_id=group_assignment.id,
    learner_id=marcus.id,
    group_member_id=mem_marcus.id,
    content=tiptap_rich([
        "Market Analysis — Marcus Thompson",
        "TAM: Internal developer tools market estimated at $21B globally (2025 Gartner).",
        "SAM: Mid-market SaaS companies with 50-500 engineers — approx. $3.2B.",
        "SOM: Realistic 3-year target: 0.5% of SAM = $16M ARR.",
        "Competitive landscape: Linear (strong on issues, weak search), "
        "Notion (flexible but slow), Confluence (enterprise dominant, poor DX).",
        "Our differentiation: speed-first search with developer-native keyboard shortcuts.",
    ]),
    word_count=98,
    status=models.SubmissionStatus.submitted,
    submitted_at=NOW - timedelta(hours=3),
)
db.add(marcus_group_sub)
mem_marcus.submitted_at = NOW - timedelta(hours=3)

carlos_group_sub = models.AssignmentSubmission(
    assignment_id=group_assignment.id,
    learner_id=carlos.id,
    group_member_id=mem_carlos.id,
    content=tiptap_rich([
        "Metrics & KPIs — Carlos Rivera",
        "North Star metric: Weekly Active Searchers (users who perform >= 1 search per week).",
        "Leading indicators: search activation rate (% of users who search in first session), "
        "zero-results rate (target < 5%), p95 search latency (target < 300ms).",
        "Lagging indicators: 30-day retention of users who activated search vs. those who did not, "
        "Pro conversion rate among free users who used search in trial.",
        "Review cadence: leading indicators weekly in sprint review; "
        "lagging indicators monthly in product review.",
    ]),
    word_count=112,
    status=models.SubmissionStatus.submitted,
    submitted_at=NOW - timedelta(hours=2),
)
db.add(carlos_group_sub)
mem_carlos.submitted_at = NOW - timedelta(hours=2)

db.flush()
db.refresh(team_alpha)

# Trigger merge + auto-schedule review meeting (same logic as save_submission)
_check_and_merge(group_assignment, team_alpha, db)
db.flush()

# ═════════════════════════════════════════════════════════════════════════════
# NOTIFICATIONS
# ═════════════════════════════════════════════════════════════════════════════

db.add_all([
    models.Notification(
        user_id=marcus.id,
        type="assignment_activated",
        title="New assignment: User Research Report",
        message="Dr. Sarah Kim has published a new individual assignment due in 7 days.",
        reference_id=str(individual_assignment.id),
    ),
    models.Notification(
        user_id=aisha.id,
        type="submission_confirmed",
        title="Submission received",
        message="Your User Research Report has been submitted successfully.",
        reference_id=str(individual_assignment.id),
        is_read=True,
    ),
    models.Notification(
        user_id=carlos.id,
        type="assignment_activated",
        title="New assignment: Product Launch Plan",
        message="You have been added to Team Alpha for the group assignment. Kickoff meeting confirmed.",
        reference_id=str(group_assignment.id),
    ),
    models.Notification(
        user_id=marcus.id,
        type="team_progress",
        title="Aisha submitted her portion",
        message="Aisha Patel has submitted 'Go-to-Market Strategy'. 2 portions still pending.",
        reference_id=str(group_assignment.id),
    ),
    models.Notification(
        user_id=coach.id,
        type="submission_received",
        title="Aisha submitted User Research Report",
        message="Aisha Patel submitted 'User Research Report'. Ready for review.",
        reference_id=str(individual_assignment.id),
    ),
])

# ═════════════════════════════════════════════════════════════════════════════
# COMMIT
# ═════════════════════════════════════════════════════════════════════════════

db.commit()
db.close()

print()
print("=" * 62)
print(" Nest Demo Academy — full course seed complete")
print("=" * 62)
print()
print("  Organisation:  Nest Demo Academy  (slug: nest-demo)")
print("  Brand colour:  #7c3aed  (violet)")
print()
print("  Accounts (all passwords: demo123)")
print("  -------------------------------------------------")
print("  owner@nestdemo.com   owner    Jordan Lee")
print("  coach@nestdemo.com   educator Dr. Sarah Kim")
print("  marcus@nestdemo.com  learner  Marcus Thompson  [in-progress]")
print("  aisha@nestdemo.com   learner  Aisha Patel      [module completed]")
print("  carlos@nestdemo.com  learner  Carlos Rivera    [just started]")
print("  yuki@nestdemo.com    learner  Yuki Tanaka      [not started]")
print()
print("  Course:  Product Thinking: From Zero to Launch")
print("  -------------------------------------------------")
print("  5 videos  |  14 Q&A threads  |  13 quiz questions")
print("  (MCQ, True/False, Short Answer across all 3 types)")
print("  5 learner notes")
print()
print("  Assignments")
print("  -------------------------------------------------")
print("  [Individual] User Research Report  — due in 7 days")
print("    Aisha   : submitted (polished report)")
print("    Marcus  : draft (interviews pending)")
print("    Carlos  : not started")
print("    Yuki    : not started")
print()
print("  [Group] Product Launch Plan  — due in 14 days")
print("    Team Alpha: Marcus / Aisha / Carlos")
print("    Portions  : Market Analysis | GTM Strategy | Metrics & KPIs")
print("    Aisha     : Go-to-Market Strategy SUBMITTED")
print("    Marcus    : Market Analysis DRAFT")
print("    Carlos    : Metrics & KPIs not started")
print("    Merge     : partial (1/3 submitted)")
print()
print("  Progress")
print("  -------------------------------------------------")
print("  Aisha   : module COMPLETED  (all 5 videos + 3 quizzes)")
print("  Marcus  : in-progress at video 3  (2 quizzes done)")
print("  Carlos  : in-progress at video 1  (half-way through)")
print("  Yuki    : not started")
print()
print("  Quiz submissions seeded for Aisha (v1, v2, v3) and Marcus (v1, v2)")
print()
print("  Notifications: 5 seeded across coach/learners")
print("=" * 62)
print()
