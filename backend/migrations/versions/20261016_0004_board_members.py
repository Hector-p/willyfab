"""Create board members table.

Revision ID: 20261016_0004
Revises: 20261015_0003
Create Date: 2026-10-16
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261016_0004"
down_revision: str | None = "20261015_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "board_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("position", sa.String(length=160), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("image_alt", sa.String(length=300), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_board_members_sort_order", "board_members", ["sort_order"])
    op.create_index("ix_board_members_is_published", "board_members", ["is_published"])


def downgrade() -> None:
    op.drop_index("ix_board_members_is_published", table_name="board_members")
    op.drop_index("ix_board_members_sort_order", table_name="board_members")
    op.drop_table("board_members")
