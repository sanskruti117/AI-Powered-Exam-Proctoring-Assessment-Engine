import json
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


# ==========================================
# Auth Schemas
# ==========================================

class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)


class StudentRegisterRequest(BaseModel):
    fullName: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=3)
    password: str = Field(min_length=8)
    confirmPassword: str


class ExaminerRegisterRequest(BaseModel):
    fullName: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=3)
    password: str = Field(min_length=8)
    confirmPassword: str
    institution: str = Field(min_length=2)
    department: str = Field(min_length=2)


class RejectExaminerRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=500)


# ==========================================
# Response Models
# ==========================================

class UserResponse(BaseModel):
    id: str
    email: str
    fullName: str
    role: str
    status: str
    institution: Optional[str] = None
    department: Optional[str] = None

    class Config:
        from_attributes = True


class MeUserResponse(BaseModel):
    id: str
    email: str
    fullName: str
    role: str
    status: str
    institution: Optional[str] = None
    department: Optional[str] = None
    createdAt: Optional[datetime] = None
    rejectionReason: Optional[str] = None

    class Config:
        from_attributes = True


class ApprovedByInfo(BaseModel):
    fullName: str
    email: str

    class Config:
        from_attributes = True


class ExaminerListItem(BaseModel):
    id: str
    email: str
    fullName: str
    role: str
    status: str
    institution: Optional[str] = None
    department: Optional[str] = None
    createdAt: Optional[datetime] = None
    approvedAt: Optional[datetime] = None
    rejectionReason: Optional[str] = None
    approvedBy: Optional[ApprovedByInfo] = None

    class Config:
        from_attributes = True


class AdminStats(BaseModel):
    totalStudents: int
    totalExaminers: int
    pendingApprovals: int
    activeExaminers: int
    rejectedExaminers: int
    totalExams: int = 0
    totalAttempts: int = 0


class AdminExaminersResponse(BaseModel):
    success: bool = True
    stats: AdminStats
    examiners: List[ExaminerListItem]


# ==========================================
# Option Schemas
# ==========================================

# ==========================================
# Option & Test Case & Code Schemas
# ==========================================

class OptionBase(BaseModel):
    option_text: str = Field(min_length=1)
    is_correct: bool = False
    order: int = 0


class OptionCreate(OptionBase):
    pass


class OptionResponse(BaseModel):
    id: str
    question_id: str
    option_text: str
    is_correct: bool
    order: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ShuffledOptionForStudent(BaseModel):
    id: str
    option_text: str
    order: int


class TestCaseBase(BaseModel):
    input_data: str = ""
    expected_output: str = ""
    is_sample: bool = False
    explanation: Optional[str] = None
    weightage_marks: float = 1.0
    order: int = 0


class TestCaseCreate(TestCaseBase):
    pass


class TestCaseResponse(BaseModel):
    id: str
    question_id: str
    input_data: str
    expected_output: str
    is_sample: bool
    explanation: Optional[str] = None
    weightage_marks: float
    order: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TestCaseStudentView(BaseModel):
    id: str
    input_data: str
    expected_output: str
    explanation: Optional[str] = None
    order: int

    class Config:
        from_attributes = True


class CodeBoilerplateBase(BaseModel):
    language: str = Field(pattern="^(python|javascript|cpp|java|c)$")
    starter_code: str


class CodeBoilerplateCreate(CodeBoilerplateBase):
    pass


class CodeBoilerplateResponse(BaseModel):
    id: str
    question_id: str
    language: str
    starter_code: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================
# Section Schemas
# ==========================================

class ExamSectionCreate(BaseModel):
    id: Optional[str] = None
    title: str = Field(min_length=2, max_length=150)
    description: Optional[str] = None
    order: int = 1
    target_marks: int = Field(ge=1)
    required_question_count: Optional[int] = None


class ExamSectionUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=150)
    description: Optional[str] = None
    order: Optional[int] = None
    target_marks: Optional[int] = Field(default=None, ge=1)
    required_question_count: Optional[int] = None


class ExamSectionResponse(BaseModel):
    id: str
    exam_id: str
    title: str
    description: Optional[str] = None
    order: int
    target_marks: int
    required_question_count: Optional[int] = None
    total_pool_questions: int = 0
    total_pool_marks: int = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================
# Question Bank Schemas
# ==========================================

class QuestionCreateRequest(BaseModel):
    exam_id: Optional[str] = None
    section_id: Optional[str] = None
    question_text: str = Field(min_length=3)
    subject: Optional[str] = None  # Synced from section if provided
    difficulty: str = Field(pattern="^(EASY|MEDIUM|HARD)$")
    question_type: str = Field(pattern="^(MCQ|MULTI_SELECT|SHORT_ANSWER|LONG_ANSWER|IMAGE|CODING)$")
    marks: int = Field(default=1, ge=1, le=100)
    expected_answer: Optional[str] = None
    image_url: Optional[str] = None
    options: Optional[List[OptionCreate]] = None
    # Coding specific fields
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    allowed_languages: Optional[List[str]] = None
    time_limit_seconds: Optional[float] = 2.0
    memory_limit_mb: Optional[int] = 256
    test_cases: Optional[List[TestCaseCreate]] = None
    boilerplates: Optional[List[CodeBoilerplateCreate]] = None


class QuestionUpdateRequest(BaseModel):
    exam_id: Optional[str] = None
    section_id: Optional[str] = None
    question_text: Optional[str] = Field(default=None, min_length=3)
    subject: Optional[str] = None
    difficulty: Optional[str] = Field(default=None, pattern="^(EASY|MEDIUM|HARD)$")
    question_type: Optional[str] = Field(default=None, pattern="^(MCQ|MULTI_SELECT|SHORT_ANSWER|LONG_ANSWER|IMAGE|CODING)$")
    marks: Optional[int] = Field(default=None, ge=1, le=100)
    expected_answer: Optional[str] = None
    image_url: Optional[str] = None
    options: Optional[List[OptionCreate]] = None
    # Coding specific fields
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    allowed_languages: Optional[List[str]] = None
    time_limit_seconds: Optional[float] = None
    memory_limit_mb: Optional[int] = None
    test_cases: Optional[List[TestCaseCreate]] = None
    boilerplates: Optional[List[CodeBoilerplateCreate]] = None


class BulkQuestionImportCommitRequest(BaseModel):
    subject: str = Field(min_length=2, max_length=150)
    questions: List[QuestionCreateRequest] = Field(min_length=1, max_length=100)


class QuestionAssessmentAssignmentRequest(BaseModel):
    question_ids: List[str] = Field(min_length=1, max_length=100)
    exam_id: str
    section_id: str


class QuestionResponse(BaseModel):
    id: str
    exam_id: Optional[str] = None
    section_id: Optional[str] = None
    examiner_id: str
    question_text: str
    subject: str
    difficulty: str
    question_type: str
    marks: float
    expected_answer: Optional[str] = None
    image_url: Optional[str] = None
    # Coding fields
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    allowed_languages: Optional[List[str]] = None
    time_limit_seconds: Optional[float] = 2.0
    memory_limit_mb: Optional[int] = 256
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    options: List[OptionResponse] = []
    test_cases: List[TestCaseResponse] = []
    boilerplates: List[CodeBoilerplateResponse] = []

    @field_validator("allowed_languages", mode="before")
    @classmethod
    def parse_allowed_languages(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [v]
        return v

    class Config:
        from_attributes = True


class QuestionForStudent(BaseModel):
    id: str
    section_id: str
    section_title: str
    question_text: str
    difficulty: str
    question_type: str
    marks: float
    image_url: Optional[str] = None
    options: List[ShuffledOptionForStudent] = []
    # Coding fields for student (only sample test cases visible)
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    allowed_languages: List[str] = ["python", "javascript", "cpp", "java"]
    time_limit_seconds: float = 2.0
    memory_limit_mb: int = 256
    sample_test_cases: List[TestCaseStudentView] = []
    boilerplates: List[CodeBoilerplateResponse] = []

    @field_validator("allowed_languages", mode="before")
    @classmethod
    def parse_student_allowed_languages(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [v]
        return v


class QuestionListResponse(BaseModel):
    success: bool = True
    total: int
    page: int
    page_size: int
    questions: List[QuestionResponse]
    subjects: List[str] = []


class QuestionStats(BaseModel):
    totalQuestions: int
    totalMarks: int
    totalSubjects: int
    byDifficulty: Dict[str, int]
    byType: Dict[str, int]


class QuestionStatsResponse(BaseModel):
    success: bool = True
    stats: QuestionStats
    subjects: List[str]


# ==========================================
# Exam Schemas
# ==========================================

class ExamCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    duration_minutes: int = Field(ge=1, le=1440)
    total_marks: int = Field(ge=1)
    passing_marks: int = Field(ge=1)
    max_attempts: int = Field(default=1, ge=1, le=10)
    shuffle_questions: bool = True
    shuffle_options: bool = True
    sections: Optional[List[ExamSectionCreate]] = None


class ExamUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(default=None, ge=1, le=1440)
    total_marks: Optional[int] = Field(default=None, ge=1)
    passing_marks: Optional[int] = Field(default=None, ge=1)
    max_attempts: Optional[int] = Field(default=None, ge=1, le=10)
    shuffle_questions: Optional[bool] = None
    shuffle_options: Optional[bool] = None
    status: Optional[str] = Field(default=None, pattern="^(DRAFT|PUBLISHED|CLOSED|ARCHIVED)$")
    sections: Optional[List[ExamSectionCreate]] = None


class ExaminerBrief(BaseModel):
    id: str
    fullName: Optional[str] = None
    full_name: Optional[str] = None
    email: str
    institution: Optional[str] = None
    department: Optional[str] = None

    class Config:
        from_attributes = True

    def model_post_init(self, __context):
        if self.fullName is None and self.full_name is not None:
            self.fullName = self.full_name
        elif self.full_name is None and self.fullName is not None:
            self.full_name = self.fullName


class ExamResponse(BaseModel):
    id: str
    examiner_id: str
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    total_marks: int
    passing_marks: int
    max_attempts: int
    shuffle_questions: bool
    shuffle_options: bool
    status: str
    created_at: datetime
    updated_at: datetime
    examiner: Optional[ExaminerBrief] = None
    sections: List[ExamSectionResponse] = []
    total_questions: int = 0
    total_pool_marks: int = 0
    attempts_count: int = 0
    can_delete: bool = True
    is_active: bool = False
    is_upcoming: bool = False
    is_ended: bool = False

    class Config:
        from_attributes = True


class ExamListResponse(BaseModel):
    success: bool = True
    total: int
    exams: List[ExamResponse]


# ==========================================
# Student Attempt & Submission Schemas
# ==========================================

# ==========================================
# Student Attempt & Submission Schemas
# ==========================================

class SavedAnswerState(BaseModel):
    question_id: str
    selected_option_id: Optional[str] = None
    selected_option_ids: Optional[List[str]] = None
    text_answer: Optional[str] = None
    code_language: Optional[str] = None
    code_answer: Optional[str] = None
    test_cases_passed: int = 0
    total_test_cases: int = 0
    time_spent_seconds: int = 0


class ExamAttemptStartResponse(BaseModel):
    success: bool = True
    attempt_id: str
    exam_id: str
    attempt_number: int
    status: str
    started_at: datetime
    deadline_at: datetime
    remaining_seconds: int
    duration_minutes: int
    total_marks: int
    questions: List[QuestionForStudent]
    saved_answers: Dict[str, SavedAnswerState] = {}


class HeartbeatItem(BaseModel):
    question_id: str
    selected_option_id: Optional[str] = None
    selected_option_ids: Optional[List[str]] = None
    text_answer: Optional[str] = None
    code_language: Optional[str] = None
    code_answer: Optional[str] = None
    delta_seconds: int = Field(default=0, ge=0)


class StudentHeartbeatRequest(BaseModel):
    answers: List[HeartbeatItem]


class StudentSubmitItem(BaseModel):
    question_id: str
    selected_option_id: Optional[str] = None
    selected_option_ids: Optional[List[str]] = None
    text_answer: Optional[str] = None
    code_language: Optional[str] = None
    code_answer: Optional[str] = None
    delta_seconds: int = Field(default=0, ge=0)


class StudentSubmitRequest(BaseModel):
    answers: List[StudentSubmitItem]


class AnswerReviewItem(BaseModel):
    question_id: str
    question_text: str
    section_title: str
    question_type: str
    difficulty: str
    marks: int
    marks_obtained: float
    is_correct: Optional[bool] = None
    evaluation_status: str
    examiner_feedback: Optional[str] = None
    time_spent_seconds: int
    selected_option_id: Optional[str] = None
    selected_option_ids: Optional[List[str]] = None
    text_answer: Optional[str] = None
    code_language: Optional[str] = None
    code_answer: Optional[str] = None
    test_cases_passed: int = 0
    total_test_cases: int = 0
    code_execution_logs: Optional[str] = None
    correct_option_ids: Optional[List[str]] = None
    expected_answer: Optional[str] = None
    options: List[OptionResponse] = []
    test_cases: List[TestCaseResponse] = []


# ==========================================
# Code Execution Schemas (Online Judge Engine)
# ==========================================

class CodeRunRequest(BaseModel):
    question_id: Optional[str] = None
    language: str = Field(pattern="^(python|javascript|cpp|java|c)$")
    code: str = Field(min_length=1)
    custom_input: Optional[str] = None


class TestCaseRunResult(BaseModel):
    test_case_id: Optional[str] = None
    is_sample: bool = True
    input_data: str
    expected_output: str
    actual_output: str
    status: str  # "PASSED", "FAILED", "ERROR", "TIMEOUT"
    execution_time_ms: float = 0.0
    error_message: Optional[str] = None


class CodeRunResponse(BaseModel):
    success: bool = True
    language: str
    verdict: str  # "ACCEPTED", "WRONG_ANSWER", "TIME_LIMIT_EXCEEDED", "COMPILATION_ERROR", "RUNTIME_ERROR", "SUCCESS"
    stdout: str = ""
    stderr: str = ""
    execution_time_ms: float = 0.0
    sample_results: List[TestCaseRunResult] = []
    error_detail: Optional[str] = None


class CodeSubmitTestRequest(BaseModel):
    question_id: str
    language: str = Field(pattern="^(python|javascript|cpp|java|c)$")
    code: str = Field(min_length=1)


class CodeSubmitTestResponse(BaseModel):
    success: bool = True
    question_id: str
    verdict: str
    test_cases_passed: int
    total_test_cases: int
    score_earned: float
    max_marks: int
    execution_time_ms: float
    results: List[TestCaseRunResult] = []


class ExamResultResponse(BaseModel):
    success: bool = True
    attempt_id: str
    exam_id: str
    exam_title: str
    student_id: str
    student_name: str
    student_email: str
    status: str
    has_pending_descriptive: bool
    started_at: datetime
    submitted_at: Optional[datetime] = None
    total_time_seconds: int
    auto_graded_score: float
    manual_graded_score: float
    score: float
    total_marks: int
    percentage: float
    is_passed: bool
    average_time_per_question: float
    answers: List[AnswerReviewItem]


# ==========================================
# Evaluation Studio Schemas
# ==========================================

class EvaluateQuestionAnswer(BaseModel):
    question_id: str
    marks_obtained: float = Field(ge=0)
    feedback: Optional[str] = None


class EvaluateAttemptRequest(BaseModel):
    evaluations: List[EvaluateQuestionAnswer]


# ==========================================
# Leaderboard & Analytics Schemas
# ==========================================

class LeaderboardEntry(BaseModel):
    rank: int
    attempt_id: str
    student_id: str
    student_name: str
    student_email: str
    score: float
    total_marks: int
    percentage: float
    is_passed: bool
    status: str
    has_pending_descriptive: bool
    total_time_seconds: int
    average_time_per_question: float
    submitted_at: Optional[datetime] = None


class ExamLeaderboardResponse(BaseModel):
    success: bool = True
    exam_id: str
    exam_title: str
    total_marks: int
    passing_marks: int
    total_participants: int
    completed_participants: int
    pending_evaluation_count: int
    leaderboard: List[LeaderboardEntry]


class QuestionCohortAnalyticsItem(BaseModel):
    question_id: str
    question_text: str
    section_title: str
    difficulty: str
    question_type: str
    marks: int
    total_attempts: int
    correct_attempts: int
    accuracy_percentage: float
    average_time_spent_seconds: float
    average_marks_obtained: float


class DifficultyAnalyticsItem(BaseModel):
    difficulty: str
    total_questions: int
    average_accuracy: float


class SectionAnalyticsItem(BaseModel):
    section_title: str
    target_marks: int
    average_score: float
    accuracy_percentage: float


class ExamAnalyticsResponse(BaseModel):
    success: bool = True
    exam_id: str
    exam_title: str
    total_enrolled: int
    total_attempts: int
    completed_attempts: int
    pending_evaluation_attempts: int
    average_score: float
    highest_score: float
    lowest_score: float
    median_score: float
    pass_rate_percentage: float
    fail_rate_percentage: float
    average_completion_time_seconds: float
    average_time_per_question_seconds: float
    difficulty_breakdown: List[DifficultyAnalyticsItem]
    section_breakdown: List[SectionAnalyticsItem]
    question_deep_dive: List[QuestionCohortAnalyticsItem]
