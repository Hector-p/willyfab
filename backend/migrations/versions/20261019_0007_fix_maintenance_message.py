"""Correct the spelling of the default maintenance message.

Revision ID: 20261019_0007
Revises: 20261018_0006
Create Date: 2026-10-19
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20261019_0007"
down_revision: str | None = "20261018_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

OLD_MESSAGE = "Site under maintainance, Check back later"
NEW_MESSAGE = "Site under maintenance, Check back later"


def upgrade() -> None:
    op.execute(
        f"UPDATE site_settings SET maintenance_message = '{NEW_MESSAGE}' "
        f"WHERE id = 1 AND maintenance_message = '{OLD_MESSAGE}'"
    )


def downgrade() -> None:
    op.execute(
        f"UPDATE site_settings SET maintenance_message = '{OLD_MESSAGE}' "
        f"WHERE id = 1 AND maintenance_message = '{NEW_MESSAGE}'"
    )
