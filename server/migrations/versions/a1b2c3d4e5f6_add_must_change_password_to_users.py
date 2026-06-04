"""add must_change_password to users

Revision ID: a1b2c3d4e5f6
Revises: f05542d1e42d
Create Date: 2026-06-04 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f05542d1e42d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('must_change_password', sa.SmallInteger(), nullable=False, server_default='1'))


def downgrade() -> None:
    op.drop_column('users', 'must_change_password')
