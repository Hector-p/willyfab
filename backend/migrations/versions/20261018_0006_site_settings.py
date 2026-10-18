"""Create site settings with maintenance mode.

Revision ID: 20261018_0006
Revises: 20261017_0005
Create Date: 2026-10-18
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261018_0006"
down_revision: str | None = "20261017_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DEFAULT_MESSAGE = "Site under maintainance, Check back later"


def upgrade() -> None:
    op.create_table(
        "site_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("maintenance_mode", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "maintenance_message",
            sa.String(length=300),
            nullable=False,
            server_default=DEFAULT_MESSAGE,
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint("id = 1", name="ck_site_settings_singleton"),
    )
    op.execute("INSERT INTO site_settings (id) VALUES (1)")


def downgrade() -> None:
    op.drop_table("site_settings")
