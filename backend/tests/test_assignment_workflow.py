"""
Simulation tests for the group assignment workflow:

  Stage 1 — Write Your Portion   (each member saves a draft)
  Stage 2 — Portion Submitted    (each member submits their portion)
  Stage 3 — Team Merging         (auto-merge fires after last submission)
  Stage 4 — Review & Submit      (group submits merged doc to instructor)

Run with:
    cd backend
    pytest tests/test_assignment_workflow.py -v -s
"""

import sys
import os

# Ensure backend root is on the path before any app imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# --- Isolated in-memory DB (StaticPool = single shared connection, always fresh)

from database import Base, get_db
import models  # registers all ORM tables

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


from main import app  # noqa: E402

app.dependency_overrides[get_db] = override_get_db

# --- Module-level fixtures ----------------------------------------------------

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


# --- Shared state across all test classes (module scope) ---------------------

shared: dict = {}

# --- Helpers ------------------------------------------------------------------

def _make_content(text: str) -> dict:
    return {
        "type": "doc",
        "content": [{"type": "paragraph", "content": [{"type": "text", "text": text}]}],
    }


def _extract_text(node, buf=None) -> str:
    """Recursively pull all text from a TipTap JSON document."""
    if buf is None:
        buf = []
    if isinstance(node, dict):
        if node.get("type") == "text":
            buf.append(node.get("text", ""))
        for child in node.get("content") or []:
            _extract_text(child, buf)
    elif isinstance(node, list):
        for item in node:
            _extract_text(item, buf)
    return " ".join(buf)


def _create_user(email: str, role: str, org_id: str) -> dict:
    """Insert user directly into DB, return id + Bearer headers."""
    from auth import hash_password, create_access_token
    db = TestingSession()
    user = models.User(
        organization_id=org_id,
        email=email,
        full_name=email.split("@")[0].replace(".", " ").title(),
        hashed_password=hash_password("Test1234!"),
        role=getattr(models.UserRole, role),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.id, "org_id": org_id})
    db.close()
    return {"user_id": user.id, "headers": {"Authorization": f"Bearer {token}"}}


def _create_org() -> str:
    db = TestingSession()
    org = models.Organization(
        name="Nest Academy",
        slug="nest-academy",
        plan=models.Plan.professional,
        subscription_status=models.SubscriptionStatus.active,
        is_active=True,
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    oid = org.id
    db.close()
    return oid


# ===============================================================================
#  SETUP
# ===============================================================================

class TestSetup:
    def test_01_create_org_and_users(self, client):
        oid = _create_org()
        shared["org_id"] = oid
        shared["educator"] = _create_user("tutor@nest.test", "educator", oid)
        shared["alice"]    = _create_user("alice@nest.test",  "learner",  oid)
        shared["bob"]      = _create_user("bob@nest.test",    "learner",  oid)
        shared["carol"]    = _create_user("carol@nest.test",  "learner",  oid)
        print(f"\n  OK Org={oid[:8]}...  educator + 3 learners created")

    def test_02_create_group_assignment(self, client):
        r = client.post("/api/assignments", json={
            "title": "AI Ethics Research",
            "description": "<p>Group research on AI ethics.</p>",
            "type": "group",
            "max_group_size": 3,
            "portions": ["Introduction", "Analysis", "Conclusion"],
            "deadline": "2099-12-31T23:59:59Z",
        }, headers=shared["educator"]["headers"])
        assert r.status_code == 201, r.text
        a = r.json()
        shared["assignment_id"] = a["id"]
        assert a["status"] == "draft"
        assert a["portions"] == ["Introduction", "Analysis", "Conclusion"]
        print(f"  OK Assignment created (id={a['id'][:8]}...) — status=draft")

    def test_03_activate_forms_groups(self, client):
        r = client.post(
            f"/api/assignments/{shared['assignment_id']}/activate",
            headers=shared["educator"]["headers"],
        )
        assert r.status_code == 200, r.text
        a = r.json()
        assert a["status"] == "active"
        assert a["group_count"] == 1   # 3 learners, max_group_size=3 → 1 group
        print(f"  OK Activated — {a['group_count']} group formed")

    def test_04_each_learner_in_group_with_distinct_portion(self, client):
        portions_seen = set()
        for name in ("alice", "bob", "carol"):
            r = client.get(
                f"/api/assignments/{shared['assignment_id']}/my-group",
                headers=shared[name]["headers"],
            )
            assert r.status_code == 200, f"{name}: {r.text}"
            g = r.json()
            shared[f"{name}_group_id"] = g["id"]
            m = next(x for x in g["members"] if x["learner_id"] == shared[name]["user_id"])
            shared[f"{name}_portion"] = m["portion_label"]
            portions_seen.add(m["portion_label"])
            print(f"  OK {name.title()} → '{m['portion_label']}'")

        # All three in the same group
        assert shared["alice_group_id"] == shared["bob_group_id"] == shared["carol_group_id"]
        shared["group_id"] = shared["alice_group_id"]
        # All portions distinct
        assert portions_seen == {"Introduction", "Analysis", "Conclusion"}


# ===============================================================================
#  STAGE 1 — Write Your Portion
# ===============================================================================

class TestStage1WritePortion:
    def test_10_alice_saves_draft(self, client):
        print("\n\n-- STAGE 1: Write Your Portion --")
        content = _make_content(
            "Introduction: AI ethics is the study of moral issues in artificial intelligence."
        )
        r = client.put(
            f"/api/assignments/{shared['assignment_id']}/my-submission",
            json={"content": content, "word_count": 0, "submit": False},
            headers=shared["alice"]["headers"],
        )
        assert r.status_code == 200, r.text
        sub = r.json()
        assert sub["status"] == "draft"
        assert sub["submitted_at"] is None
        shared["alice_content"] = content
        print(f"  OK Alice saved draft — status=draft")

    def test_11_bob_saves_draft(self, client):
        content = _make_content(
            "Analysis: We examine three key AI ethics frameworks in depth."
        )
        r = client.put(
            f"/api/assignments/{shared['assignment_id']}/my-submission",
            json={"content": content, "word_count": 0, "submit": False},
            headers=shared["bob"]["headers"],
        )
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "draft"
        shared["bob_content"] = content
        print(f"  OK Bob saved draft — status=draft")

    def test_12_carol_saves_draft(self, client):
        content = _make_content(
            "Conclusion: Responsible AI requires collective global action and policy."
        )
        r = client.put(
            f"/api/assignments/{shared['assignment_id']}/my-submission",
            json={"content": content, "word_count": 0, "submit": False},
            headers=shared["carol"]["headers"],
        )
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "draft"
        shared["carol_content"] = content
        print(f"  OK Carol saved draft — status=draft")

    def test_13_draft_persists_and_is_fetchable(self, client):
        r = client.get(
            f"/api/assignments/{shared['assignment_id']}/my-submission",
            headers=shared["alice"]["headers"],
        )
        assert r.status_code == 200
        sub = r.json()
        assert sub["status"] == "draft"
        assert sub["content"] is not None
        text = _extract_text(sub["content"])
        assert "Introduction" in text
        print(f"  OK Alice's draft persisted — content readable")

    def test_14_merged_doc_not_available_during_drafting(self, client):
        r = client.get(
            f"/api/assignments/{shared['assignment_id']}/merged",
            headers=shared["alice"]["headers"],
        )
        assert r.status_code == 400
        assert "not ready" in r.json()["detail"].lower()
        print(f"  OK /merged returns 400 while everyone is still drafting — correct")


# ===============================================================================
#  STAGE 2 — Portion Submitted
# ===============================================================================

class TestStage2PortionSubmitted:
    def test_20_alice_submits(self, client):
        print("\n\n-- STAGE 2: Portion Submitted --")
        r = client.put(
            f"/api/assignments/{shared['assignment_id']}/my-submission",
            json={"content": shared["alice_content"], "word_count": 0, "submit": True},
            headers=shared["alice"]["headers"],
        )
        assert r.status_code == 200, r.text
        sub = r.json()
        assert sub["status"] == "submitted"
        assert sub["submitted_at"] is not None
        print(f"  OK Alice submitted — status=submitted, submitted_at set")

    def test_21_merged_still_blocked_after_one_submit(self, client):
        r = client.get(
            f"/api/assignments/{shared['assignment_id']}/merged",
            headers=shared["alice"]["headers"],
        )
        assert r.status_code == 400
        print(f"  OK /merged still 400 — only 1/3 submitted")

    def test_22_group_shows_partial_merge_status(self, client):
        r = client.get(
            f"/api/assignments/{shared['assignment_id']}/my-group",
            headers=shared["alice"]["headers"],
        )
        assert r.status_code == 200
        g = r.json()
        assert g["merge_status"] == "partial", \
            f"Expected 'partial' after 1 submission, got '{g['merge_status']}'"
        alice_m = next(m for m in g["members"] if m["learner_id"] == shared["alice"]["user_id"])
        bob_m   = next(m for m in g["members"] if m["learner_id"] == shared["bob"]["user_id"])
        assert alice_m["submitted_at"] is not None
        assert bob_m["submitted_at"] is None
        print(f"  OK merge_status=partial — Alice OK, Bob ○, Carol ○")

    def test_23_bob_submits(self, client):
        r = client.put(
            f"/api/assignments/{shared['assignment_id']}/my-submission",
            json={"content": shared["bob_content"], "word_count": 0, "submit": True},
            headers=shared["bob"]["headers"],
        )
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "submitted"
        print(f"  OK Bob submitted — 2/3 done")

    def test_24_alice_can_re_edit_before_deadline(self, client):
        """Deadline is 2099 — re-editing a submitted portion must be allowed."""
        revised = _make_content(
            "Introduction (revised): AI ethics is the comprehensive study of "
            "moral challenges arising from artificial intelligence systems."
        )
        r = client.put(
            f"/api/assignments/{shared['assignment_id']}/my-submission",
            json={"content": revised, "word_count": 0, "submit": True},
            headers=shared["alice"]["headers"],
        )
        assert r.status_code == 200, r.text
        sub = r.json()
        assert sub["status"] == "submitted"
        shared["alice_content"] = revised
        print(f"  OK Alice re-edited and re-submitted — allowed (deadline 2099)")

    def test_25_carol_submits_last(self, client):
        r = client.put(
            f"/api/assignments/{shared['assignment_id']}/my-submission",
            json={"content": shared["carol_content"], "word_count": 0, "submit": True},
            headers=shared["carol"]["headers"],
        )
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "submitted"
        print(f"  OK Carol submitted — all 3/3 done OK Auto-merge should have fired")


# ===============================================================================
#  STAGE 3 — Team Merging
# ===============================================================================

class TestStage3TeamMerging:
    def test_30_merge_status_complete(self, client):
        print("\n\n-- STAGE 3: Team Merging --")
        r = client.get(
            f"/api/assignments/{shared['assignment_id']}/my-group",
            headers=shared["alice"]["headers"],
        )
        assert r.status_code == 200
        g = r.json()
        assert g["merge_status"] == "complete", \
            f"Expected 'complete' after all 3 submitted, got '{g['merge_status']}'"
        print(f"  OK merge_status=complete — auto-merge fired successfully")

    def test_31_review_meeting_auto_scheduled(self, client):
        r = client.get(
            f"/api/assignments/{shared['assignment_id']}/my-group",
            headers=shared["alice"]["headers"],
        )
        g = r.json()
        assert g["review_meeting_id"] is not None, \
            "Review meeting must be auto-scheduled after merge"
        print(f"  OK Review meeting scheduled: id={g['review_meeting_id'][:8]}...")

    def test_32_merged_doc_now_accessible(self, client):
        r = client.get(
            f"/api/assignments/{shared['assignment_id']}/merged",
            headers=shared["alice"]["headers"],
        )
        assert r.status_code == 200, r.text
        g = r.json()
        assert g["merged_document"] is not None
        doc = g["merged_document"]
        assert doc["type"] == "doc"
        shared["merged_doc"] = doc
        nodes = doc.get("content", [])
        print(f"  OK Merged doc accessible — {len(nodes)} top-level nodes")

    def test_33_merged_doc_contains_all_portions_in_order(self, client):
        doc = shared["merged_doc"]
        full_text = _extract_text(doc)

        # Section headings (from _build_merged_document)
        assert "Introduction" in full_text, "Missing Introduction heading"
        assert "Analysis"     in full_text, "Missing Analysis heading"
        assert "Conclusion"   in full_text, "Missing Conclusion heading"

        # Actual content — Alice's revised text
        assert "comprehensive study" in full_text, "Alice's revised content missing"
        assert "three key AI ethics" in full_text, "Bob's content missing"
        assert "collective global action" in full_text, "Carol's content missing"

        # Verify order: Introduction should appear before Analysis
        intro_pos   = full_text.index("Introduction")
        analysis_pos = full_text.index("Analysis")
        concl_pos   = full_text.index("Conclusion")
        assert intro_pos < analysis_pos < concl_pos, \
            "Sections not in correct portion order"

        print(f"  OK All 3 portions present in correct order")
        print(f"    Preview: ...{full_text[50:180]}...")

    def test_34_all_members_see_same_merged_doc(self, client):
        texts = []
        for name in ("alice", "bob", "carol"):
            r = client.get(
                f"/api/assignments/{shared['assignment_id']}/merged",
                headers=shared[name]["headers"],
            )
            assert r.status_code == 200, f"{name}: {r.text}"
            texts.append(_extract_text(r.json()["merged_document"]))

        assert texts[0] == texts[1] == texts[2], \
            "All members must see identical merged document"
        print(f"  OK All 3 members see the same merged document")

    def test_35_educator_sees_three_submissions(self, client):
        r = client.get(
            f"/api/assignments/{shared['assignment_id']}",
            headers=shared["educator"]["headers"],
        )
        assert r.status_code == 200
        assert r.json()["submission_count"] == 3
        print(f"  OK Educator: submission_count=3")

    def test_36_my_assignments_shows_review_ready_status(self, client):
        r = client.get("/api/assignments/my", headers=shared["alice"]["headers"])
        assert r.status_code == 200
        items = r.json()
        a = next((x for x in items if x["id"] == shared["assignment_id"]), None)
        assert a is not None
        assert a["my_submission_status"] == "submitted"
        assert a["my_group_merge_status"] == "complete"
        print(f"  OK /my: my_submission_status=submitted, my_group_merge_status=complete")


# ===============================================================================
#  STAGE 4 — Review & Submit
# ===============================================================================

class TestStage4ReviewAndSubmit:
    def test_40_alice_submits_to_instructor(self, client):
        print("\n\n-- STAGE 4: Review & Submit --")
        r = client.post(
            f"/api/assignments/{shared['assignment_id']}/my-group/submit",
            headers=shared["alice"]["headers"],
        )
        assert r.status_code == 200, r.text
        g = r.json()
        assert g["final_submitted_at"] is not None
        print(f"  OK Merged doc submitted to instructor at {g['final_submitted_at']}")

    def test_41_double_submit_blocked(self, client):
        r = client.post(
            f"/api/assignments/{shared['assignment_id']}/my-group/submit",
            headers=shared["bob"]["headers"],
        )
        assert r.status_code == 400
        assert "already submitted" in r.json()["detail"].lower()
        print(f"  OK Double-submit blocked — 400 returned")

    def test_42_educator_sees_final_submission(self, client):
        r = client.get(
            f"/api/assignments/{shared['assignment_id']}/groups",
            headers=shared["educator"]["headers"],
        )
        assert r.status_code == 200
        groups = r.json()
        assert len(groups) == 1
        g = groups[0]
        assert g["final_submitted_at"] is not None
        assert g["merge_status"] == "complete"
        print(f"  OK Educator sees group with final_submitted_at set")

    def test_43_educator_leaves_feedback(self, client):
        gid = shared["group_id"]
        r = client.post(
            f"/api/assignments/{shared['assignment_id']}/groups/{gid}/feedback",
            json={"feedback": "Excellent work! The analysis section was particularly strong."},
            headers=shared["educator"]["headers"],
        )
        assert r.status_code == 200, r.text
        g = r.json()
        assert "Excellent" in g["instructor_feedback"]
        print(f"  OK Feedback saved: '{g['instructor_feedback'][:55]}...'")

    def test_44_all_learners_can_read_feedback(self, client):
        for name in ("alice", "bob", "carol"):
            r = client.get(
                f"/api/assignments/{shared['assignment_id']}/merged",
                headers=shared[name]["headers"],
            )
            assert r.status_code == 200
            g = r.json()
            assert g["instructor_feedback"] is not None
            assert "Excellent" in g["instructor_feedback"]
        print(f"  OK All 3 learners can read instructor feedback")

    def test_45_my_assignments_shows_final_submitted(self, client):
        r = client.get("/api/assignments/my", headers=shared["carol"]["headers"])
        assert r.status_code == 200
        items = r.json()
        a = next((x for x in items if x["id"] == shared["assignment_id"]), None)
        assert a is not None
        assert a["my_submission_status"] == "submitted"
        assert a["my_group_merge_status"] == "final_submitted"
        print(f"  OK /my: my_group_merge_status=final_submitted")

    def test_46_summary(self, client):
        print("\n\n" + "=" * 60)
        print("  ALL STAGES PASSED OK")
        print("=" * 60)
        print("  Stage 1 — Write Your Portion  : Alice, Bob, Carol saved drafts")
        print("  Stage 2 — Portion Submitted   : All 3 submitted; Alice re-edited OK")
        print("  Stage 3 — Team Merging        : Auto-merge fired; review meeting scheduled")
        print("  Stage 4 — Review & Submit     : Submitted to instructor; feedback visible")
        print("=" * 60)
