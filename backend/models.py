import uuid
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Float,
    Text,
    func,
)
from sqlalchemy.orm import relationship
from backend.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # ADMIN, EXAMINER, STUDENT
    status = Column(String, default="ACTIVE", nullable=False)  # PENDING, ACTIVE, REJECTED, SUSPENDED

    # Examiner-specific profile details
    institution = Column(String, nullable=True)
    department = Column(String, nullable=True)

    # Approval audit fields (for examiners)
    approved_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(String, nullable=True)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        onupdate=func.now(),
        server_default=func.now(),
        nullable=False,
    )

    @property
    def fullName(self) -> str:
        return self.full_name

    @property
    def createdAt(self):
        return self.created_at

    @property
    def approvedAt(self):
        return self.approved_at

    @property
    def rejectionReason(self):
        return self.rejection_reason

    # Relationships
    approved_by = relationship(
        "User",
        remote_side=[id],
        back_populates="approved_examiners",
        foreign_keys=[approved_by_id],
    )
    approved_examiners = relationship(
        "User",
        back_populates="approved_by",
        foreign_keys=[approved_by_id],
    )
    refresh_tokens = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    created_exams = relationship(
        "Exam",
        back_populates="examiner",
        cascade="all, delete-orphan",
    )
    questions = relationship(
        "QuestionBank",
        back_populates="examiner",
        cascade="all, delete-orphan",
    )
    exam_attempts = relationship(
        "ExamAttempt",
        back_populates="student",
        cascade="all, delete-orphan",
    )
    proctor_events = relationship(
        "ProctorEvent",
        back_populates="student",
        cascade="all, delete-orphan",
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token_hash = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")


Index("ix_refresh_tokens_user_id", RefreshToken.user_id)


class Exam(Base):
    __tablename__ = "exams"

    id = Column(String, primary_key=True, default=generate_uuid)
    examiner_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    
    total_marks = Column(Integer, nullable=False)
    passing_marks = Column(Integer, nullable=False)
    max_attempts = Column(Integer, default=1, nullable=False)
    
    shuffle_questions = Column(Boolean, default=True, nullable=False)
    shuffle_options = Column(Boolean, default=True, nullable=False)
    
    # "DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"
    status = Column(String(20), default="DRAFT", index=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=func.now(), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), server_default=func.now(), nullable=False)

    # Relationships
    examiner = relationship("User", back_populates="created_exams")
    sections = relationship("ExamSection", back_populates="exam", cascade="all, delete-orphan", order_by="ExamSection.order")
    questions = relationship("QuestionBank", back_populates="exam", cascade="all, delete-orphan")
    attempts = relationship("ExamAttempt", back_populates="exam", cascade="all, delete-orphan")


Index("ix_exams_examiner_status", Exam.examiner_id, Exam.status)
Index("ix_exams_schedule", Exam.start_time, Exam.end_time, Exam.status)


class ExamSection(Base):
    __tablename__ = "exam_sections"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, ForeignKey("exams.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(150), nullable=False)  # Subject or Section Name
    description = Column(Text, nullable=True)
    order = Column(Integer, default=1, nullable=False)
    
    target_marks = Column(Integer, nullable=False)  # Quota for this section
    required_question_count = Column(Integer, nullable=True)  # Optional questions count
    
    created_at = Column(DateTime(timezone=True), default=func.now(), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), server_default=func.now(), nullable=False)

    # Relationships
    exam = relationship("Exam", back_populates="sections")
    questions = relationship("QuestionBank", back_populates="section", cascade="all, delete-orphan")


Index("ix_sections_exam_order", ExamSection.exam_id, ExamSection.order)


class QuestionBank(Base):
    __tablename__ = "question_bank"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, ForeignKey("exams.id", ondelete="CASCADE"), index=True, nullable=True)
    section_id = Column(String, ForeignKey("exam_sections.id", ondelete="CASCADE"), index=True, nullable=True)
    examiner_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    question_text = Column(Text, nullable=False)
    subject = Column(String, index=True, nullable=False)
    difficulty = Column(String, nullable=False)  # EASY, MEDIUM, HARD
    question_type = Column(String, nullable=False)  # MCQ, MULTI_SELECT, SHORT_ANSWER, LONG_ANSWER, IMAGE, CODING
    marks = Column(Integer, default=1, nullable=False)
    expected_answer = Column(Text, nullable=True)  # For SHORT_ANSWER, LONG_ANSWER / rubric
    image_url = Column(String, nullable=True)  # For IMAGE questions

    # Coding Problem Specific Fields
    input_format = Column(Text, nullable=True)
    output_format = Column(Text, nullable=True)
    constraints = Column(Text, nullable=True)
    allowed_languages = Column(Text, nullable=True)  # JSON list: ["python", "javascript", "cpp", "java"]
    time_limit_seconds = Column(Float, default=2.0, nullable=False)
    memory_limit_mb = Column(Integer, default=256, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        onupdate=func.now(),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    exam = relationship("Exam", back_populates="questions")
    section = relationship("ExamSection", back_populates="questions")
    examiner = relationship("User", back_populates="questions")
    options = relationship(
        "Option",
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="Option.order",
    )
    test_cases = relationship(
        "TestCase",
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="TestCase.order",
    )
    boilerplates = relationship(
        "CodeBoilerplate",
        back_populates="question",
        cascade="all, delete-orphan",
    )
    student_answers = relationship("StudentAnswer", back_populates="question", cascade="all, delete-orphan")


Index("ix_question_bank_examiner_id", QuestionBank.examiner_id)
Index("ix_question_bank_subject", QuestionBank.subject)
Index("ix_question_bank_difficulty", QuestionBank.difficulty)
Index("ix_question_bank_question_type", QuestionBank.question_type)
Index("ix_question_bank_exam_section", QuestionBank.exam_id, QuestionBank.section_id)


class Option(Base):
    __tablename__ = "options"

    id = Column(String, primary_key=True, default=generate_uuid)
    question_id = Column(
        String,
        ForeignKey("question_bank.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)
    order = Column(Integer, default=0, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    question = relationship("QuestionBank", back_populates="options")


Index("ix_options_question_id", Option.question_id)


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(String, primary_key=True, default=generate_uuid)
    question_id = Column(
        String,
        ForeignKey("question_bank.id", ondelete="CASCADE"),
        nullable=False,
    )
    input_data = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    is_sample = Column(Boolean, default=False, nullable=False)
    explanation = Column(Text, nullable=True)
    weightage_marks = Column(Float, default=1.0, nullable=False)
    order = Column(Integer, default=0, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    question = relationship("QuestionBank", back_populates="test_cases")


Index("ix_test_cases_question_id", TestCase.question_id)


class CodeBoilerplate(Base):
    __tablename__ = "code_boilerplates"

    id = Column(String, primary_key=True, default=generate_uuid)
    question_id = Column(
        String,
        ForeignKey("question_bank.id", ondelete="CASCADE"),
        nullable=False,
    )
    language = Column(String(50), nullable=False)  # "python", "javascript", "cpp", "java"
    starter_code = Column(Text, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    question = relationship("QuestionBank", back_populates="boilerplates")


Index("ix_code_boilerplates_question_id", CodeBoilerplate.question_id)


class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, ForeignKey("exams.id", ondelete="CASCADE"), index=True, nullable=False)
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    attempt_number = Column(Integer, default=1, nullable=False)
    
    # "IN_PROGRESS", "SUBMITTED", "PENDING_EVALUATION", "EVALUATED", "EXPIRED"
    status = Column(String(30), default="IN_PROGRESS", index=True, nullable=False)
    
    started_at = Column(DateTime(timezone=True), default=func.now(), server_default=func.now(), nullable=False)
    deadline_at = Column(DateTime(timezone=True), nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    
    total_time_seconds = Column(Integer, default=0, nullable=False)
    
    # Granular scoring
    auto_graded_score = Column(Float, default=0.0, nullable=False)
    manual_graded_score = Column(Float, default=0.0, nullable=False)
    score = Column(Float, default=0.0, nullable=False)  # auto + manual
    total_marks = Column(Integer, nullable=False)
    percentage = Column(Float, default=0.0, nullable=False)
    is_passed = Column(Boolean, default=False, nullable=False)
    
    has_pending_descriptive = Column(Boolean, default=False, nullable=False)
    
    # Deterministic assignment snapshot
    assigned_question_order = Column(Text, nullable=False)  # JSON: ["q1", "q2", ...]
    assigned_option_orders = Column(Text, nullable=False)   # JSON: {"q1": ["opt3", "opt1", ...]}
    
    created_at = Column(DateTime(timezone=True), default=func.now(), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), server_default=func.now(), nullable=False)

    # Relationships
    exam = relationship("Exam", back_populates="attempts")
    student = relationship("User", back_populates="exam_attempts")
    answers = relationship("StudentAnswer", back_populates="attempt", cascade="all, delete-orphan")
    time_logs = relationship("QuestionTimeLog", back_populates="attempt", cascade="all, delete-orphan")
    proctor_events = relationship("ProctorEvent", back_populates="attempt", cascade="all, delete-orphan")


Index("ix_attempts_exam_score", ExamAttempt.exam_id, ExamAttempt.score, ExamAttempt.total_time_seconds)
Index("ix_attempts_exam_student", ExamAttempt.exam_id, ExamAttempt.student_id)


class StudentAnswer(Base):
    __tablename__ = "student_answers"

    id = Column(String, primary_key=True, default=generate_uuid)
    attempt_id = Column(String, ForeignKey("exam_attempts.id", ondelete="CASCADE"), index=True, nullable=False)
    question_id = Column(String, ForeignKey("question_bank.id", ondelete="CASCADE"), index=True, nullable=False)
    
    selected_option_id = Column(String, nullable=True)     # For Single Choice MCQ
    selected_option_ids = Column(Text, nullable=True)      # JSON list for MULTI_SELECT
    text_answer = Column(Text, nullable=True)              # For Short/Long Answer
    
    # Coding Answer Fields
    code_language = Column(String(50), nullable=True)      # "python", "javascript", "cpp", "java"
    code_answer = Column(Text, nullable=True)              # Submitted source code
    test_cases_passed = Column(Integer, default=0, nullable=False)
    total_test_cases = Column(Integer, default=0, nullable=False)
    code_execution_logs = Column(Text, nullable=True)      # Summary JSON logs
    
    is_correct = Column(Boolean, nullable=True)
    marks_obtained = Column(Float, default=0.0, nullable=False)
    
    # "AUTO_EVALUATED", "PENDING_REVIEW", "MANUALLY_EVALUATED"
    evaluation_status = Column(String(30), default="AUTO_EVALUATED", nullable=False)
    examiner_feedback = Column(Text, nullable=True)
    
    # Cumulative stopwatch (Total accumulated seconds across all visits to this question)
    time_spent_seconds = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=func.now(), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), server_default=func.now(), nullable=False)

    # Relationships
    attempt = relationship("ExamAttempt", back_populates="answers")
    question = relationship("QuestionBank", back_populates="student_answers")


Index("ix_answers_attempt_question", StudentAnswer.attempt_id, StudentAnswer.question_id)
Index("ix_answers_question_time", StudentAnswer.question_id, StudentAnswer.time_spent_seconds)


class QuestionTimeLog(Base):
    __tablename__ = "question_time_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    attempt_id = Column(String, ForeignKey("exam_attempts.id", ondelete="CASCADE"), index=True, nullable=False)
    question_id = Column(String, ForeignKey("question_bank.id", ondelete="CASCADE"), index=True, nullable=False)
    duration_seconds = Column(Integer, nullable=False)  # Delta seconds spent during this visit
    recorded_at = Column(DateTime(timezone=True), default=func.now(), server_default=func.now(), nullable=False)

    # Relationships
    attempt = relationship("ExamAttempt", back_populates="time_logs")


Index("ix_time_logs_attempt_question", QuestionTimeLog.attempt_id, QuestionTimeLog.question_id)


class ProctorEvent(Base):
    __tablename__ = "proctor_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    attempt_id = Column(String, ForeignKey("exam_attempts.id", ondelete="CASCADE"), index=True, nullable=False)
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    event_type = Column(String(50), index=True, nullable=False)
    severity = Column(String(20), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=func.now(), server_default=func.now(), nullable=False)

    # Relationships
    attempt = relationship("ExamAttempt", back_populates="proctor_events")
    student = relationship("User", back_populates="proctor_events")


Index("ix_proctor_events_attempt", ProctorEvent.attempt_id)
Index("ix_proctor_events_student", ProctorEvent.student_id)

