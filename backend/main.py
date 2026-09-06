import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.routers.auth import router as auth_router
from backend.routers.admin import router as admin_router
from backend.routers.questions import router as questions_router
from backend.routers.exams import router as exams_router
from backend.database import Base, engine

# Initialize database schema metadata safely
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[INFO] Database connection deferred at startup: {e}")

# Ensure upload directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="Exam Proctoring System API",
    version="2.0.0",
    description="Backend API powered by FastAPI, SQLAlchemy ORM and Alembic",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files for Uploads
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(questions_router)
app.include_router(exams_router)

# ========================================================
# SQLAlchemy Database Studio (Visual UI)
# ========================================================
from sqladmin import Admin, ModelView
from backend.models import (
    User,
    RefreshToken,
    Exam,
    ExamSection,
    QuestionBank,
    Option,
    ExamAttempt,
    StudentAnswer,
    QuestionTimeLog,
    ProctorEvent,
)


class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.email, User.full_name, User.role, User.status, User.institution, User.created_at]
    column_searchable_list = [User.email, User.full_name, User.institution]
    column_sortable_list = [User.email, User.full_name, User.role, User.status, User.created_at]
    icon = "fa-solid fa-users"
    name = "User"
    name_plural = "Users"


class ExamAdmin(ModelView, model=Exam):
    column_list = [Exam.id, Exam.title, Exam.total_marks, Exam.duration_minutes, Exam.status, Exam.start_time, Exam.end_time, Exam.created_at]
    column_searchable_list = [Exam.title]
    column_sortable_list = [Exam.title, Exam.status, Exam.total_marks, Exam.start_time, Exam.created_at]
    icon = "fa-solid fa-graduation-cap"
    name = "Exam"
    name_plural = "Exams"


class ExamSectionAdmin(ModelView, model=ExamSection):
    column_list = [ExamSection.id, ExamSection.exam_id, ExamSection.title, ExamSection.order, ExamSection.target_marks, ExamSection.created_at]
    column_searchable_list = [ExamSection.title]
    column_sortable_list = [ExamSection.order, ExamSection.target_marks, ExamSection.created_at]
    icon = "fa-solid fa-layer-group"
    name = "Exam Section"
    name_plural = "Exam Sections"


class QuestionBankAdmin(ModelView, model=QuestionBank):
    column_list = [QuestionBank.id, QuestionBank.subject, QuestionBank.question_type, QuestionBank.difficulty, QuestionBank.marks, QuestionBank.question_text, QuestionBank.created_at]
    column_searchable_list = [QuestionBank.subject, QuestionBank.question_text]
    column_sortable_list = [QuestionBank.subject, QuestionBank.difficulty, QuestionBank.question_type, QuestionBank.marks, QuestionBank.created_at]
    icon = "fa-solid fa-book-open"
    name = "Question"
    name_plural = "Question Bank"


class OptionAdmin(ModelView, model=Option):
    column_list = [Option.id, Option.question_id, Option.option_text, Option.is_correct, Option.order, Option.created_at]
    column_searchable_list = [Option.option_text]
    column_sortable_list = [Option.is_correct, Option.order, Option.created_at]
    icon = "fa-solid fa-list-check"
    name = "Option"
    name_plural = "Question Options"


class ExamAttemptAdmin(ModelView, model=ExamAttempt):
    column_list = [ExamAttempt.id, ExamAttempt.exam_id, ExamAttempt.student_id, ExamAttempt.status, ExamAttempt.score, ExamAttempt.percentage, ExamAttempt.is_passed, ExamAttempt.total_time_seconds, ExamAttempt.started_at]
    column_sortable_list = [ExamAttempt.score, ExamAttempt.status, ExamAttempt.started_at]
    icon = "fa-solid fa-clipboard-check"
    name = "Exam Attempt"
    name_plural = "Exam Attempts"


class StudentAnswerAdmin(ModelView, model=StudentAnswer):
    column_list = [StudentAnswer.id, StudentAnswer.attempt_id, StudentAnswer.question_id, StudentAnswer.is_correct, StudentAnswer.marks_obtained, StudentAnswer.evaluation_status, StudentAnswer.time_spent_seconds]
    column_sortable_list = [StudentAnswer.marks_obtained, StudentAnswer.is_correct, StudentAnswer.time_spent_seconds]
    icon = "fa-solid fa-pen-to-square"
    name = "Student Answer"
    name_plural = "Student Answers"


class QuestionTimeLogAdmin(ModelView, model=QuestionTimeLog):
    column_list = [QuestionTimeLog.id, QuestionTimeLog.attempt_id, QuestionTimeLog.question_id, QuestionTimeLog.duration_seconds, QuestionTimeLog.recorded_at]
    icon = "fa-solid fa-stopwatch"
    name = "Time Log"
    name_plural = "Question Time Logs"


class ProctorEventAdmin(ModelView, model=ProctorEvent):
    column_list = [ProctorEvent.id, ProctorEvent.attempt_id, ProctorEvent.student_id, ProctorEvent.event_type, ProctorEvent.severity, ProctorEvent.timestamp]
    column_sortable_list = [ProctorEvent.event_type, ProctorEvent.severity, ProctorEvent.timestamp]
    icon = "fa-solid fa-shield-halved"
    name = "Proctor Event"
    name_plural = "Proctor Events"


class RefreshTokenAdmin(ModelView, model=RefreshToken):
    column_list = [RefreshToken.id, RefreshToken.user_id, RefreshToken.expires_at, RefreshToken.revoked, RefreshToken.created_at]
    column_sortable_list = [RefreshToken.expires_at, RefreshToken.revoked, RefreshToken.created_at]
    icon = "fa-solid fa-key"
    name = "Refresh Token"
    name_plural = "Refresh Tokens"


# Mount SQLAdmin at /db-studio
db_admin = Admin(app, engine, title="SQLAlchemy Database Studio", base_url="/db-studio")
db_admin.add_view(UserAdmin)
db_admin.add_view(ExamAdmin)
db_admin.add_view(ExamSectionAdmin)
db_admin.add_view(QuestionBankAdmin)
db_admin.add_view(OptionAdmin)
db_admin.add_view(ExamAttemptAdmin)
db_admin.add_view(StudentAnswerAdmin)
db_admin.add_view(QuestionTimeLogAdmin)
db_admin.add_view(ProctorEventAdmin)
db_admin.add_view(RefreshTokenAdmin)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "orm": "sqlalchemy", "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)


