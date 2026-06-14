"""initial_schema

Revision ID: cb5d6e347cb0
Revises: 396e69aebbe5
Create Date: 2026-05-25 17:59:44.951009

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'cb5d6e347cb0'
down_revision: Union[str, Sequence[str], None] = '396e69aebbe5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Ошибочно сгенерированная миграция (удаляла все таблицы). Оставляем no-op.
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
