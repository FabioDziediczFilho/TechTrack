"""seed default equipment and maintenance types

Revision ID: 43ab91dfe270
Revises: 8c0f7b19a2d4
Create Date: 2026-11-12 14:40:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "43ab91dfe270"
down_revision: Union[str, None] = "8c0f7b19a2d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _insert_missing_types(table_name: str, names: tuple[str, ...]) -> None:
    bind = op.get_bind()
    table = sa.table(table_name, sa.column("name", sa.String(length=50)))
    for name in names:
        existing = bind.execute(
            sa.select(table.c.name).where(table.c.name == name)
        ).scalar_one_or_none()
        if existing is None:
            bind.execute(table.insert().values(name=name))


def upgrade() -> None:
    _insert_missing_types(
        "equipment_types",
        ("Computador", "Notebook", "Impressora", "Servidor"),
    )
    _insert_missing_types(
        "maintenance_types",
        ("Preventiva", "Corretiva"),
    )


def downgrade() -> None:
    # Existing custom types may use these names; preserve data during downgrade.
    pass
