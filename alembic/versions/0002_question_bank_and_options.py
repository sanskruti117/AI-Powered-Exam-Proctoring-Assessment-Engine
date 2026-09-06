"""question_bank_and_options

Revision ID: 0002_question_bank_and_options
Revises: 0001_initial_schema
Create Date: 2026-08-30 22:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0002_question_bank_and_options'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create question_bank table
    op.create_table(
        'question_bank',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('examiner_id', sa.String(), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('difficulty', sa.String(), nullable=False),
        sa.Column('question_type', sa.String(), nullable=False),
        sa.Column('marks', sa.Integer(), server_default='1', nullable=False),
        sa.Column('expected_answer', sa.Text(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['examiner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_question_bank_examiner_id'), 'question_bank', ['examiner_id'], unique=False)
    op.create_index(op.f('ix_question_bank_subject'), 'question_bank', ['subject'], unique=False)
    op.create_index(op.f('ix_question_bank_difficulty'), 'question_bank', ['difficulty'], unique=False)
    op.create_index(op.f('ix_question_bank_question_type'), 'question_bank', ['question_type'], unique=False)

    # 2. Create options table
    op.create_table(
        'options',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('question_id', sa.String(), nullable=False),
        sa.Column('option_text', sa.Text(), nullable=False),
        sa.Column('is_correct', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['question_id'], ['question_bank.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_options_question_id'), 'options', ['question_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_options_question_id'), table_name='options')
    op.drop_table('options')
    op.drop_index(op.f('ix_question_bank_question_type'), table_name='question_bank')
    op.drop_index(op.f('ix_question_bank_difficulty'), table_name='question_bank')
    op.drop_index(op.f('ix_question_bank_subject'), table_name='question_bank')
    op.drop_index(op.f('ix_question_bank_examiner_id'), table_name='question_bank')
    op.drop_table('question_bank')
