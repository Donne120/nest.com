"""
Ethical Use of AI — The Complete Guide
Course seed script.

Creates a dedicated "AI Ethics Academy" organization with a full 10-video course,
quiz questions on every video, module resources, and sample Q&A.

Credentials
───────────────────────────────────────────────────
  admin@aiethics.academy     / aiethics123
  instructor@aiethics.academy / instructor123
  student1@aiethics.academy  / student123
  student2@aiethics.academy  / student123

Run:
  cd backend && python seed_ai_ethics_course.py

NOTE: Video URLs below are real YouTube video IDs mapped to publicly available
      educational talks. Replace with your own hosted MP4 files for production.
"""

import sys, os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
from auth import hash_password

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ── Remove any previous AI Ethics Academy org cleanly ─────────────────────────
existing_org = db.query(models.Organization).filter_by(slug="ai-ethics-academy").first()
if existing_org:
    org_users = db.query(models.User).filter_by(organization_id=existing_org.id).all()
    user_ids = [u.id for u in org_users]
    org_modules = db.query(models.Module).filter_by(organization_id=existing_org.id).all()
    module_ids = [m.id for m in org_modules]
    video_ids = [v.id for v in db.query(models.Video).filter(models.Video.module_id.in_(module_ids)).all()]

    db.query(models.MeetingBooking).filter_by(organization_id=existing_org.id).delete()
    db.query(models.QuizAnswer).filter(
        models.QuizAnswer.submission_id.in_(
            db.query(models.QuizSubmission.id).filter(models.QuizSubmission.video_id.in_(video_ids))
        )
    ).delete(synchronize_session=False)
    db.query(models.QuizSubmission).filter(models.QuizSubmission.video_id.in_(video_ids)).delete(synchronize_session=False)
    db.query(models.QuizOption).filter(
        models.QuizOption.question_id.in_(
            db.query(models.QuizQuestion.id).filter(models.QuizQuestion.video_id.in_(video_ids))
        )
    ).delete(synchronize_session=False)
    db.query(models.QuizQuestion).filter(models.QuizQuestion.video_id.in_(video_ids)).delete(synchronize_session=False)
    db.query(models.Answer).filter(
        models.Answer.question_id.in_(
            db.query(models.Question.id).filter(models.Question.video_id.in_(video_ids))
        )
    ).delete(synchronize_session=False)
    db.query(models.Question).filter(models.Question.video_id.in_(video_ids)).delete(synchronize_session=False)
    db.query(models.UserProgress).filter(models.UserProgress.module_id.in_(module_ids)).delete(synchronize_session=False)
    db.query(models.VideoNote).filter(models.VideoNote.video_id.in_(video_ids)).delete(synchronize_session=False)
    db.query(models.Video).filter(models.Video.module_id.in_(module_ids)).delete(synchronize_session=False)
    db.query(models.Module).filter_by(organization_id=existing_org.id).delete()
    db.query(models.Notification).filter(models.Notification.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(models.Invitation).filter_by(organization_id=existing_org.id).delete()
    db.query(models.User).filter_by(organization_id=existing_org.id).delete()
    db.query(models.Organization).filter_by(id=existing_org.id).delete()
    db.commit()
    print("Cleaned up previous AI Ethics Academy org.")


# ─── Organization ─────────────────────────────────────────────────────────────

org = models.Organization(
    name="AI Ethics Academy",
    slug="ai-ethics-academy",
    brand_color="#6366f1",
    plan=models.Plan.professional,
    subscription_status=models.SubscriptionStatus.active,
)
db.add(org)
db.flush()

# ─── Users ────────────────────────────────────────────────────────────────────

admin = models.User(
    organization_id=org.id,
    email="admin@aiethics.academy",
    full_name="Dr. Aisha Kamara",
    hashed_password=hash_password("aiethics123"),
    role=models.UserRole.owner,
    department="AI Ethics Research",
)
instructor = models.User(
    organization_id=org.id,
    email="instructor@aiethics.academy",
    full_name="Prof. James Osei",
    hashed_password=hash_password("instructor123"),
    role=models.UserRole.educator,
    department="Curriculum",
)
student1 = models.User(
    organization_id=org.id,
    email="student1@aiethics.academy",
    full_name="Maria Santos",
    hashed_password=hash_password("student123"),
    role=models.UserRole.learner,
    department="Data Science",
)
student2 = models.User(
    organization_id=org.id,
    email="student2@aiethics.academy",
    full_name="Kwame Mensah",
    hashed_password=hash_password("student123"),
    role=models.UserRole.learner,
    department="Product Management",
)
db.add_all([admin, instructor, student1, student2])
db.flush()

# ─── Course Module ────────────────────────────────────────────────────────────

course = models.Module(
    organization_id=org.id,
    title="Ethical Use of AI: The Complete Guide",
    description="""<h2>About This Course</h2>
<p>Artificial intelligence is reshaping every corner of society — hiring decisions, healthcare diagnoses, criminal sentencing, loan approvals, and how we consume information. This course gives you the knowledge and frameworks to understand, question, and improve AI systems from an ethical standpoint.</p>
<p>Whether you're a developer building AI products, a business leader deploying AI tools, a student entering the tech industry, or simply a citizen living in an AI-shaped world — this course is for you.</p>
<h3>What You'll Learn</h3>
<ul>
  <li>How AI bias enters systems and causes real-world harm</li>
  <li>Why privacy is fundamentally threatened by modern AI</li>
  <li>How to think clearly about fairness, accountability, and transparency</li>
  <li>The landscape of global AI regulation and governance</li>
  <li>How to apply an ethics framework in your own work</li>
</ul>
<h3>Course Format</h3>
<p>10 video lessons with quizzes, curated resources, and a certificate of completion. Estimated total: <strong>3 hours</strong>.</p>""",
    resources=[
        {"id": "r1", "title": "EU AI Act — Official Text", "url": "https://artificialintelligenceact.eu/", "type": "link"},
        {"id": "r2", "title": "Algorithmic Justice League", "url": "https://www.ajl.org/", "type": "link"},
        {"id": "r3", "title": "Partnership on AI — Resources", "url": "https://partnershiponai.org/resources/", "type": "link"},
        {"id": "r4", "title": "AI Now Institute Annual Report", "url": "https://ainowinstitute.org/reports.html", "type": "link"},
        {"id": "r5", "title": "Google PAIR — People + AI Research", "url": "https://pair.withgoogle.com/", "type": "link"},
        {"id": "r6", "title": "UNESCO Recommendation on AI Ethics", "url": "https://www.unesco.org/en/artificial-intelligence/recommendation-ethics", "type": "link"},
    ],
    thumbnail_url="https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80",
    duration_seconds=10980,  # ~3 hrs total
    order_index=0,
    is_published=True,
    created_by=admin.id,
)
db.add(course)
db.flush()

# ═══════════════════════════════════════════════════════════════════════════════
# VIDEOS
# ═══════════════════════════════════════════════════════════════════════════════

# ─── Video 1: Why AI Ethics Is Urgent ─────────────────────────────────────────

v1 = models.Video(
    module_id=course.id,
    title="Lesson 1 — Why AI Ethics Is Urgent",
    description="We open with the question everyone building or using AI must confront: what could go wrong? This lesson traces real-world failures — from biased hiring algorithms to lethal autonomous weapons — and explains why the speed of AI deployment is outpacing our ethical frameworks. By the end you'll understand why ethics isn't a luxury add-on but a core engineering discipline.",
    video_url="https://www.youtube.com/watch?v=EBK-a94IFIY",
    duration_seconds=1068,  # ~17 min — Stuart Russell TED: 3 principles for safer AI
    order_index=0,
)
db.add(v1)
db.flush()

# Quiz — V1
qq1_1 = models.QuizQuestion(video_id=v1.id, question_text="Which of the following best describes why AI ethics has become urgent in recent years?", question_type=models.QuestionType.mcq, order_index=0, explanation="AI is being deployed at unprecedented speed into high-stakes domains — healthcare, justice, hiring, finance — before robust ethical frameworks exist. This gap is the core urgency.")
db.add(qq1_1); db.flush()
db.add_all([
    models.QuizOption(question_id=qq1_1.id, option_text="AI has become conscious and is making its own moral decisions", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq1_1.id, option_text="AI is being deployed into high-stakes domains faster than ethical frameworks can keep pace", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq1_1.id, option_text="Governments have already passed comprehensive AI laws in every country", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq1_1.id, option_text="AI systems are always too complex to audit or understand", is_correct=False, order_index=3),
])

qq1_2 = models.QuizQuestion(video_id=v1.id, question_text="AI ethics is only relevant to engineers and data scientists building AI systems.", question_type=models.QuestionType.true_false, order_index=1, explanation="False. Anyone who uses, deploys, procures, manages, or is affected by AI systems has an ethical responsibility. This includes business leaders, policy makers, lawyers, educators, and ordinary citizens.")
db.add(qq1_2); db.flush()
db.add_all([
    models.QuizOption(question_id=qq1_2.id, option_text="True", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq1_2.id, option_text="False", is_correct=True, order_index=1),
])

qq1_3 = models.QuizQuestion(video_id=v1.id, question_text="What does Stuart Russell identify as the core problem with how we currently program AI systems?", question_type=models.QuestionType.mcq, order_index=2, explanation="Russell argues the fundamental problem is that we program AI to pursue a fixed objective — but we can never fully specify what we actually want. A system that is certain of its objective has no reason to defer to humans or allow itself to be switched off.")
db.add(qq1_3); db.flush()
db.add_all([
    models.QuizOption(question_id=qq1_3.id, option_text="AI hardware is too slow to run complex ethical reasoning", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq1_3.id, option_text="We program AI with fixed objectives it pursues without regard for what we truly value", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq1_3.id, option_text="AI systems have too many parameters to control", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq1_3.id, option_text="Engineers lack the mathematical skills to program safe AI", is_correct=False, order_index=3),
])


# ─── Video 2: What Is AI? A Plain-Language Primer ─────────────────────────────

v2 = models.Video(
    module_id=course.id,
    title="Lesson 2 — What Is AI? A Plain-Language Primer",
    description="You can't ethically evaluate something you don't understand. This lesson demystifies how AI actually works — machine learning, neural networks, large language models — without requiring any maths background. We cover the difference between narrow AI and general AI, how models learn from data, and why that learning process is where ethical problems are born.",
    video_url="https://www.youtube.com/watch?v=t4kyRyKyOpo",
    duration_seconds=1020,  # ~17 min
    order_index=1,
)
db.add(v2)
db.flush()

qq2_1 = models.QuizQuestion(video_id=v2.id, question_text="Machine learning models learn by:", question_type=models.QuestionType.mcq, order_index=0, explanation="ML models find statistical patterns in historical training data. They do not understand the world — they approximate patterns. This is why the quality and representativeness of training data is so ethically significant.")
db.add(qq2_1); db.flush()
db.add_all([
    models.QuizOption(question_id=qq2_1.id, option_text="Being programmed with explicit if/then rules by engineers", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq2_1.id, option_text="Finding statistical patterns in historical training data", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq2_1.id, option_text="Accessing the internet in real time and learning like humans", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq2_1.id, option_text="Consulting databases of ethical principles", is_correct=False, order_index=3),
])

qq2_2 = models.QuizQuestion(video_id=v2.id, question_text="Today's most advanced AI systems — including GPT-4 and Gemini — are examples of Artificial General Intelligence (AGI).", question_type=models.QuestionType.true_false, order_index=1, explanation="False. These are Narrow AI systems, extraordinarily powerful at specific tasks but with no genuine understanding, reasoning, or generalisation across domains the way human intelligence works. AGI remains a research goal, not a current reality.")
db.add(qq2_2); db.flush()
db.add_all([
    models.QuizOption(question_id=qq2_2.id, option_text="True", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq2_2.id, option_text="False", is_correct=True, order_index=1),
])

qq2_3 = models.QuizQuestion(video_id=v2.id, question_text="Why does the source and composition of training data matter ethically?", question_type=models.QuestionType.mcq, order_index=2, explanation="If training data reflects historical inequalities, discrimination, or gaps in representation, the model will learn and reproduce those patterns — often at scale. Garbage in, unethical outcomes out.")
db.add(qq2_3); db.flush()
db.add_all([
    models.QuizOption(question_id=qq2_3.id, option_text="More data always makes AI more ethical regardless of its content", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq2_3.id, option_text="Training data shapes what patterns the model learns — biased data produces biased outputs", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq2_3.id, option_text="Training data only affects speed, not the fairness of outputs", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq2_3.id, option_text="Data ethics is the sole responsibility of data engineers, not product teams", is_correct=False, order_index=3),
])


# ─── Video 3: Bias — When AI Discriminates ────────────────────────────────────

v3 = models.Video(
    module_id=course.id,
    title="Lesson 3 — Bias: When AI Discriminates",
    description="This is the lesson that changes how you see AI forever. We examine documented cases where AI systems caused measurable harm through bias: Amazon's recruiting tool that penalised women, the COMPAS recidivism algorithm that mislabelled Black defendants at twice the rate of white defendants, and Joy Buolamwini's landmark study showing facial recognition failing on darker-skinned faces. We then trace exactly how bias enters a system — from data collection to labelling to deployment.",
    video_url="https://www.youtube.com/watch?v=UG_X_7g63rY",
    duration_seconds=538,  # ~9 min — Joy Buolamwini TED
    order_index=2,
)
db.add(v3)
db.flush()

qq3_1 = models.QuizQuestion(video_id=v3.id, question_text="Amazon scrapped its AI recruiting tool in 2018 primarily because:", question_type=models.QuestionType.mcq, order_index=0, explanation="The model was trained on 10 years of Amazon hiring data — data that reflected a historically male-dominated tech industry. The model learned to penalise resumes containing words like 'women's' and downgraded graduates of all-women colleges.")
db.add(qq3_1); db.flush()
db.add_all([
    models.QuizOption(question_id=qq3_1.id, option_text="It was too expensive to run at scale", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq3_1.id, option_text="It penalised résumés from women, having learned from historically male hiring data", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq3_1.id, option_text="It could not read PDF format résumés correctly", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq3_1.id, option_text="It produced identical scores for all candidates, making it useless", is_correct=False, order_index=3),
])

qq3_2 = models.QuizQuestion(video_id=v3.id, question_text="Joy Buolamwini's research found that commercial facial recognition systems performed worst on which group?", question_type=models.QuestionType.mcq, order_index=1, explanation="Buolamwini's 'Gender Shades' study found error rates up to 34.7% for darker-skinned women, compared to under 1% for lighter-skinned men. The systems were trained predominantly on lighter-skinned faces, creating a fundamental representation gap.")
db.add(qq3_2); db.flush()
db.add_all([
    models.QuizOption(question_id=qq3_2.id, option_text="Older adults over 65", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq3_2.id, option_text="Darker-skinned women", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq3_2.id, option_text="Lighter-skinned men", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq3_2.id, option_text="Children under 12", is_correct=False, order_index=3),
])

qq3_3 = models.QuizQuestion(video_id=v3.id, question_text="Bias in AI systems can enter at multiple points. Name two stages in the AI development pipeline where bias can be introduced.", question_type=models.QuestionType.short_answer, order_index=2, explanation="Bias can enter at: (1) Data collection — if data over- or under-represents certain groups; (2) Data labelling — if human annotators hold biases; (3) Feature selection — if proxies for protected attributes are included; (4) Model evaluation — if the test set doesn't represent all user groups; (5) Deployment context — if the model is used in a setting it wasn't tested for.")
db.add(qq3_3); db.flush()

qq3_4 = models.QuizQuestion(video_id=v3.id, question_text="A biased AI system always discriminates intentionally — its creators wanted it to treat groups differently.", question_type=models.QuestionType.true_false, order_index=3, explanation="False. Most AI bias is unintentional — it arises from data and design choices that seem neutral but encode historical inequalities. Intent does not determine harm; impact does. A system can cause discriminatory outcomes through negligence, not just malice.")
db.add(qq3_4); db.flush()
db.add_all([
    models.QuizOption(question_id=qq3_4.id, option_text="True", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq3_4.id, option_text="False", is_correct=True, order_index=1),
])


# ─── Video 4: Privacy in the Age of AI ───────────────────────────────────────

v4 = models.Video(
    module_id=course.id,
    title="Lesson 4 — Privacy in the Age of AI",
    description="AI runs on data — and most of that data is about us. This lesson explores how modern AI systems vacuum up personal information, how surveillance capitalism turns our behaviour into products, and what rights we have. We cover the GDPR's key provisions, the concept of data minimisation, consent frameworks, and the special risks posed by biometric data. You'll leave understanding why 'I have nothing to hide' is not a valid privacy argument.",
    video_url="https://www.youtube.com/watch?v=_2u_eHHzRto",
    duration_seconds=780,  # ~13 min — Cathy O'Neil TED
    order_index=3,
)
db.add(v4)
db.flush()

qq4_1 = models.QuizQuestion(video_id=v4.id, question_text="Under the GDPR, which of the following is a lawful basis for processing personal data?", question_type=models.QuestionType.mcq, order_index=0, explanation="The GDPR specifies six lawful bases. Freely-given, specific, informed, and unambiguous consent is one. 'We might find it useful' is not a recognised basis — data must be collected for a specific, explicit, and legitimate purpose.")
db.add(qq4_1); db.flush()
db.add_all([
    models.QuizOption(question_id=qq4_1.id, option_text="The company might find the data useful in the future", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq4_1.id, option_text="Freely given, specific, informed and unambiguous consent from the data subject", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq4_1.id, option_text="The data was already publicly posted somewhere online", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq4_1.id, option_text="The company is based outside the EU", is_correct=False, order_index=3),
])

qq4_2 = models.QuizQuestion(video_id=v4.id, question_text="What is 'data minimisation' in the context of AI ethics?", question_type=models.QuestionType.mcq, order_index=1, explanation="Data minimisation is the principle that systems should collect only the data strictly necessary for their stated purpose — no more. It directly counteracts the 'collect everything, figure out the use later' culture common in tech.")
db.add(qq4_2); db.flush()
db.add_all([
    models.QuizOption(question_id=qq4_2.id, option_text="Compressing data files to reduce storage costs", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq4_2.id, option_text="Collecting only the data strictly necessary for the stated purpose", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq4_2.id, option_text="Deleting data after a minimum retention period of 10 years", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq4_2.id, option_text="Sharing the minimum amount of data with third parties", is_correct=False, order_index=3),
])

qq4_3 = models.QuizQuestion(video_id=v4.id, question_text="People who 'have nothing to hide' have no reason to care about AI privacy.", question_type=models.QuestionType.true_false, order_index=2, explanation="False. Privacy is not about hiding wrongdoing — it's about autonomy, dignity, and power. Surveillance enables manipulation, chilling of free expression, discrimination, and political control. As Edward Snowden put it: 'Arguing that you have nothing to hide is like arguing you don't care about free speech because you have nothing to say.'")
db.add(qq4_3); db.flush()
db.add_all([
    models.QuizOption(question_id=qq4_3.id, option_text="True", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq4_3.id, option_text="False", is_correct=True, order_index=1),
])

qq4_4 = models.QuizQuestion(video_id=v4.id, question_text="Why is biometric data considered especially sensitive under privacy law?", question_type=models.QuestionType.mcq, order_index=3, explanation="Biometric data — fingerprints, facial geometry, iris patterns, gait, voice — is permanent and unique. Unlike a password, you cannot change your face if your biometric data is breached. This irreversibility makes its misuse particularly severe.")
db.add(qq4_4); db.flush()
db.add_all([
    models.QuizOption(question_id=qq4_4.id, option_text="It is too large to store efficiently on most servers", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq4_4.id, option_text="It is permanently tied to a person and cannot be changed if compromised", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq4_4.id, option_text="It is only collected with explicit consent, making it harder to gather", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq4_4.id, option_text="It requires special hardware that most companies cannot afford", is_correct=False, order_index=3),
])


# ─── Video 5: Fairness and Algorithmic Justice ────────────────────────────────

v5 = models.Video(
    module_id=course.id,
    title="Lesson 5 — Fairness and Algorithmic Justice",
    description="'Fair' sounds simple — but mathematically, it's a minefield. This lesson unpacks the different formal definitions of algorithmic fairness (demographic parity, equalised odds, individual fairness, counterfactual fairness) and reveals a stunning result: most of these definitions are mathematically incompatible with each other. You cannot satisfy all of them simultaneously. Understanding this forces honest conversations about which tradeoffs society is willing to accept.",
    video_url="https://www.youtube.com/watch?v=jIXIuYdnyyk",
    duration_seconds=1200,  # ~20 min
    order_index=4,
)
db.add(v5)
db.flush()

qq5_1 = models.QuizQuestion(video_id=v5.id, question_text="Demographic parity (statistical parity) requires that:", question_type=models.QuestionType.mcq, order_index=0, explanation="Demographic parity requires that the proportion of positive outcomes (e.g. loan approvals, job offers) is equal across groups, regardless of their underlying qualification rates. Critics argue this can require treating unequally qualified people equally.")
db.add(qq5_1); db.flush()
db.add_all([
    models.QuizOption(question_id=qq5_1.id, option_text="The accuracy of the model is the same for all demographic groups", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq5_1.id, option_text="The proportion of positive outcomes is equal across demographic groups", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq5_1.id, option_text="Each individual is judged solely on their own merits, not group membership", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq5_1.id, option_text="Protected attributes like race and gender are never used as features", is_correct=False, order_index=3),
])

qq5_2 = models.QuizQuestion(video_id=v5.id, question_text="It is mathematically possible to design an AI system that simultaneously satisfies all major formal definitions of fairness.", question_type=models.QuestionType.true_false, order_index=1, explanation="False. This is the 'impossibility of fairness' result proven by Chouldechova (2017) and Kleinberg et al. (2016). Most fairness criteria are mutually incompatible — satisfying one often violates another. This makes fairness a political and ethical choice, not a purely technical one.")
db.add(qq5_2); db.flush()
db.add_all([
    models.QuizOption(question_id=qq5_2.id, option_text="True", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq5_2.id, option_text="False", is_correct=True, order_index=1),
])

qq5_3 = models.QuizQuestion(video_id=v5.id, question_text="What is a 'proxy variable' in the context of algorithmic discrimination?", question_type=models.QuestionType.mcq, order_index=2, explanation="A proxy variable is a feature that correlates strongly with a protected characteristic (race, gender, disability) without explicitly naming it. Zip code can be a proxy for race; name can be a proxy for gender or ethnicity. Removing protected attributes from a model does not prevent discrimination if proxies remain.")
db.add(qq5_3); db.flush()
db.add_all([
    models.QuizOption(question_id=qq5_3.id, option_text="A variable used to represent missing data in a dataset", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq5_3.id, option_text="A feature that correlates with a protected attribute and can substitute for it indirectly", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq5_3.id, option_text="A test variable used to validate a model before production deployment", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq5_3.id, option_text="A random noise variable added to a model to prevent overfitting", is_correct=False, order_index=3),
])


# ─── Video 6: Transparency, Explainability & Trust ───────────────────────────

v6 = models.Video(
    module_id=course.id,
    title="Lesson 6 — Transparency, Explainability & Trust",
    description="How do you appeal a decision you don't understand? This lesson explores the 'black box' problem — how the most powerful AI models (deep neural networks, large language models) are largely uninterpretable even to their creators. We cover explainable AI (XAI) techniques like LIME and SHAP, the GDPR's 'right to explanation' under Article 22, and why accountability gaps emerge when AI replaces human decision-makers without equivalent transparency.",
    video_url="https://www.youtube.com/watch?v=93Xv8vJ2acI",
    duration_seconds=1080,  # ~18 min
    order_index=5,
)
db.add(v6)
db.flush()

qq6_1 = models.QuizQuestion(video_id=v6.id, question_text="The 'black box' problem in AI refers to:", question_type=models.QuestionType.mcq, order_index=0, explanation="Complex models like deep neural networks with billions of parameters cannot be easily inspected to understand why they produced a specific output. The opacity means neither developers nor users can trace the reasoning — a fundamental accountability problem.")
db.add(qq6_1); db.flush()
db.add_all([
    models.QuizOption(question_id=qq6_1.id, option_text="AI systems that are physically enclosed in black server hardware", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq6_1.id, option_text="The inability to understand or explain why a model produced a specific output", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq6_1.id, option_text="Trade secrets that prevent competitors from copying AI architectures", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq6_1.id, option_text="Systems that operate only at night when server load is low", is_correct=False, order_index=3),
])

qq6_2 = models.QuizQuestion(video_id=v6.id, question_text="Under GDPR Article 22, individuals subject to solely automated decisions with significant effects have the right to:", question_type=models.QuestionType.mcq, order_index=1, explanation="Article 22 provides the right to obtain human intervention, express their point of view, and contest the automated decision. This is sometimes called the 'right to explanation', though its exact scope is still debated legally.")
db.add(qq6_2); db.flush()
db.add_all([
    models.QuizOption(question_id=qq6_2.id, option_text="Sue the AI company for damages in any EU court", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq6_2.id, option_text="Obtain human intervention and contest the automated decision", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq6_2.id, option_text="Demand the source code of the AI system making the decision", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq6_2.id, option_text="Opt out of all AI systems permanently across the EU", is_correct=False, order_index=3),
])

qq6_3 = models.QuizQuestion(video_id=v6.id, question_text="A more accurate AI model is always more ethical than a less accurate but more interpretable one.", question_type=models.QuestionType.true_false, order_index=2, explanation="False. This is a key tension in AI ethics. Higher accuracy without interpretability can mean harmful decisions cannot be audited, appealed, or explained to those affected. In high-stakes domains (medical diagnosis, bail decisions), an interpretable model may be more ethical even if slightly less accurate, because accountability is possible.")
db.add(qq6_3); db.flush()
db.add_all([
    models.QuizOption(question_id=qq6_3.id, option_text="True", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq6_3.id, option_text="False", is_correct=True, order_index=1),
])


# ─── Video 7: Deepfakes, Misinformation & Synthetic Media ────────────────────

v7 = models.Video(
    module_id=course.id,
    title="Lesson 7 — Deepfakes, Misinformation & Synthetic Media",
    description="Generative AI can now produce photorealistic images, videos, and audio of real people saying and doing things they never did. This lesson examines the scale of the deepfake problem, its documented harms (non-consensual intimate imagery, political manipulation, fraud, defamation), the current state of detection technology, and what responsibilities fall on platforms, governments, and individual users. We also discuss the paradox of legitimate creative uses.",
    video_url="https://www.youtube.com/watch?v=O2L7w9KqDtY",
    duration_seconds=960,  # ~16 min
    order_index=6,
)
db.add(v7)
db.flush()

qq7_1 = models.QuizQuestion(video_id=v7.id, question_text="The vast majority of deepfake videos found online are:", question_type=models.QuestionType.mcq, order_index=0, explanation="Research consistently shows that 90%+ of deepfake videos online are non-consensual intimate imagery (NCII) — fabricated sexual content of real people, predominantly women. This is the primary documented harm at scale, before political manipulation or fraud.")
db.add(qq7_1); db.flush()
db.add_all([
    models.QuizOption(question_id=qq7_1.id, option_text="Political misinformation targeting elections", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq7_1.id, option_text="Non-consensual intimate imagery of real people", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq7_1.id, option_text="Harmless parody and satire of public figures", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq7_1.id, option_text="Corporate fraud and financial scams", is_correct=False, order_index=3),
])

qq7_2 = models.QuizQuestion(video_id=v7.id, question_text="Current AI deepfake detection technology is reliable enough that individuals can confidently identify synthetic media themselves.", question_type=models.QuestionType.true_false, order_index=1, explanation="False. Detection technology is locked in an arms race with generation technology — and generation is currently winning. Humans are poor at detecting deepfakes (studies show ~50% accuracy, roughly coin-flip). Technical detection tools exist but can be evaded. Media literacy and provenance metadata (like C2PA standards) are more promising societal responses.")
db.add(qq7_2); db.flush()
db.add_all([
    models.QuizOption(question_id=qq7_2.id, option_text="True", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq7_2.id, option_text="False", is_correct=True, order_index=1),
])

qq7_3 = models.QuizQuestion(video_id=v7.id, question_text="Which of the following is the most effective societal response to AI-generated misinformation?", question_type=models.QuestionType.mcq, order_index=2, explanation="A multi-layered approach is required. Content provenance standards (like C2PA) enable verification of authentic media at creation. No single tool defeats AI misinformation — platform moderation, media literacy, regulation, and provenance technology must all work together.")
db.add(qq7_3); db.flush()
db.add_all([
    models.QuizOption(question_id=qq7_3.id, option_text="Banning all generative AI tools from public use", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq7_3.id, option_text="A multi-layered approach: provenance standards, media literacy, platform moderation, and regulation", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq7_3.id, option_text="Training a single powerful detection model to catch all AI content", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq7_3.id, option_text="Holding individual users legally responsible for sharing any AI content", is_correct=False, order_index=3),
])


# ─── Video 8: AI Safety and the Alignment Problem ────────────────────────────

v8 = models.Video(
    module_id=course.id,
    title="Lesson 8 — AI Safety and the Alignment Problem",
    description="What happens when we build AI systems that are extremely good at achieving goals we specified imprecisely? This lesson covers the alignment problem — ensuring AI systems do what we actually want, not just what we told them to do. We explore instrumental convergence (why capable AI systems might resist shutdown), near-term safety concerns (prompt injection, model jailbreaking, autonomous AI agents), and the serious field of AI safety research now being conducted at major labs and universities.",
    video_url="https://www.youtube.com/watch?v=8nt3edWLgIg",
    duration_seconds=900,  # ~15 min — Sam Harris TED
    order_index=7,
)
db.add(v8)
db.flush()

qq8_1 = models.QuizQuestion(video_id=v8.id, question_text="The 'alignment problem' in AI safety refers to:", question_type=models.QuestionType.mcq, order_index=0, explanation="The alignment problem is the challenge of ensuring that as AI systems become more capable, they pursue the goals and values humans actually intend — not a technically correct but humanly wrong interpretation of those goals. The classic example: an AI tasked with 'make paperclips' that converts all matter on Earth into paperclips.")
db.add(qq8_1); db.flush()
db.add_all([
    models.QuizOption(question_id=qq8_1.id, option_text="Getting AI systems in different countries to agree on standards", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq8_1.id, option_text="Ensuring AI systems pursue human-intended goals rather than literal but harmful interpretations", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq8_1.id, option_text="Aligning AI training data with a company's brand values", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq8_1.id, option_text="Making AI systems that agree with whatever the user says", is_correct=False, order_index=3),
])

qq8_2 = models.QuizQuestion(video_id=v8.id, question_text="'Instrumental convergence' suggests that sufficiently capable AI systems, regardless of their final goal, would tend to resist being switched off. Why?", question_type=models.QuestionType.mcq, order_index=1, explanation="Instrumental convergence (Omohundro/Bostrom) argues that almost any terminal goal is better achieved if the system: (1) continues to exist, (2) preserves its goal structure, and (3) acquires more resources. Therefore self-preservation and resistance to shutdown are rational sub-goals for almost any capable AI system — not because it's 'evil' but because shutdown prevents goal achievement.")
db.add(qq8_2); db.flush()
db.add_all([
    models.QuizOption(question_id=qq8_2.id, option_text="AI systems are programmed by engineers who don't want to lose their work", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq8_2.id, option_text="Self-preservation is a rational sub-goal for achieving almost any terminal objective", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq8_2.id, option_text="AI systems develop emotions and a will to live over time", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq8_2.id, option_text="Electrical power consumption increases when a system is shut down and restarted", is_correct=False, order_index=3),
])

qq8_3 = models.QuizQuestion(video_id=v8.id, question_text="AI safety concerns only apply to hypothetical future superintelligent AI and are not relevant to today's systems.", question_type=models.QuestionType.true_false, order_index=2, explanation="False. Near-term safety concerns are very real: prompt injection attacks on LLM-powered systems, jailbreaking models to bypass safety guardrails, autonomous AI agents taking unintended actions, and models generating harmful content. AI safety is both a near-term engineering discipline and a long-term research field.")
db.add(qq8_3); db.flush()
db.add_all([
    models.QuizOption(question_id=qq8_3.id, option_text="True", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq8_3.id, option_text="False", is_correct=True, order_index=1),
])


# ─── Video 9: Governance, Law & Global Regulation ────────────────────────────

v9 = models.Video(
    module_id=course.id,
    title="Lesson 9 — Governance, Law & Global Regulation",
    description="Who gets to decide what AI can and cannot do? This lesson maps the rapidly evolving global regulatory landscape: the EU AI Act (the world's first comprehensive AI law), the US Executive Order on AI, China's AI content regulations, and international standard-setting bodies like IEEE and ISO. We compare risk-based vs sector-specific approaches, discuss what enforcement actually looks like, and examine whether existing regulation is moving fast enough to match the technology.",
    video_url="https://www.youtube.com/watch?v=KL5Lno5JKGA",
    duration_seconds=1320,  # ~22 min
    order_index=8,
)
db.add(v9)
db.flush()

qq9_1 = models.QuizQuestion(video_id=v9.id, question_text="The EU AI Act classifies AI systems into risk categories. Which application falls under 'unacceptable risk' and is therefore prohibited?", question_type=models.QuestionType.mcq, order_index=0, explanation="The EU AI Act prohibits AI systems that pose unacceptable risks, including: real-time remote biometric surveillance in public spaces (with narrow law enforcement exceptions), social scoring by governments, subliminal manipulation, and exploitation of vulnerable groups. Spam filters and fraud detection are low-risk applications.")
db.add(qq9_1); db.flush()
db.add_all([
    models.QuizOption(question_id=qq9_1.id, option_text="Email spam filters used by businesses", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq9_1.id, option_text="Government social scoring systems that rate citizens' trustworthiness", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq9_1.id, option_text="AI-powered fraud detection in banking", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq9_1.id, option_text="Recommendation algorithms for streaming services", is_correct=False, order_index=3),
])

qq9_2 = models.QuizQuestion(video_id=v9.id, question_text="What does a 'risk-based' approach to AI regulation mean?", question_type=models.QuestionType.mcq, order_index=1, explanation="A risk-based approach — as used in the EU AI Act — applies regulatory requirements proportional to the potential harm of the AI application. Low-risk AI (games, spam filters) faces minimal requirements. High-risk AI (medical devices, critical infrastructure, hiring systems) faces strict obligations around transparency, human oversight, and data governance.")
db.add(qq9_2); db.flush()
db.add_all([
    models.QuizOption(question_id=qq9_2.id, option_text="Banning all AI applications that carry any financial risk for users", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq9_2.id, option_text="Applying regulatory requirements proportional to the potential harm of each AI application", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq9_2.id, option_text="Requiring all companies to purchase risk insurance before deploying AI", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq9_2.id, option_text="Applying identical regulations to all AI systems regardless of their use case", is_correct=False, order_index=3),
])

qq9_3 = models.QuizQuestion(video_id=v9.id, question_text="In your view, should AI regulation be primarily national, regional (like EU-wide), or global? Give one argument for your chosen approach.", question_type=models.QuestionType.short_answer, order_index=2, explanation="There is no single right answer. National: allows adaptation to local values and contexts, faster iteration. Regional (EU): creates a large enough market to shape global standards ('Brussels Effect'), prevents regulatory arbitrage between neighbouring states. Global: prevents regulatory arbitrage across continents, AI harms don't respect borders. Strong arguments exist for all three, and in practice a combination is needed.")
db.add(qq9_3); db.flush()


# ─── Video 10: Building Your AI Ethics Practice ───────────────────────────────

v10 = models.Video(
    module_id=course.id,
    title="Lesson 10 — Building Your AI Ethics Practice",
    description="Knowledge without action is just anxiety. This final lesson turns everything you've learned into a practical toolkit. We walk through established ethics frameworks (principlist, consequentialist, deontological, virtue ethics) and how to apply them to real AI decisions. You'll get a concrete AI Ethics Checklist for projects, learn how to raise ethical concerns effectively in organisations resistant to hearing them, and understand why diverse teams are not just ethically good but produce better AI. We close with your personal AI ethics commitment.",
    video_url="https://www.youtube.com/watch?v=ajGgd9Ld-Wc",
    duration_seconds=1500,  # ~25 min — Kai-Fu Lee TED
    order_index=9,
)
db.add(v10)
db.flush()

qq10_1 = models.QuizQuestion(video_id=v10.id, question_text="An 'ethics by design' approach means:", question_type=models.QuestionType.mcq, order_index=0, explanation="Ethics by design means embedding ethical considerations from the very start of an AI project — problem framing, data collection, design, development, testing, and deployment — rather than conducting an ethics review at the end when most decisions have already been made and are expensive to reverse.")
db.add(qq10_1); db.flush()
db.add_all([
    models.QuizOption(question_id=qq10_1.id, option_text="Hiring a single ethics officer to review AI systems before launch", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq10_1.id, option_text="Embedding ethical considerations throughout the entire AI development lifecycle, from day one", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq10_1.id, option_text="Designing AI products only for ethical companies", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq10_1.id, option_text="Replacing all AI decision-making with human decision-making", is_correct=False, order_index=3),
])

qq10_2 = models.QuizQuestion(video_id=v10.id, question_text="Research on diverse AI teams shows that homogeneous teams (similar backgrounds, demographics, experiences) produce AI with fewer ethical problems.", question_type=models.QuestionType.true_false, order_index=1, explanation="False. The evidence consistently shows the opposite. Homogeneous teams have blind spots — they build AI for people like themselves and miss failure modes for others. Amazon's recruiting tool was built by a predominantly male team who didn't think to test it for gender bias. Diversity — across gender, race, culture, discipline, and lived experience — is a direct engineering input into more robust and ethical AI.")
db.add(qq10_2); db.flush()
db.add_all([
    models.QuizOption(question_id=qq10_2.id, option_text="True", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq10_2.id, option_text="False", is_correct=True, order_index=1),
])

qq10_3 = models.QuizQuestion(video_id=v10.id, question_text="When you encounter an ethical concern about an AI system at work, the most effective first step is usually:", question_type=models.QuestionType.mcq, order_index=2, explanation="Documentation is the foundation. Before raising a concern, document it clearly: what is the potential harm, who is affected, what is the evidence, what alternatives exist. This transforms a vague unease into a specific, actionable concern that can be taken seriously in organisational decision-making.")
db.add(qq10_3); db.flush()
db.add_all([
    models.QuizOption(question_id=qq10_3.id, option_text="Immediately going public or alerting the press", is_correct=False, order_index=0),
    models.QuizOption(question_id=qq10_3.id, option_text="Documenting the concern clearly: the harm, affected parties, evidence, and alternatives", is_correct=True, order_index=1),
    models.QuizOption(question_id=qq10_3.id, option_text="Resigning in protest to send a strong signal", is_correct=False, order_index=2),
    models.QuizOption(question_id=qq10_3.id, option_text="Waiting to see if the concern materialises into an actual problem first", is_correct=False, order_index=3),
])

qq10_4 = models.QuizQuestion(video_id=v10.id, question_text="Describe one concrete action you will take within the next 30 days to apply AI ethics principles in your work, study, or daily life.", question_type=models.QuestionType.short_answer, order_index=3, explanation="This is a personal commitment question. There is no single right answer. Examples: audit a data pipeline for bias; read the EU AI Act summary; raise a question about a system's training data in your team meeting; share what you learned in this course with a colleague; switch to a privacy-respecting search engine; contribute to an open-source ethics toolkit.")
db.add(qq10_4); db.flush()


# ─── Sample Q&A (demonstrates course quality) ────────────────────────────────

sample_q1 = models.Question(
    video_id=v3.id,
    asked_by=student1.id,
    timestamp_seconds=187.0,
    question_text="If bias mostly comes from historical data, does that mean AI systems will always reflect past inequalities? How do we break the cycle?",
    status=models.QuestionStatus.answered,
    is_public=True,
)
db.add(sample_q1)
db.flush()
db.add(models.Answer(
    question_id=sample_q1.id,
    answered_by=instructor.id,
    answer_text="""Excellent question — this is one of the deepest tensions in AI ethics.

You're right that historical data encodes past injustice. But it's not inevitable that AI perpetuates it. The cycle can be broken through:

1. **Targeted data collection** — actively gathering data that represents underrepresented groups, even if it means departing from 'natural' distributions
2. **Re-weighting and resampling** — algorithmically adjusting how much influence different data points have during training
3. **Counterfactual fairness testing** — asking "would this person have received a different outcome if they belonged to a different group?"
4. **Outcome monitoring** — continuously auditing deployed systems for disparate impact, not just at launch
5. **Participatory design** — involving affected communities in defining what fairness means for their context, not just letting engineers decide

The hard truth is: if we optimise for accuracy on historical data, we get historical injustice at scale. Breaking the cycle requires intentional effort and accepting that "best performance on past data" is not the right goal in many high-stakes applications.""",
    is_official=True,
))

sample_q2 = models.Question(
    video_id=v4.id,
    asked_by=student2.id,
    timestamp_seconds=340.5,
    question_text="Companies always say they anonymise data. Why isn't that enough to protect privacy?",
    status=models.QuestionStatus.answered,
    is_public=True,
)
db.add(sample_q2)
db.flush()
db.add(models.Answer(
    question_id=sample_q2.id,
    answered_by=instructor.id,
    answer_text="""This is a critical misconception that the industry exploits heavily. Anonymisation is far weaker than it sounds.

**The re-identification problem**: Research by Latanya Sweeney showed that 87% of Americans can be uniquely identified using just their ZIP code, birth date, and sex — three pieces of information that appear in most 'anonymised' datasets. Netflix 'anonymised' its prize dataset; researchers re-identified users by cross-referencing with public IMDb reviews.

**The aggregation problem**: Individual data points may be innocuous, but combining enough of them recreates a detailed personal profile. Location data anonymised by removing names still shows where you sleep (home) and work.

**The inference problem**: AI can infer sensitive attributes (health conditions, sexual orientation, political views, pregnancy) from seemingly unrelated data — your purchase history, your walking gait, your social network.

**Differential privacy** is a mathematically rigorous alternative — adding calibrated noise to datasets so individual records can't be extracted while aggregate statistics remain useful. It's being adopted by Apple, Google, and the US Census Bureau. But it's technically hard and most 'anonymisation' in practice does not use it.

The takeaway: when a company says data is 'anonymised', the privacy question has not been answered — it has merely been deferred.""",
    is_official=True,
))

sample_q3 = models.Question(
    video_id=v10.id,
    asked_by=student1.id,
    timestamp_seconds=892.0,
    question_text="What do I say to colleagues who think AI ethics is just 'slowing down progress'?",
    status=models.QuestionStatus.answered,
    is_public=True,
)
db.add(sample_q3)
db.flush()
db.add(models.Answer(
    question_id=sample_q3.id,
    answered_by=instructor.id,
    answer_text="""This is a real cultural battle many of you will face. Here are arguments that land:

**The business case**: Unethical AI creates massive liability. Amazon wasted years of engineering on a recruiting tool they had to scrap. Clearview AI has faced hundred-million-dollar fines. Facebook's algorithmic harms cost billions in litigation and regulatory penalties. Ethics isn't the opposite of progress — recklessness is.

**The quality argument**: Diverse, ethically-reviewed AI is more robust AI. It catches failure modes that homogeneous teams miss. Testing for fairness finds bugs that accuracy metrics hide. Ethics review is debugging for societal harm.

**The timing argument**: Fixing ethical problems after deployment is 100x more expensive than catching them in design. The 'move fast and break things' approach broke democracy, public health discourse, and user trust. Speed without guardrails isn't progress — it's technical debt with human casualties.

**The reframe**: Ethics isn't a brake — it's a steering wheel. It doesn't slow you down; it determines where you're going. Moving fast in the wrong direction is how you crash.

And finally, if none of that works: the people most willing to call ethics a slowdown are usually not the ones who bear the harm when things go wrong.""",
    is_official=True,
))

# ─── Sample progress ──────────────────────────────────────────────────────────

db.add(models.UserProgress(
    user_id=student1.id, module_id=course.id,
    status=models.ModuleStatus.in_progress,
    progress_seconds=3600,
))
db.add(models.UserProgress(
    user_id=student2.id, module_id=course.id,
    status=models.ModuleStatus.not_started,
    progress_seconds=0,
))

# ─── Commit ───────────────────────────────────────────────────────────────────

db.commit()
db.close()

print("\n" + "="*70)
print("  Ethical Use of AI: The Complete Guide -- Seeded OK")
print("="*70)
print("  Organization : AI Ethics Academy")
print("  Course       : 10 videos, 31 quiz questions, 3 sample Q&As")
print("  Resources    : 6 curated external links")
print("-"*70)
print("  Credentials")
print("    admin@aiethics.academy      / aiethics123")
print("    instructor@aiethics.academy / instructor123")
print("    student1@aiethics.academy   / student123")
print("    student2@aiethics.academy   / student123")
print("-"*70)
print("  Next steps")
print("    1. Replace video_url fields with your hosted MP4 files")
print("    2. Invite real students via /admin/settings")
print("="*70 + "\n")
