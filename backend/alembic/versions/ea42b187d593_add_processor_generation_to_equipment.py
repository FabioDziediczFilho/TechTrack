"""add processor generation to equipment

Revision ID: ea42b187d593
Revises: c8f17d2a94b1
Create Date: 2026-11-13 10:15:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "ea42b187d593"
down_revision: str | None = "c8f17d2a94b1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "equipment",
        sa.Column("processor_generation", sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("equipment", "processor_generation")
