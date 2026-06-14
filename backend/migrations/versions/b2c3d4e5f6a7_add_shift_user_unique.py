"""add_shift_user_unique

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-11 06:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DELETE FROM shift_user a
        USING shift_user b
        WHERE a.id > b.id
          AND a.shift_id = b.shift_id
          AND a.user_id = b.user_id
        """
    )
    op.create_unique_constraint('_shift_user_uc', 'shift_user', ['shift_id', 'user_id'])


def downgrade() -> None:
    op.drop_constraint('_shift_user_uc', 'shift_user', type_='unique')
