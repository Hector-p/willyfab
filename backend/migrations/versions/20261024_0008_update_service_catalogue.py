"""Update service titles, category labels and wording.

Revision ID: 20261024_0008
Revises: 20261019_0007
Create Date: 2026-10-24
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261024_0008"
down_revision: str | None = "20261019_0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

OLD_PALM_OIL_DESCRIPTION = (
    "Willyfab Engineering supplies automated palm oil processing plants. "
    "Plant configuration and capacity are discussed against the intended operation "
    "and site requirements."
)
NEW_PALM_OIL_DESCRIPTION = (
    "Willyfab Engineering fabricates automated palm oil processing plants. "
    "Plant configuration and capacity are discussed against the intended operation "
    "and site requirements."
)
OLD_INDUSTRIAL_DESCRIPTION = (
    "The industrial auxiliaries range includes steam boilers, bucket elevators, screw "
    "conveyors, industrial blowers, separation cyclones and pneumatic conveyor systems."
)
NEW_INDUSTRIAL_DESCRIPTION = (
    "The industrial auxiliaries range includes steam boilers, bucket elevators, screw "
    "conveyors, industrial blowers, separation cyclones, pneumatic conveyor systems, garri "
    "graters, cabin dryers, blower machines, mixer machines, jaw crusher machines, "
    "oil grain extractor machines and block moulding machines."
)

OLD_VALUES: dict[str, dict[str, str]] = {
    "palm-oil-processing": {
        "title": "Automated palm oil processing",
        "category": "Agro-processing",
        "description": OLD_PALM_OIL_DESCRIPTION,
    },
    "cassava-flour-garri-mills": {
        "title": "Cassava flour & garri mills",
        "category": "Agro-processing",
    },
    "animal-fish-feed-mills": {"category": "Agro-processing"},
    "palm-kernel-oil-extraction": {
        "title": "Palm kernel oil extraction",
        "category": "Agro-processing",
    },
    "industrial-auxiliaries": {
        "category": "Industrial systems",
        "description": OLD_INDUSTRIAL_DESCRIPTION,
    },
}

NEW_VALUES: dict[str, dict[str, str]] = {
    "palm-oil-processing": {
        "title": "Palm Oil Fabrication",
        "category": "Agro Processing Fabrication",
        "description": NEW_PALM_OIL_DESCRIPTION,
    },
    "cassava-flour-garri-mills": {
        "title": "Fabrication of Cassava Processing & Garri Mills (Small, Medium & Large)",
        "category": "Agro Processing Fabrication",
    },
    "animal-fish-feed-mills": {"category": "Agro Processing Fabrication"},
    "palm-kernel-oil-extraction": {
        "title": "Fabrication of Palm Kernel Extraction Machines",
        "category": "Agro Processing Fabrication",
    },
    "industrial-auxiliaries": {
        "category": "Industrial Systems Fabrication",
        "description": NEW_INDUSTRIAL_DESCRIPTION,
    },
}


def _write_values(values_by_slug: dict[str, dict[str, str]]) -> None:
    bind = op.get_bind()
    for slug, values in values_by_slug.items():
        assignments = ", ".join(f"{column} = :{column}" for column in values)
        bind.execute(
            sa.text(f"UPDATE services SET {assignments} WHERE slug = :slug"),
            {"slug": slug, **values},
        )


def upgrade() -> None:
    _write_values(NEW_VALUES)


def downgrade() -> None:
    _write_values(OLD_VALUES)
