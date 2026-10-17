"""Create public inquiries table.

Revision ID: 20261015_0003
Revises: 20261015_0002
Create Date: 2026-10-15
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261015_0003"
down_revision: str | None = "20261015_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "inquiries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("company", sa.String(length=160), nullable=True),
        sa.Column("service_interest", sa.String(length=120), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_inquiries_email", "inquiries", ["email"])


def downgrade() -> None:
    op.drop_index("ix_inquiries_email", table_name="inquiries")
    op.drop_table("inquiries")
