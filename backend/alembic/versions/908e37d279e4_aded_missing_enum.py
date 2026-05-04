"""aded missing enum

Revision ID: 908e37d279e4
Revises: 63e80874d83f
Create Date: 2026-05-04 14:11:06.822510

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '908e37d279e4'
down_revision: Union[str, Sequence[str], None] = '63e80874d83f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE providertype ADD VALUE 'minio'")
    op.execute("ALTER TYPE providertype ADD VALUE 'backblaze'")
    op.execute("ALTER TYPE providertype ADD VALUE 'digitalocean'")


def downgrade() -> None:
    """Downgrade schema."""
    pass
