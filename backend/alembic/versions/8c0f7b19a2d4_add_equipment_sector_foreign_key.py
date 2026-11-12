"""add equipment sector foreign key

Revision ID: 8c0f7b19a2d4
Revises: 106b4bdc892d
Create Date: 2026-11-12 14:30:00.000000

"""

from typing import Sequence, Union

from alembic import op

revision: str = "8c0f7b19a2d4"
down_revision: Union[str, None] = "106b4bdc892d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("equipment") as batch_op:
        batch_op.create_foreign_key(
            "fk_equipment_sector_id_sectors",
            "sectors",
            ["sector_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("equipment") as batch_op:
        batch_op.drop_constraint("fk_equipment_sector_id_sectors", type_="foreignkey")
