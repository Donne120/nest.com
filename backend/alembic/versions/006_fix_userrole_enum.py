"""Fix userrole enum to support new role names

Revision ID: 006_fix_userrole_enum
Revises: 005_assignments
Create Date: 2026-03-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006_fix_userrole_enum'
down_revision = '005_assignments'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop existing enum values and recreate with new ones
    # PostgreSQL enums cannot be modified in-place, so we must:
    # 1. Rename the old enum
    # 2. Create new enum with new values
    # 3. Cast columns to use new enum
    # 4. Drop old enum

    op.execute("ALTER TYPE userrole RENAME TO userrole_old")

    op.execute("""
        CREATE TYPE userrole AS ENUM (
            'learner',
            'educator',
            'owner',
            'super_admin'
        )
    """)

    # Update all columns that use the old enum
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN role TYPE userrole USING role::text::userrole
    """)

    op.execute("""
        ALTER TABLE organizations
        ALTER COLUMN default_role TYPE userrole USING default_role::text::userrole
    """)

    # Drop old enum
    op.execute("DROP TYPE userrole_old")


def downgrade() -> None:
    # Downgrade would revert to old roles - not recommended for production
    # but included for completeness
    op.execute("ALTER TYPE userrole RENAME TO userrole_new")

    op.execute("""
        CREATE TYPE userrole AS ENUM (
            'manager',
            'admin',
            'employee',
            'super_admin'
        )
    """)

    op.execute("""
        ALTER TABLE users
        ALTER COLUMN role TYPE userrole USING role::text::userrole
    """)

    op.execute("""
        ALTER TABLE organizations
        ALTER COLUMN default_role TYPE userrole USING default_role::text::userrole
    """)

    op.execute("DROP TYPE userrole_new")
