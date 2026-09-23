"""exam_results_publishing

Revision ID: 0004_exam_results_publishing
Revises: 0003_coding_questions_support
Create Date: 2026-09-23 11:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0004_exam_results_publishing'
down_revision: Union[str, None] = '0003_coding_questions_support'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('exams') as batch_op:
        batch_op.add_column(sa.Column('results_published', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    with op.batch_alter_table('exams') as batch_op:
        batch_op.drop_column('results_published')
