"""add_performance_indexes

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-11 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('ix_user_email', 'user', ['email'], unique=False)
    op.create_index('ix_shift_user_user_id', 'shift_user', ['user_id'], unique=False)
    op.create_index('ix_shift_user_shift_id', 'shift_user', ['shift_id'], unique=False)
    op.create_index('ix_shift_schedule_shift_id', 'shift_schedule', ['shift_id'], unique=False)
    op.create_index('ix_shift_schedule_schedule_id', 'shift_schedule', ['schedule_id'], unique=False)
    op.create_index('ix_schedule_creator_id', 'schedule', ['creator_id'], unique=False)
    op.create_index('ix_shift_start_time', 'shift', ['start_time'], unique=False)
    op.create_index('ix_position_department_id', 'position', ['department_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_position_department_id', table_name='position')
    op.drop_index('ix_shift_start_time', table_name='shift')
    op.drop_index('ix_schedule_creator_id', table_name='schedule')
    op.drop_index('ix_shift_schedule_schedule_id', table_name='shift_schedule')
    op.drop_index('ix_shift_schedule_shift_id', table_name='shift_schedule')
    op.drop_index('ix_shift_user_shift_id', table_name='shift_user')
    op.drop_index('ix_shift_user_user_id', table_name='shift_user')
    op.drop_index('ix_user_email', table_name='user')
