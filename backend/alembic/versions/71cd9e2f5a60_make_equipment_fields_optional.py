"""make selected equipment fields optional

Revision ID: 71cd9e2f5a60
Revises: 2a7c9e6d4f10
Create Date: 2026-11-12 14:55:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "71cd9e2f5a60"
down_revision: Union[str, None] = "2a7c9e6d4f10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("equipment") as batch_op:
        batch_op.alter_column(
            "asset_number",
            existing_type=sa.String(length=100),
            nullable=True,
        )
        batch_op.alter_column(
            "serial_number",
            existing_type=sa.String(length=100),
            nullable=True,
        )
        batch_op.alter_column(
            "brand",
            existing_type=sa.String(length=100),
            nullable=True,
        )
        batch_op.alter_column(
            "model",
            existing_type=sa.String(length=100),
            nullable=True,
        )
        batch_op.add_column(sa.Column("observation", sa.String(length=2000), nullable=True))

    op.execute(
        sa.text(
            "UPDATE equipment SET observation = location "
            "WHERE observation IS NULL AND location IS NOT NULL"
        )
    )


def downgrade() -> None:
    connection = op.get_bind()
    equipment = sa.table(
        "equipment",
        sa.column("asset_number"),
        sa.column("serial_number"),
        sa.column("brand"),
        sa.column("model"),
    )
    has_nulls = connection.execute(
        sa.select(equipment.c.asset_number)
        .where(
            sa.or_(
                equipment.c.asset_number.is_(None),
                equipment.c.serial_number.is_(None),
                equipment.c.brand.is_(None),
                equipment.c.model.is_(None),
            )
        )
        .limit(1)
    ).first()
    if has_nulls:
        raise RuntimeError(
            "Cannot downgrade: equipment records contain NULL values in fields "
            "that the previous schema required."
        )

    op.execute(
        sa.text(
            "UPDATE equipment SET location = observation "
            "WHERE observation IS NOT NULL"
        )
    )
    with op.batch_alter_table("equipment") as batch_op:
        batch_op.drop_column("observation")
        batch_op.alter_column(
            "asset_number",
            existing_type=sa.String(length=100),
            nullable=False,
        )
        batch_op.alter_column(
            "serial_number",
            existing_type=sa.String(length=100),
            nullable=False,
        )
        batch_op.alter_column(
            "brand",
            existing_type=sa.String(length=100),
            nullable=False,
        )
        batch_op.alter_column(
            "model",
            existing_type=sa.String(length=100),
            nullable=False,
        )
