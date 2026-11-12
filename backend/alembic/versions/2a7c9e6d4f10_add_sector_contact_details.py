"""add sector address and responsible fields

Revision ID: 2a7c9e6d4f10
Revises: 43ab91dfe270
Create Date: 2026-11-12 14:45:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "2a7c9e6d4f10"
down_revision: Union[str, None] = "43ab91dfe270"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("sectors", sa.Column("address", sa.String(length=500), nullable=True))
    op.add_column("sectors", sa.Column("responsible", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("sectors", "responsible")
    op.drop_column("sectors", "address")
