"""Create public services table.

Revision ID: 20261015_0001
Revises:
Create Date: 2026-10-15
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261015_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "services",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("number", sa.String(length=8), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("capacity", sa.String(length=100), nullable=True),
        sa.Column("summary", sa.String(length=500), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("slug", name="uq_services_slug"),
    )
    op.create_index("ix_services_slug", "services", ["slug"])
    op.create_index("ix_services_category", "services", ["category"])
    op.create_index("ix_services_sort_order", "services", ["sort_order"])
    op.create_index("ix_services_is_published", "services", ["is_published"])


def downgrade() -> None:
    op.drop_index("ix_services_is_published", table_name="services")
    op.drop_index("ix_services_sort_order", table_name="services")
    op.drop_index("ix_services_category", table_name="services")
    op.drop_index("ix_services_slug", table_name="services")
    op.drop_table("services")