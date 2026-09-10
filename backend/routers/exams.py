import json
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Exam, ExamSection, ExamAttempt, ProctorEvent
from backend.schemas import (
    ExamCreateRequest,
    ExamUpdateRequest,
    ExamResponse,
    ExamListResponse,
    ExamSectionCreate,
    ExamSectionUpdate,
    ExamSectionResponse,
    ExamAttemptStartResponse,
    StudentHeartbeatRequest,
    StudentSubmitRequest,
    ExamResultResponse,
    ExamLeaderboardResponse,
    ExamAnalyticsResponse,
    EvaluateAttemptRequest,
    CodeRunRequest,
    CodeRunResponse,
    CodeSubmitTestRequest,
    CodeSubmitTestResponse,
)
from backend.crud import (
    create_exam,
    get_exams,
    get_exam_by_id,
    update_exam,
    delete_exam,
    publish_exam,
    close_exam,
    create_exam_section,
    get_exam_sections,
    update_exam_section,
    delete_exam_section,
    get_or_create_student_attempt,
    record_student_heartbeat,
    submit_student_attempt,
    get_student_attempt_result,
    get_exam_leaderboard,
    get_exam_candidates,
    get_exam_analytics,
    evaluate_attempt_descriptive_answers,
    batch_ai_evaluate_exam_attempts,
    run_code_sample_test,
    submit_code_evaluation,
)
from backend.routers.auth import get_current_user_payload

router = APIRouter(prefix="/api/exams", tags=["exams"])


def require_auth(request: Request) -> dict:
    payload = get_current_user_payload(request)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )
    return payload


def require_examiner_or_admin(request: Request) -> dict:
    payload = require_auth(request)
    role = payload.get("role")
    user_status = payload.get("status")

    if role not in ("EXAMINER", "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Examiner or Admin authority required.",
        )

    if role == "EXAMINER" and user_status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user_status}. Active examiner status required.",
        )

    return payload


def require_student(request: Request) -> dict:
    payload = require_auth(request)
    role = payload.get("role")
    user_status = payload.get("status")

    if role != "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student account required to attempt examinations.",
        )

    if user_status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Student account is {user_status}.",
        )

    return payload


# ==========================================
# Exam Management Endpoints
# ==========================================

@router.get("", response_model=ExamListResponse)
def list_exams(
    request: Request,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    user = require_auth(request)
    role = user.get("role")
    user_id = user.get("userId")

    if role == "EXAMINER":
        exams = get_exams(db, examiner_id=user_id, status=status, search=search)
    elif role == "ADMIN":
        exams = get_exams(db, examiner_id=None, status=status, search=search)
    else:  # STUDENT
        exams = get_exams(db, examiner_id=None, status=status, search=search, for_student=True)

    return {"success": True, "total": len(exams), "exams": exams}


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_new_exam(
    body: ExamCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner_or_admin(request)
    examiner_id = user.get("userId")

    # Validate schedule
    st = body.start_time if body.start_time.tzinfo else body.start_time.replace(tzinfo=timezone.utc)
    et = body.end_time if body.end_time.tzinfo else body.end_time.replace(tzinfo=timezone.utc)
    now_utc = datetime.now(timezone.utc)

    if et <= st:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be strictly after start time.",
        )

    if body.passing_marks > body.total_marks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passing marks cannot exceed total exam marks.",
        )

    exam = create_exam(db, examiner_id=examiner_id, data=body)
    exam_dict = get_exam_by_id(db, exam.id)
    return exam_dict


@router.get("/{id}", response_model=ExamResponse)
def get_single_exam(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_auth(request)
    role = user.get("role")
    user_id = user.get("userId")

    examiner_scope = user_id if role == "EXAMINER" else None
    exam = get_exam_by_id(db, exam_id=id, examiner_id=examiner_scope)

    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found or you do not have permission to view it.",
        )

    return exam


@router.patch("/{id}", response_model=ExamResponse)
@router.put("/{id}", response_model=ExamResponse)
def update_single_exam(
    id: str,
    body: ExamUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner_or_admin(request)
    role = user.get("role")
    user_id = user.get("userId")

    examiner_scope = user_id if role == "EXAMINER" else None
    updated = update_exam(db, exam_id=id, examiner_id=examiner_scope, data=body)

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found or you do not have permission to modify it.",
        )

    return get_exam_by_id(db, updated.id)


@router.delete("/{id}")
def delete_single_exam(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner_or_admin(request)
    role = user.get("role")
    user_id = user.get("userId")

    examiner_scope = user_id if role == "EXAMINER" else None
    success, msg = delete_exam(db, exam_id=id, examiner_id=examiner_scope)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )

    return {"success": True, "message": msg}


@router.post("/{id}/publish")
def publish_single_exam(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner_or_admin(request)
    role = user.get("role")
    user_id = user.get("userId")

    examiner_scope = user_id if role == "EXAMINER" else None
    success, msg = publish_exam(db, exam_id=id, examiner_id=examiner_scope)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )

    return {"success": True, "message": msg}


@router.post("/{id}/close")
def close_single_exam(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner_or_admin(request)
    role = user.get("role")
    user_id = user.get("userId")

    examiner_scope = user_id if role == "EXAMINER" else None
    success, msg = close_exam(db, exam_id=id, examiner_id=examiner_scope)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )

    return {"success": True, "message": msg}


# ==========================================
# Section Management Endpoints
# ==========================================

@router.get("/{id}/sections", response_model=List[ExamSectionResponse])
def list_exam_sections(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    require_auth(request)
    sections = get_exam_sections(db, exam_id=id)
    return sections


@router.post("/{id}/sections", response_model=ExamSectionResponse, status_code=status.HTTP_201_CREATED)
def create_section_for_exam(
    id: str,
    body: ExamSectionCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner_or_admin(request)
    exam = get_exam_by_id(db, id, examiner_id=user.get("userId") if user.get("role") == "EXAMINER" else None)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    section = create_exam_section(db, exam_id=id, data=body)
    return section


@router.patch("/{id}/sections/{section_id}", response_model=ExamSectionResponse)
def update_section_for_exam(
    id: str,
    section_id: str,
    body: ExamSectionUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner_or_admin(request)
    exam = get_exam_by_id(db, id, examiner_id=user.get("userId") if user.get("role") == "EXAMINER" else None)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    updated = update_exam_section(db, section_id=section_id, data=body)
    if not updated:
        raise HTTPException(status_code=404, detail="Section not found.")
    return updated


@router.delete("/{id}/sections/{section_id}")
def delete_section_for_exam(
    id: str,
    section_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner_or_admin(request)
    exam = get_exam_by_id(db, id, examiner_id=user.get("userId") if user.get("role") == "EXAMINER" else None)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    success, msg = delete_exam_section(db, section_id=section_id)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}


# ==========================================
# Student Exam Chamber Endpoints
# ==========================================

@router.post("/{id}/start", response_model=ExamAttemptStartResponse)
def start_or_resume_exam(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_student(request)
    student_id = user.get("userId")

    attempt, questions_data, msg = get_or_create_student_attempt(db, exam_id=id, student_id=student_id)
    if not attempt or not questions_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )

    now_utc = datetime.now(timezone.utc)
    dead = attempt.deadline_at if attempt.deadline_at.tzinfo else attempt.deadline_at.replace(tzinfo=timezone.utc)
    remaining_secs = max(0, int((dead - now_utc).total_seconds()))

    # Load existing saved answers
    answers = attempt.answers or []
    saved_answers = {}
    for a in answers:
        saved_answers[a.question_id] = {
            "question_id": a.question_id,
            "selected_option_id": a.selected_option_id,
            "selected_option_ids": json.loads(a.selected_option_ids) if a.selected_option_ids else None,
            "text_answer": a.text_answer,
            "code_language": a.code_language,
            "code_answer": a.code_answer,
            "test_cases_passed": a.test_cases_passed or 0,
            "total_test_cases": a.total_test_cases or 0,
            "time_spent_seconds": a.time_spent_seconds,
        }

    return {
        "success": True,
        "attempt_id": attempt.id,
        "exam_id": attempt.exam_id,
        "attempt_number": attempt.attempt_number,
        "status": attempt.status,
        "started_at": attempt.started_at,
        "deadline_at": attempt.deadline_at,
        "remaining_seconds": remaining_secs,
        "duration_minutes": attempt.exam.duration_minutes,
        "total_marks": attempt.total_marks,
        "questions": questions_data,
        "saved_answers": saved_answers,
    }


@router.post("/{id}/code/run", response_model=CodeRunResponse)
def run_student_code_endpoint(
    id: str,
    body: CodeRunRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    require_auth(request)
    result = run_code_sample_test(
        db=db,
        language=body.language,
        code=body.code,
        custom_input=body.custom_input,
        question_id=body.question_id,
    )
    return result


@router.post("/{id}/code/submit-test", response_model=CodeSubmitTestResponse)
def submit_student_code_test_endpoint(
    id: str,
    body: CodeSubmitTestRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    require_auth(request)
    result = submit_code_evaluation(
        db=db,
        question_id=body.question_id,
        language=body.language,
        code=body.code,
    )
    return result


@router.post("/{id}/heartbeat")
def student_exam_heartbeat(
    id: str,
    body: StudentHeartbeatRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_student(request)
    student_id = user.get("userId")

    # Find active attempt
    attempt = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.exam_id == id, ExamAttempt.student_id == student_id, ExamAttempt.status == "IN_PROGRESS")
        .order_by(ExamAttempt.attempt_number.desc())
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=400, detail="No active exam attempt in progress.")

    success = record_student_heartbeat(db, attempt_id=attempt.id, student_id=student_id, data=body)
    return {"success": success}


@router.post("/{id}/submit", response_model=ExamResultResponse)
def submit_exam_attempt(
    id: str,
    body: StudentSubmitRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_student(request)
    student_id = user.get("userId")

    # Find active attempt
    attempt = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.exam_id == id, ExamAttempt.student_id == student_id, ExamAttempt.status == "IN_PROGRESS")
        .order_by(ExamAttempt.attempt_number.desc())
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=400, detail="No active in-progress attempt found to submit.")

    success, msg, finalized_attempt = submit_student_attempt(db, attempt_id=attempt.id, student_id=student_id, data=body)
    if not success:
        raise HTTPException(status_code=400, detail=msg)

    result = get_student_attempt_result(db, exam_id=id, student_id=student_id, attempt_id=finalized_attempt.id)
    return result


@router.get("/{id}/result", response_model=ExamResultResponse)
def get_exam_result(
    id: str,
    attempt_id: Optional[str] = None,
    student_id: Optional[str] = None,
    request: Request = None,
    db: Session = Depends(get_db),
):
    user = require_auth(request)
    role = user.get("role")
    req_user_id = user.get("userId")

    target_student_id = req_user_id if role == "STUDENT" else (student_id or req_user_id)
    result = get_student_attempt_result(db, exam_id=id, student_id=target_student_id, attempt_id=attempt_id)

    if not result:
        raise HTTPException(status_code=404, detail="Exam result record not found.")

    return result


@router.post("/{id}/proctor-event")
def log_proctor_event(
    id: str,
    request: Request,
    event_type: str = Query(...),
    severity: str = Query(default="MEDIUM"),
    details: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    user = require_student(request)
    student_id = user.get("userId")

    attempt = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.exam_id == id, ExamAttempt.student_id == student_id, ExamAttempt.status == "IN_PROGRESS")
        .first()
    )
    if not attempt:
        return {"success": False, "detail": "No active attempt"}

    pe = ProctorEvent(
        attempt_id=attempt.id,
        student_id=student_id,
        event_type=event_type,
        severity=severity.upper(),
        details=details,
    )
    db.add(pe)
    db.commit()
    return {"success": True}


# ==========================================
# Leaderboard, Analytics & Evaluation Studio
# ==========================================

@router.get("/{id}/leaderboard", response_model=ExamLeaderboardResponse)
def get_exam_leaderboard_endpoint(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner_or_admin(request)
    role = user.get("role")
    user_id = user.get("userId")

    examiner_scope = user_id if role == "EXAMINER" else None
    exam = get_exam_by_id(db, exam_id=id, examiner_id=examiner_scope)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or access denied.")

    leaderboard_data = get_exam_leaderboard(db, exam_id=id)
    return leaderboard_data


@router.get("/{id}/candidates")
def get_exam_candidates_endpoint(id: str, request: Request, db: Session = Depends(get_db)):
    user = require_examiner_or_admin(request)
    examiner_scope = user.get("userId") if user.get("role") == "EXAMINER" else None
    exam = get_exam_by_id(db, exam_id=id, examiner_id=examiner_scope)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or access denied.")
    return {"success": True, "candidates": get_exam_candidates(db, id)}


@router.get("/{id}/analytics", response_model=ExamAnalyticsResponse)
def get_exam_analytics_endpoint(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner_or_admin(request)
    role = user.get("role")
    user_id = user.get("userId")

    examiner_scope = user_id if role == "EXAMINER" else None
    exam = get_exam_by_id(db, exam_id=id, examiner_id=examiner_scope)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or access denied.")

    analytics_data = get_exam_analytics(db, exam_id=id)
    return analytics_data


@router.post("/{id}/evaluate/{attempt_id}")
def evaluate_attempt_endpoint(
    id: str,
    attempt_id: str,
    body: EvaluateAttemptRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner_or_admin(request)
    role = user.get("role")
    user_id = user.get("userId")

    examiner_scope = user_id if role == "EXAMINER" else None
    exam = get_exam_by_id(db, exam_id=id, examiner_id=examiner_scope)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or access denied.")

    success, msg, attempt = evaluate_attempt_descriptive_answers(db, attempt_id=attempt_id, data=body)
    if not success:
        raise HTTPException(status_code=400, detail=msg)

    return {"success": True, "message": msg, "score": attempt.score, "status": attempt.status}


@router.post("/{id}/ai-evaluate")
def batch_ai_evaluate_endpoint(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner_or_admin(request)
    role = user.get("role")
    user_id = user.get("userId")

    examiner_scope = user_id if role == "EXAMINER" else None
    exam = get_exam_by_id(db, exam_id=id, examiner_id=examiner_scope)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or access denied.")

    attempts_count, questions_count = batch_ai_evaluate_exam_attempts(db, exam_id=id)
    return {
        "success": True,
        "message": f"Successfully evaluated {attempts_count} candidate attempts ({questions_count} descriptive questions) using AI.",
        "evaluated_attempts_count": attempts_count,
        "evaluated_questions_count": questions_count,
    }
