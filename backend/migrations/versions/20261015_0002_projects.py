"""Create public projects table.

Revision ID: 20261015_0002
Revises: 20261015_0001
Create Date: 2026-10-15
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261015_0002"
down_revision: str | None = "20261015_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(length=140), nullable=False),
        sa.Column("number", sa.String(length=8), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("image_alt", sa.String(length=300), nullable=True),
        sa.Column("short_description", sa.String(length=500), nullable=False),
        sa.Column("brief", sa.Text(), nullable=False),
        sa.Column("scope", sa.Text(), nullable=False),
        sa.Column("client", sa.String(length=200), nullable=True),
        sa.Column("location", sa.String(length=200), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("completion_date", sa.Date(), nullable=True),
        sa.Column("featured", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("slug", name="uq_projects_slug"),
    )
    op.create_index("ix_projects_slug", "projects", ["slug"])
    op.create_index("ix_projects_category", "projects", ["category"])
    op.create_index("ix_projects_featured", "projects", ["featured"])
    op.create_index("ix_projects_sort_order", "projects", ["sort_order"])
    op.create_index("ix_projects_is_published", "projects", ["is_published"])


def downgrade() -> None:
    op.drop_index("ix_projects_is_published", table_name="projects")
    op.drop_index("ix_projects_sort_order", table_name="projects")
    op.drop_index("ix_projects_featured", table_name="projects")
    op.drop_index("ix_projects_category", table_name="projects")
    op.drop_index("ix_projects_slug", table_name="projects")
    op.drop_table("projects")