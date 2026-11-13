"""add computer number to equipment

Revision ID: c8f17d2a94b1
Revises: 71cd9e2f5a60
Create Date: 2026-11-13 08:20:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "c8f17d2a94b1"
down_revision: str | None = "71cd9e2f5a60"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "equipment",
        sa.Column("computer_number", sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("equipment", "computer_number")
