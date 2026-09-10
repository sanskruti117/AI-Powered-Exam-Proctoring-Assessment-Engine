"""coding_questions_support

Revision ID: 0003_coding_questions_support
Revises: 0002_question_bank_and_options
Create Date: 2026-09-07 14:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0003_coding_questions_support'
down_revision: Union[str, None] = '0002_question_bank_and_options'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add columns to question_bank
    with op.batch_alter_table('question_bank') as batch_op:
        batch_op.add_column(sa.Column('input_format', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('output_format', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('constraints', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('allowed_languages', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('time_limit_seconds', sa.Float(), server_default='2.0', nullable=False))
        batch_op.add_column(sa.Column('memory_limit_mb', sa.Integer(), server_default='256', nullable=False))

    # 2. Create test_cases table
    op.create_table(
        'test_cases',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('question_id', sa.String(), nullable=False),
        sa.Column('input_data', sa.Text(), nullable=False),
        sa.Column('expected_output', sa.Text(), nullable=False),
        sa.Column('is_sample', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('weightage_marks', sa.Float(), server_default='1.0', nullable=False),
        sa.Column('order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['question_id'], ['question_bank.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_test_cases_question_id'), 'test_cases', ['question_id'], unique=False)

    # 3. Create code_boilerplates table
    op.create_table(
        'code_boilerplates',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('question_id', sa.String(), nullable=False),
        sa.Column('language', sa.String(length=50), nullable=False),
        sa.Column('starter_code', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['question_id'], ['question_bank.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_code_boilerplates_question_id'), 'code_boilerplates', ['question_id'], unique=False)

    # 4. Add columns to student_answers
    with op.batch_alter_table('student_answers') as batch_op:
        batch_op.add_column(sa.Column('code_language', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('code_answer', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('test_cases_passed', sa.Integer(), server_default='0', nullable=False))
        batch_op.add_column(sa.Column('total_test_cases', sa.Integer(), server_default='0', nullable=False))
        batch_op.add_column(sa.Column('code_execution_logs', sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('student_answers') as batch_op:
        batch_op.drop_column('code_execution_logs')
        batch_op.drop_column('total_test_cases')
        batch_op.drop_column('test_cases_passed')
        batch_op.drop_column('code_answer')
        batch_op.drop_column('code_language')

    op.drop_index(op.f('ix_code_boilerplates_question_id'), table_name='code_boilerplates')
    op.drop_table('code_boilerplates')

    op.drop_index(op.f('ix_test_cases_question_id'), table_name='test_cases')
    op.drop_table('test_cases')

    with op.batch_alter_table('question_bank') as batch_op:
        batch_op.drop_column('memory_limit_mb')
        batch_op.drop_column('time_limit_seconds')
        batch_op.drop_column('allowed_languages')
        batch_op.drop_column('constraints')
        batch_op.drop_column('output_format')
        batch_op.drop_column('input_format')
