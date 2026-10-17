"""Create gallery images table and add inquiry status.

Revision ID: 20261017_0005
Revises: 20261016_0004
Create Date: 2026-10-17
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261017_0005"
down_revision: str | None = "20261016_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "gallery_images",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        sa.Column("image_alt", sa.String(length=300), nullable=False),
        sa.Column("caption", sa.String(length=500), nullable=True),
        sa.Column("featured", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_gallery_images_category", "gallery_images", ["category"])
    op.create_index("ix_gallery_images_featured", "gallery_images", ["featured"])
    op.create_index("ix_gallery_images_sort_order", "gallery_images", ["sort_order"])
    op.create_index("ix_gallery_images_is_published", "gallery_images", ["is_published"])

    op.add_column(
        "inquiries",
        sa.Column("status", sa.String(length=16), nullable=False, server_default="new"),
    )
    op.create_index("ix_inquiries_status", "inquiries", ["status"])


def downgrade() -> None:
    op.drop_index("ix_inquiries_status", table_name="inquiries")
    op.drop_column("inquiries", "status")

    op.drop_index("ix_gallery_images_is_published", table_name="gallery_images")
    op.drop_index("ix_gallery_images_sort_order", table_name="gallery_images")
    op.drop_index("ix_gallery_images_featured", table_name="gallery_images")
    op.drop_index("ix_gallery_images_category", table_name="gallery_images")
    op.drop_table("gallery_images")
