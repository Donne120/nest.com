"""
Pytest configuration for assignment workflow tests.

Ensures the app imports work from the backend directory and
cleans up the test SQLite file after the session ends.
"""
import sys
import os
import pytest

# Make sure `import models`, `import auth`, etc. resolve to the backend root
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_db():
    yield
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_assignments.db")
    if os.path.exists(db_path):
        os.remove(db_path)
