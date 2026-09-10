from typing import Optional, List, Dict, Any, Tuple
import json
import random
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func, or_, distinct, desc, asc
from backend.models import (
    User,
    RefreshToken,
    Exam,
    ExamSection,
    QuestionBank,
    Option,
    TestCase,
    CodeBoilerplate,
    ExamAttempt,
    StudentAnswer,
    QuestionTimeLog,
    ProctorEvent,
)
from backend.schemas import (
    QuestionCreateRequest,
    QuestionUpdateRequest,
    ExamCreateRequest,
    ExamUpdateRequest,
    ExamSectionCreate,
    ExamSectionUpdate,
    StudentHeartbeatRequest,
    StudentSubmitRequest,
    EvaluateAttemptRequest,
)
from backend.services.ai_evaluator import evaluate_descriptive_answer
from backend.services.code_executor import execute_single_run, evaluate_test_cases_suite


# ==========================================
# User & Admin Auth CRUD
# ==========================================

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    normalized_email = email.lower().strip()
    return db.query(User).filter(User.email == normalized_email).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_student(db: Session, full_name: str, email: str, password_hash: str) -> User:
    user = User(
        email=email.lower().strip(),
        password_hash=password_hash,
        full_name=full_name.strip(),
        role="STUDENT",
        status="ACTIVE",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_examiner(
    db: Session,
    full_name: str,
    email: str,
    password_hash: str,
    institution: str,
    department: str,
) -> User:
    user = User(
        email=email.lower().strip(),
        password_hash=password_hash,
        full_name=full_name.strip(),
        role="EXAMINER",
        status="PENDING",
        institution=institution.strip(),
        department=department.strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_admin(
    db: Session,
    full_name: str,
    email: str,
    password_hash: str,
) -> User:
    user = User(
        email=email.lower().strip(),
        password_hash=password_hash,
        full_name=full_name.strip(),
        role="ADMIN",
        status="ACTIVE",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_first_admin(db: Session) -> Optional[User]:
    return db.query(User).filter(User.role == "ADMIN").first()


def get_first_examiner(db: Session) -> Optional[User]:
    return db.query(User).filter(User.role == "EXAMINER").first()


def get_first_student(db: Session) -> Optional[User]:
    return db.query(User).filter(User.role == "STUDENT").first()


def get_admin_examiners(db: Session, status_filter: Optional[str] = None) -> List[User]:
    query = db.query(User).options(joinedload(User.approved_by)).filter(User.role == "EXAMINER")
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(User.status == status_filter.upper())
    return query.order_by(User.created_at.desc()).all()


def get_system_stats(db: Session) -> Dict[str, int]:
    total_students = db.query(func.count(User.id)).filter(User.role == "STUDENT").scalar() or 0
    total_examiners = db.query(func.count(User.id)).filter(User.role == "EXAMINER").scalar() or 0
    pending_count = (
        db.query(func.count(User.id))
        .filter(User.role == "EXAMINER", User.status == "PENDING")
        .scalar()
        or 0
    )
    active_count = (
        db.query(func.count(User.id))
        .filter(User.role == "EXAMINER", User.status == "ACTIVE")
        .scalar()
        or 0
    )
    rejected_count = (
        db.query(func.count(User.id))
        .filter(User.role == "EXAMINER", User.status == "REJECTED")
        .scalar()
        or 0
    )
    total_exams = db.query(func.count(Exam.id)).scalar() or 0
    total_attempts = db.query(func.count(ExamAttempt.id)).scalar() or 0

    return {
        "totalStudents": total_students,
        "totalExaminers": total_examiners,
        "pendingApprovals": pending_count,
        "activeExaminers": active_count,
        "rejectedExaminers": rejected_count,
        "totalExams": total_exams,
        "totalAttempts": total_attempts,
    }


def approve_examiner(db: Session, examiner_id: str, admin_user_id: str) -> Optional[User]:
    examiner = db.query(User).filter(User.id == examiner_id).first()
    if not examiner or examiner.role != "EXAMINER":
        return None

    examiner.status = "ACTIVE"
    examiner.approved_by_id = admin_user_id
    examiner.approved_at = datetime.now(timezone.utc)
    examiner.rejection_reason = None
    db.commit()
    db.refresh(examiner)
    return examiner


def reject_examiner(
    db: Session, examiner_id: str, admin_user_id: str, reason: str
) -> Optional[User]:
    examiner = db.query(User).filter(User.id == examiner_id).first()
    if not examiner or examiner.role != "EXAMINER":
        return None

    examiner.status = "REJECTED"
    examiner.approved_by_id = admin_user_id
    examiner.approved_at = datetime.now(timezone.utc)
    examiner.rejection_reason = reason.strip()
    db.commit()
    db.refresh(examiner)
    return examiner


# ==========================================
# Exam CRUD
# ==========================================

def create_exam(
    db: Session,
    examiner_id: str,
    data: ExamCreateRequest,
) -> Exam:
    exam = Exam(
        examiner_id=examiner_id,
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        start_time=data.start_time,
        end_time=data.end_time,
        duration_minutes=data.duration_minutes,
        total_marks=data.total_marks,
        passing_marks=data.passing_marks,
        max_attempts=data.max_attempts,
        shuffle_questions=data.shuffle_questions,
        shuffle_options=data.shuffle_options,
        status="DRAFT",
    )
    db.add(exam)
    db.flush()

    # Add initial sections if provided, or create default General Section
    if data.sections and len(data.sections) > 0:
        for sec in data.sections:
            section = ExamSection(
                exam_id=exam.id,
                title=sec.title.strip(),
                description=sec.description.strip() if sec.description else None,
                order=sec.order,
                target_marks=sec.target_marks,
                required_question_count=sec.required_question_count,
            )
            db.add(section)
    else:
        # Default single section
        default_sec = ExamSection(
            exam_id=exam.id,
            title="General Section",
            order=1,
            target_marks=data.total_marks,
        )
        db.add(default_sec)

    db.commit()
    db.refresh(exam)
    return exam


def get_exams(
    db: Session,
    examiner_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    for_student: bool = False,
) -> List[Dict[str, Any]]:
    query = (
        db.query(Exam)
        .options(
            joinedload(Exam.examiner),
            selectinload(Exam.sections).selectinload(ExamSection.questions),
            selectinload(Exam.questions),
            selectinload(Exam.attempts),
        )
    )

    if examiner_id:
        query = query.filter(Exam.examiner_id == examiner_id)

    if for_student:
        # Students only see PUBLISHED or CLOSED exams
        query = query.filter(Exam.status.in_(["PUBLISHED", "CLOSED"]))
    elif status and status.upper() != "ALL":
        query = query.filter(Exam.status == status.upper())

    if search and search.strip():
        term = f"%{search.lower().strip()}%"
        query = query.filter(
            or_(
                func.lower(Exam.title).like(term),
                func.lower(Exam.description).like(term),
            )
        )

    exams = query.order_by(Exam.created_at.desc()).all()
    now_utc = datetime.now(timezone.utc)

    results = []
    for exam in exams:
        total_q = len(exam.questions)
        total_pool_m = sum(q.marks for q in exam.questions)
        attempts_c = len(exam.attempts)
        can_del = (attempts_c == 0)

        # Make datetime tz-aware for comparison
        st = exam.start_time if exam.start_time.tzinfo else exam.start_time.replace(tzinfo=timezone.utc)
        et = exam.end_time if exam.end_time.tzinfo else exam.end_time.replace(tzinfo=timezone.utc)

        is_act = (exam.status == "PUBLISHED" and st <= now_utc <= et)
        is_upc = (exam.status == "PUBLISHED" and now_utc < st)
        is_end = (now_utc > et or exam.status == "CLOSED")

        # Format sections
        sec_responses = []
        for s in exam.sections:
            sec_q_count = len(s.questions)
            sec_q_marks = sum(q.marks for q in s.questions)
            sec_responses.append({
                "id": s.id,
                "exam_id": s.exam_id,
                "title": s.title,
                "description": s.description,
                "order": s.order,
                "target_marks": s.target_marks,
                "required_question_count": s.required_question_count,
                "total_pool_questions": sec_q_count,
                "total_pool_marks": sec_q_marks,
                "created_at": s.created_at,
            })

        results.append({
            "id": exam.id,
            "examiner_id": exam.examiner_id,
            "title": exam.title,
            "description": exam.description,
            "start_time": exam.start_time,
            "end_time": exam.end_time,
            "duration_minutes": exam.duration_minutes,
            "total_marks": exam.total_marks,
            "passing_marks": exam.passing_marks,
            "max_attempts": exam.max_attempts,
            "shuffle_questions": exam.shuffle_questions,
            "shuffle_options": exam.shuffle_options,
            "status": exam.status,
            "created_at": exam.created_at,
            "updated_at": exam.updated_at,
            "examiner": exam.examiner,
            "sections": sec_responses,
            "total_questions": total_q,
            "total_pool_marks": total_pool_m,
            "attempts_count": attempts_c,
            "can_delete": can_del,
            "is_active": is_act,
            "is_upcoming": is_upc,
            "is_ended": is_end,
        })

    return results


def get_exam_by_id(
    db: Session,
    exam_id: str,
    examiner_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    query = (
        db.query(Exam)
        .options(
            joinedload(Exam.examiner),
            selectinload(Exam.sections).selectinload(ExamSection.questions),
            selectinload(Exam.questions),
            selectinload(Exam.attempts),
        )
        .filter(Exam.id == exam_id)
    )

    if examiner_id:
        query = query.filter(Exam.examiner_id == examiner_id)

    exam = query.first()
    if not exam:
        return None

    now_utc = datetime.now(timezone.utc)
    total_q = len(exam.questions)
    total_pool_m = sum(q.marks for q in exam.questions)
    attempts_c = len(exam.attempts)
    can_del = (attempts_c == 0)

    st = exam.start_time if exam.start_time.tzinfo else exam.start_time.replace(tzinfo=timezone.utc)
    et = exam.end_time if exam.end_time.tzinfo else exam.end_time.replace(tzinfo=timezone.utc)

    is_act = (exam.status == "PUBLISHED" and st <= now_utc <= et)
    is_upc = (exam.status == "PUBLISHED" and now_utc < st)
    is_end = (now_utc > et or exam.status == "CLOSED")

    sec_responses = []
    for s in exam.sections:
        sec_q_count = len(s.questions)
        sec_q_marks = sum(q.marks for q in s.questions)
        sec_responses.append({
            "id": s.id,
            "exam_id": s.exam_id,
            "title": s.title,
            "description": s.description,
            "order": s.order,
            "target_marks": s.target_marks,
            "required_question_count": s.required_question_count,
            "total_pool_questions": sec_q_count,
            "total_pool_marks": sec_q_marks,
            "created_at": s.created_at,
        })

    return {
        "id": exam.id,
        "examiner_id": exam.examiner_id,
        "title": exam.title,
        "description": exam.description,
        "start_time": exam.start_time,
        "end_time": exam.end_time,
        "duration_minutes": exam.duration_minutes,
        "total_marks": exam.total_marks,
        "passing_marks": exam.passing_marks,
        "max_attempts": exam.max_attempts,
        "shuffle_questions": exam.shuffle_questions,
        "shuffle_options": exam.shuffle_options,
        "status": exam.status,
        "created_at": exam.created_at,
        "updated_at": exam.updated_at,
        "examiner": exam.examiner,
        "sections": sec_responses,
        "total_questions": total_q,
        "total_pool_marks": total_pool_m,
        "attempts_count": attempts_c,
        "can_delete": can_del,
        "is_active": is_act,
        "is_upcoming": is_upc,
        "is_ended": is_end,
    }


def update_exam(
    db: Session,
    exam_id: str,
    examiner_id: Optional[str],
    data: ExamUpdateRequest,
) -> Optional[Exam]:
    query = db.query(Exam).filter(Exam.id == exam_id)
    if examiner_id:
        query = query.filter(Exam.examiner_id == examiner_id)

    exam = query.first()
    if not exam:
        return None

    # Check if attempts exist - if attempts exist, prevent modifying critical evaluation fields
    attempts_count = db.query(func.count(ExamAttempt.id)).filter(ExamAttempt.exam_id == exam.id).scalar() or 0
    if attempts_count > 0:
        # Only allow updating status, title, description
        if data.title is not None:
            exam.title = data.title.strip()
        if data.description is not None:
            exam.description = data.description.strip() if data.description else None
        if data.status is not None:
            exam.status = data.status
        db.commit()
        db.refresh(exam)
        return exam

    if data.title is not None:
        exam.title = data.title.strip()
    if data.description is not None:
        exam.description = data.description.strip() if data.description else None
    if data.start_time is not None:
        exam.start_time = data.start_time
    if data.end_time is not None:
        exam.end_time = data.end_time
    if data.duration_minutes is not None:
        exam.duration_minutes = data.duration_minutes
    if data.total_marks is not None:
        exam.total_marks = data.total_marks
    if data.passing_marks is not None:
        exam.passing_marks = data.passing_marks
    if data.max_attempts is not None:
        exam.max_attempts = data.max_attempts
    if data.shuffle_questions is not None:
        exam.shuffle_questions = data.shuffle_questions
    if data.shuffle_options is not None:
        exam.shuffle_options = data.shuffle_options
    if data.status is not None:
        exam.status = data.status

    if data.sections is not None:
        existing_sections = (
            db.query(ExamSection)
            .filter(ExamSection.exam_id == exam.id)
            .order_by(ExamSection.order.asc())
            .all()
        )
        existing_map = {s.id: s for s in existing_sections}
        kept_section_ids = set()

        for idx, sec_input in enumerate(data.sections):
            sec_order = sec_input.order if sec_input.order is not None else (idx + 1)
            matched_sec = None
            if sec_input.id and sec_input.id in existing_map:
                matched_sec = existing_map[sec_input.id]
            elif idx < len(existing_sections):
                matched_sec = existing_sections[idx]

            if matched_sec:
                matched_sec.title = sec_input.title.strip()
                matched_sec.description = sec_input.description.strip() if sec_input.description else None
                matched_sec.order = sec_order
                matched_sec.target_marks = sec_input.target_marks
                if sec_input.required_question_count is not None:
                    matched_sec.required_question_count = sec_input.required_question_count
                kept_section_ids.add(matched_sec.id)
            else:
                new_sec = ExamSection(
                    exam_id=exam.id,
                    title=sec_input.title.strip(),
                    description=sec_input.description.strip() if sec_input.description else None,
                    order=sec_order,
                    target_marks=sec_input.target_marks,
                    required_question_count=sec_input.required_question_count,
                )
                db.add(new_sec)
                db.flush()
                kept_section_ids.add(new_sec.id)

        for s in existing_sections:
            if s.id not in kept_section_ids:
                db.delete(s)

    db.commit()
    db.refresh(exam)
    return exam


def delete_exam(
    db: Session,
    exam_id: str,
    examiner_id: Optional[str],
) -> Tuple[bool, str]:
    query = db.query(Exam).filter(Exam.id == exam_id)
    if examiner_id:
        query = query.filter(Exam.examiner_id == examiner_id)

    exam = query.first()
    if not exam:
        return False, "Exam not found or you do not have permission to delete it."

    attempts_count = db.query(func.count(ExamAttempt.id)).filter(ExamAttempt.exam_id == exam.id).scalar() or 0
    if attempts_count > 0:
        return False, "Cannot delete an examination with active or historical candidate attempts. Please Close or Archive instead."

    db.delete(exam)
    db.commit()
    return True, "Exam deleted successfully."


# ==========================================
# Section CRUD
# ==========================================

def create_exam_section(
    db: Session,
    exam_id: str,
    data: ExamSectionCreate,
) -> ExamSection:
    section = ExamSection(
        exam_id=exam_id,
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        order=data.order,
        target_marks=data.target_marks,
        required_question_count=data.required_question_count,
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return section


def get_exam_sections(db: Session, exam_id: str) -> List[ExamSection]:
    return (
        db.query(ExamSection)
        .options(selectinload(ExamSection.questions))
        .filter(ExamSection.exam_id == exam_id)
        .order_by(ExamSection.order.asc())
        .all()
    )


def update_exam_section(
    db: Session,
    section_id: str,
    data: ExamSectionUpdate,
) -> Optional[ExamSection]:
    section = db.query(ExamSection).filter(ExamSection.id == section_id).first()
    if not section:
        return None

    if data.title is not None:
        section.title = data.title.strip()
    if data.description is not None:
        section.description = data.description.strip() if data.description else None
    if data.order is not None:
        section.order = data.order
    if data.target_marks is not None:
        section.target_marks = data.target_marks
    if data.required_question_count is not None:
        section.required_question_count = data.required_question_count

    db.commit()
    db.refresh(section)
    return section


def delete_exam_section(db: Session, section_id: str) -> Tuple[bool, str]:
    section = db.query(ExamSection).filter(ExamSection.id == section_id).first()
    if not section:
        return False, "Section not found."

    attempts_count = db.query(func.count(ExamAttempt.id)).filter(ExamAttempt.exam_id == section.exam_id).scalar() or 0
    if attempts_count > 0:
        return False, "Cannot delete section after candidate attempts have started."

    db.delete(section)
    db.commit()
    return True, "Section deleted successfully."


# ==========================================
# Exact-Marks Randomization Solver
# ==========================================

def _find_exact_subset_combination(
    questions: List[QuestionBank],
    target_marks: int,
    required_count: Optional[int] = None,
) -> Optional[List[QuestionBank]]:
    """
    Dynamic programming / recursive subset-sum solver to guarantee
    every generated attempt sums EXACTLY to target_marks.
    """
    # If all questions sum up to target_marks exactly
    total_pool = sum(q.marks for q in questions)
    if total_pool == target_marks and (required_count is None or len(questions) == required_count):
        return list(questions)

    # Shuffled pool for randomized selection
    pool = list(questions)
    random.shuffle(pool)

    # Fast homogeneous case: all questions have identical marks
    mark_set = set(q.marks for q in pool)
    if len(mark_set) == 1:
        unit_mark = next(iter(mark_set))
        if target_marks % unit_mark == 0:
            k = target_marks // unit_mark
            if required_count is None or required_count == k:
                if len(pool) >= k:
                    return random.sample(pool, k)

    # General Subset-Sum with backtracking
    def backtrack(idx: int, current_sum: int, current_subset: List[QuestionBank]) -> Optional[List[QuestionBank]]:
        if current_sum == target_marks:
            if required_count is None or len(current_subset) == required_count:
                return list(current_subset)
            return None

        if idx >= len(pool) or current_sum > target_marks:
            return None

        # Try including pool[idx]
        q = pool[idx]
        current_subset.append(q)
        res = backtrack(idx + 1, current_sum + q.marks, current_subset)
        if res:
            return res
        current_subset.pop()

        # Try excluding pool[idx]
        return backtrack(idx + 1, current_sum, current_subset)

    return backtrack(0, 0, [])


def validate_exam_for_publishing(db: Session, exam_id: str) -> Tuple[bool, str]:
    """
    Validates complete exam integrity before allowing switch to PUBLISHED.
    """
    exam = (
        db.query(Exam)
        .options(
            selectinload(Exam.sections).selectinload(ExamSection.questions).selectinload(QuestionBank.options),
            selectinload(Exam.questions).selectinload(QuestionBank.options),
        )
        .filter(Exam.id == exam_id)
        .first()
    )
    if not exam:
        return False, "Exam record not found."

    if len(exam.title.strip()) < 3:
        return False, "Exam title must be at least 3 characters long."

    st = exam.start_time if exam.start_time.tzinfo else exam.start_time.replace(tzinfo=timezone.utc)
    et = exam.end_time if exam.end_time.tzinfo else exam.end_time.replace(tzinfo=timezone.utc)
    now_utc = datetime.now(timezone.utc)

    if et <= st:
        return False, "Exam End Time must be strictly after Start Time."

    if et <= now_utc:
        return False, "Exam End Time cannot be in the past."

    window_minutes = int((et - st).total_seconds() / 60)
    if exam.duration_minutes > window_minutes:
        return False, f"Exam duration ({exam.duration_minutes}m) exceeds the scheduled window ({window_minutes}m)."

    if exam.passing_marks > exam.total_marks:
        return False, "Passing marks cannot exceed total exam marks."

    if not exam.sections or len(exam.sections) == 0:
        return False, "Exam must have at least one Subject Section."

    # Validate section sum matches exam total marks
    section_target_sum = sum(s.target_marks for s in exam.sections)
    if section_target_sum != exam.total_marks:
        return False, f"Sum of section target marks ({section_target_sum}) does not equal Exam Total Marks ({exam.total_marks})."

    # Validate each section independently
    for s in exam.sections:
        if not s.questions or len(s.questions) == 0:
            return False, f"Section '{s.title}' contains no questions. Add questions before publishing."

        # Verify exact marks can be formed
        valid_combo = _find_exact_subset_combination(s.questions, s.target_marks, s.required_question_count)
        if not valid_combo:
            return False, f"Section '{s.title}' target is {s.target_marks} marks, but the available questions cannot form an exact combination of {s.target_marks} marks. Please add or adjust questions."

        # Validate options and correct answers for all questions in section
        for q in s.questions:
            q_type = q.question_type.upper()
            if q_type in ("MCQ", "MULTI_SELECT", "IMAGE"):
                if not q.options or len(q.options) < 2:
                    return False, f"Question '{q.question_text[:30]}...' in '{s.title}' must have at least 2 options."
                correct_count = sum(1 for opt in q.options if opt.is_correct)
                if q_type in ("MCQ", "IMAGE") and correct_count != 1:
                    return False, f"Question '{q.question_text[:30]}...' in '{s.title}' must have exactly 1 correct answer selected."
                if q_type == "MULTI_SELECT" and correct_count < 1:
                    return False, f"Multi-Select Question '{q.question_text[:30]}...' in '{s.title}' must have at least 1 correct answer selected."

    return True, "Exam is valid and ready for publishing."


def publish_exam(db: Session, exam_id: str, examiner_id: Optional[str]) -> Tuple[bool, str]:
    query = db.query(Exam).filter(Exam.id == exam_id)
    if examiner_id:
        query = query.filter(Exam.examiner_id == examiner_id)

    exam = query.first()
    if not exam:
        return False, "Exam not found."

    is_valid, msg = validate_exam_for_publishing(db, exam.id)
    if not is_valid:
        return False, msg

    exam.status = "PUBLISHED"
    db.commit()
    db.refresh(exam)
    return True, "Exam successfully published and scheduled for students."


def close_exam(db: Session, exam_id: str, examiner_id: Optional[str]) -> Tuple[bool, str]:
    query = db.query(Exam).filter(Exam.id == exam_id)
    if examiner_id:
        query = query.filter(Exam.examiner_id == examiner_id)

    exam = query.first()
    if not exam:
        return False, "Exam not found."

    exam.status = "CLOSED"
    db.commit()
    db.refresh(exam)
    return True, "Exam closed successfully."


# ==========================================
# Question Bank CRUD (Section Aware)
# ==========================================

def create_question(
    db: Session,
    examiner_id: str,
    data: QuestionCreateRequest,
) -> QuestionBank:
    # Resolve section and subject
    exam_id = data.exam_id
    section_id = data.section_id
    subject_name = data.subject

    if section_id:
        section = db.query(ExamSection).filter(ExamSection.id == section_id).first()
        if section:
            exam_id = section.exam_id
            subject_name = section.title

    question = QuestionBank(
        exam_id=exam_id,
        section_id=section_id,
        examiner_id=examiner_id,
        question_text=data.question_text.strip(),
        subject=subject_name.strip() if subject_name else "General",
        difficulty=data.difficulty.upper(),
        question_type=data.question_type.upper(),
        marks=data.marks,
        expected_answer=data.expected_answer.strip() if data.expected_answer else None,
        image_url=data.image_url.strip() if data.image_url else None,
        # Coding fields
        input_format=data.input_format.strip() if data.input_format else None,
        output_format=data.output_format.strip() if data.output_format else None,
        constraints=data.constraints.strip() if data.constraints else None,
        allowed_languages=json.dumps(data.allowed_languages) if data.allowed_languages else json.dumps(["python", "javascript", "cpp", "java"]),
        time_limit_seconds=float(data.time_limit_seconds or 2.0),
        memory_limit_mb=int(data.memory_limit_mb or 256),
    )
    db.add(question)
    db.flush()

    if data.options:
        for idx, opt_data in enumerate(data.options):
            option = Option(
                question_id=question.id,
                option_text=opt_data.option_text.strip(),
                is_correct=opt_data.is_correct,
                order=opt_data.order if opt_data.order is not None else idx,
            )
            db.add(option)

    if data.test_cases:
        for idx, tc_data in enumerate(data.test_cases):
            test_case = TestCase(
                question_id=question.id,
                input_data=tc_data.input_data,
                expected_output=tc_data.expected_output,
                is_sample=tc_data.is_sample,
                explanation=tc_data.explanation.strip() if tc_data.explanation else None,
                weightage_marks=float(tc_data.weightage_marks if tc_data.weightage_marks is not None else 1.0),
                order=tc_data.order if tc_data.order is not None else idx,
            )
            db.add(test_case)

    if data.boilerplates:
        for bp_data in data.boilerplates:
            bp = CodeBoilerplate(
                question_id=question.id,
                language=bp_data.language.lower().strip(),
                starter_code=bp_data.starter_code,
            )
            db.add(bp)

    db.commit()
    db.refresh(question)
    return question


def get_questions(
    db: Session,
    examiner_id: Optional[str] = None,
    exam_id: Optional[str] = None,
    section_id: Optional[str] = None,
    subject: Optional[str] = None,
    difficulty: Optional[str] = None,
    question_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[QuestionBank], int]:
    query = (
        db.query(QuestionBank)
        .options(
            selectinload(QuestionBank.options),
            selectinload(QuestionBank.test_cases),
            selectinload(QuestionBank.boilerplates),
        )
    )

    if examiner_id:
        query = query.filter(QuestionBank.examiner_id == examiner_id)

    if exam_id:
        query = query.filter(QuestionBank.exam_id == exam_id)

    if section_id:
        query = query.filter(QuestionBank.section_id == section_id)

    if subject and subject.strip() and subject.upper() != "ALL":
        query = query.filter(func.lower(QuestionBank.subject) == subject.lower().strip())

    if difficulty and difficulty.strip() and difficulty.upper() != "ALL":
        query = query.filter(QuestionBank.difficulty == difficulty.upper().strip())

    if question_type and question_type.strip() and question_type.upper() != "ALL":
        query = query.filter(QuestionBank.question_type == question_type.upper().strip())

    if search and search.strip():
        search_term = f"%{search.lower().strip()}%"
        query = query.filter(
            or_(
                func.lower(QuestionBank.question_text).like(search_term),
                func.lower(QuestionBank.subject).like(search_term),
            )
        )

    total = query.count()
    questions = query.order_by(QuestionBank.created_at.desc()).offset(skip).limit(limit).all()
    return questions, total


def get_question_by_id(
    db: Session,
    question_id: str,
    examiner_id: Optional[str] = None,
) -> Optional[QuestionBank]:
    query = (
        db.query(QuestionBank)
        .options(
            selectinload(QuestionBank.options),
            selectinload(QuestionBank.test_cases),
            selectinload(QuestionBank.boilerplates),
        )
        .filter(QuestionBank.id == question_id)
    )
    if examiner_id:
        query = query.filter(QuestionBank.examiner_id == examiner_id)
    return query.first()


def update_question(
    db: Session,
    question_id: str,
    examiner_id: str,
    data: QuestionUpdateRequest,
) -> Optional[QuestionBank]:
    question = (
        db.query(QuestionBank)
        .options(
            selectinload(QuestionBank.options),
            selectinload(QuestionBank.test_cases),
            selectinload(QuestionBank.boilerplates),
        )
        .filter(QuestionBank.id == question_id, QuestionBank.examiner_id == examiner_id)
        .first()
    )
    if not question:
        return None

    # Check if attempts exist on the associated exam
    if question.exam_id:
        attempts_c = db.query(func.count(ExamAttempt.id)).filter(ExamAttempt.exam_id == question.exam_id).scalar() or 0
        if attempts_c > 0:
            return None  # Locked

    if data.exam_id is not None:
        question.exam_id = data.exam_id
    if data.section_id is not None:
        question.section_id = data.section_id
        sec = db.query(ExamSection).filter(ExamSection.id == data.section_id).first()
        if sec:
            question.subject = sec.title

    if data.question_text is not None:
        question.question_text = data.question_text.strip()
    if data.subject is not None:
        question.subject = data.subject.strip()
    if data.difficulty is not None:
        question.difficulty = data.difficulty.upper()
    if data.question_type is not None:
        question.question_type = data.question_type.upper()
    if data.marks is not None:
        question.marks = data.marks
    if data.expected_answer is not None:
        question.expected_answer = data.expected_answer.strip() if data.expected_answer else None
    if data.image_url is not None:
        question.image_url = data.image_url.strip() if data.image_url else None

    # Coding specific fields
    if data.input_format is not None:
        question.input_format = data.input_format.strip() if data.input_format else None
    if data.output_format is not None:
        question.output_format = data.output_format.strip() if data.output_format else None
    if data.constraints is not None:
        question.constraints = data.constraints.strip() if data.constraints else None
    if data.allowed_languages is not None:
        question.allowed_languages = json.dumps(data.allowed_languages)
    if data.time_limit_seconds is not None:
        question.time_limit_seconds = float(data.time_limit_seconds)
    if data.memory_limit_mb is not None:
        question.memory_limit_mb = int(data.memory_limit_mb)

    if data.options is not None:
        db.query(Option).filter(Option.question_id == question.id).delete()
        for idx, opt_data in enumerate(data.options):
            option = Option(
                question_id=question.id,
                option_text=opt_data.option_text.strip(),
                is_correct=opt_data.is_correct,
                order=opt_data.order if opt_data.order is not None else idx,
            )
            db.add(option)

    if data.test_cases is not None:
        db.query(TestCase).filter(TestCase.question_id == question.id).delete()
        for idx, tc_data in enumerate(data.test_cases):
            test_case = TestCase(
                question_id=question.id,
                input_data=tc_data.input_data,
                expected_output=tc_data.expected_output,
                is_sample=tc_data.is_sample,
                explanation=tc_data.explanation.strip() if tc_data.explanation else None,
                weightage_marks=float(tc_data.weightage_marks if tc_data.weightage_marks is not None else 1.0),
                order=tc_data.order if tc_data.order is not None else idx,
            )
            db.add(test_case)

    if data.boilerplates is not None:
        db.query(CodeBoilerplate).filter(CodeBoilerplate.question_id == question.id).delete()
        for bp_data in data.boilerplates:
            bp = CodeBoilerplate(
                question_id=question.id,
                language=bp_data.language.lower().strip(),
                starter_code=bp_data.starter_code,
            )
            db.add(bp)

    db.commit()
    db.refresh(question)
    return question


def delete_question(
    db: Session,
    question_id: str,
    examiner_id: str,
) -> bool:
    question = (
        db.query(QuestionBank)
        .filter(QuestionBank.id == question_id, QuestionBank.examiner_id == examiner_id)
        .first()
    )
    if not question:
        return False

    if question.exam_id:
        attempts_c = db.query(func.count(ExamAttempt.id)).filter(ExamAttempt.exam_id == question.exam_id).scalar() or 0
        if attempts_c > 0:
            return False  # Locked

    db.delete(question)
    db.commit()
    return True


def get_examiner_question_stats(db: Session, examiner_id: str, exam_id: Optional[str] = None) -> Dict[str, Any]:
    query = db.query(QuestionBank).filter(QuestionBank.examiner_id == examiner_id)
    if exam_id:
        query = query.filter(QuestionBank.exam_id == exam_id)

    total_questions = query.count()
    total_marks = db.query(func.coalesce(func.sum(QuestionBank.marks), 0)).filter(
        QuestionBank.examiner_id == examiner_id,
        *( [QuestionBank.exam_id == exam_id] if exam_id else [] )
    ).scalar() or 0

    total_subjects = db.query(func.count(distinct(QuestionBank.subject))).filter(
        QuestionBank.examiner_id == examiner_id,
        *( [QuestionBank.exam_id == exam_id] if exam_id else [] )
    ).scalar() or 0

    easy_count = query.filter(QuestionBank.difficulty == "EASY").count()
    med_count = query.filter(QuestionBank.difficulty == "MEDIUM").count()
    hard_count = query.filter(QuestionBank.difficulty == "HARD").count()

    mcq_count = query.filter(QuestionBank.question_type == "MCQ").count()
    multi_count = query.filter(QuestionBank.question_type == "MULTI_SELECT").count()
    short_count = query.filter(QuestionBank.question_type == "SHORT_ANSWER").count()
    long_count = query.filter(QuestionBank.question_type == "LONG_ANSWER").count()
    image_count = query.filter(QuestionBank.question_type == "IMAGE").count()

    return {
        "totalQuestions": total_questions,
        "totalMarks": total_marks,
        "totalSubjects": total_subjects,
        "byDifficulty": {
            "EASY": easy_count,
            "MEDIUM": med_count,
            "HARD": hard_count,
        },
        "byType": {
            "MCQ": mcq_count,
            "MULTI_SELECT": multi_count,
            "SHORT_ANSWER": short_count,
            "LONG_ANSWER": long_count,
            "IMAGE": image_count,
        },
    }


def get_distinct_subjects(db: Session, examiner_id: Optional[str] = None, exam_id: Optional[str] = None) -> List[str]:
    query = db.query(distinct(QuestionBank.subject))
    if examiner_id:
        query = query.filter(QuestionBank.examiner_id == examiner_id)
    if exam_id:
        query = query.filter(QuestionBank.exam_id == exam_id)
    results = query.order_by(QuestionBank.subject.asc()).all()
    return [r[0] for r in results if r[0]]


# ==========================================
# Student Exam Attempt Lifecycle
# ==========================================

def get_or_create_student_attempt(
    db: Session,
    exam_id: str,
    student_id: str,
) -> Tuple[Optional[ExamAttempt], Optional[List[Dict[str, Any]]], str]:
    exam = (
        db.query(Exam)
        .options(
            selectinload(Exam.sections).selectinload(ExamSection.questions).selectinload(QuestionBank.options),
            selectinload(Exam.questions).selectinload(QuestionBank.options),
        )
        .filter(Exam.id == exam_id)
        .first()
    )
    if not exam:
        return None, None, "Exam not found."

    now_utc = datetime.now(timezone.utc)
    st = exam.start_time if exam.start_time.tzinfo else exam.start_time.replace(tzinfo=timezone.utc)
    et = exam.end_time if exam.end_time.tzinfo else exam.end_time.replace(tzinfo=timezone.utc)

    if exam.status != "PUBLISHED":
        return None, None, "This exam is currently not published."

    if now_utc < st:
        return None, None, "This exam has not started yet."

    if now_utc > et:
        return None, None, "This exam has already ended."

    # Check existing attempts
    existing_attempts = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.exam_id == exam.id, ExamAttempt.student_id == student_id)
        .order_by(ExamAttempt.attempt_number.desc())
        .all()
    )

    # 1. Resume active attempt if IN_PROGRESS
    for att in existing_attempts:
        if att.status == "IN_PROGRESS":
            dead = att.deadline_at if att.deadline_at.tzinfo else att.deadline_at.replace(tzinfo=timezone.utc)
            if now_utc <= dead + timedelta(seconds=30):
                # Return existing paper
                questions_data = _reconstruct_student_questions(db, att, exam)
                return att, questions_data, "Resuming active exam attempt."
            else:
                # Deadline expired, auto-submit attempt
                att.status = "EXPIRED"
                att.submitted_at = dead
                db.commit()

    # 2. Check maximum attempts allowed
    completed_count = sum(1 for a in existing_attempts if a.status in ("SUBMITTED", "PENDING_EVALUATION", "EVALUATED", "EXPIRED"))
    if completed_count >= exam.max_attempts:
        return None, None, f"Maximum attempt limit ({exam.max_attempts}) reached for this examination."

    # 3. Create new randomized attempt
    attempt_num = completed_count + 1
    duration_deadline = now_utc + timedelta(minutes=exam.duration_minutes)
    deadline_at = min(duration_deadline, et)

    # Sample questions per section
    assigned_q_ids = []
    assigned_opt_orders = {}

    for section in exam.sections:
        sec_selected = _find_exact_subset_combination(
            questions=section.questions,
            target_marks=section.target_marks,
            required_count=section.required_question_count,
        )
        if not sec_selected:
            # Fallback to all questions if exact subset fails
            sec_selected = list(section.questions)

        if exam.shuffle_questions:
            random.shuffle(sec_selected)

        for q in sec_selected:
            assigned_q_ids.append(q.id)
            opts = list(q.options)
            if exam.shuffle_options and q.question_type in ("MCQ", "MULTI_SELECT", "IMAGE"):
                random.shuffle(opts)
            else:
                opts.sort(key=lambda o: o.order)
            assigned_opt_orders[q.id] = [o.id for o in opts]

    attempt = ExamAttempt(
        exam_id=exam.id,
        student_id=student_id,
        attempt_number=attempt_num,
        status="IN_PROGRESS",
        started_at=now_utc,
        deadline_at=deadline_at,
        total_marks=exam.total_marks,
        assigned_question_order=json.dumps(assigned_q_ids),
        assigned_option_orders=json.dumps(assigned_opt_orders),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    questions_data = _reconstruct_student_questions(db, attempt, exam)
    return attempt, questions_data, "New exam attempt started."


def _reconstruct_student_questions(db: Session, attempt: ExamAttempt, exam: Exam) -> List[Dict[str, Any]]:
    q_ids = json.loads(attempt.assigned_question_order)
    opt_orders = json.loads(attempt.assigned_option_orders)

    # Fetch questions with all options, test cases, and boilerplates
    questions_map = {
        q.id: q for q in db.query(QuestionBank)
        .options(
            selectinload(QuestionBank.options),
            selectinload(QuestionBank.test_cases),
            selectinload(QuestionBank.boilerplates),
            joinedload(QuestionBank.section),
        )
        .filter(QuestionBank.id.in_(q_ids))
        .all()
    }

    result = []
    for q_id in q_ids:
        q = questions_map.get(q_id)
        if not q:
            continue

        ordered_opt_ids = opt_orders.get(q_id, [])
        options_map = {opt.id: opt for opt in q.options}

        shuffled_options = []
        for idx, opt_id in enumerate(ordered_opt_ids):
            opt = options_map.get(opt_id)
            if opt:
                shuffled_options.append({
                    "id": opt.id,
                    "option_text": opt.option_text,
                    "order": idx,
                })

        # Filter only sample test cases for student view
        sample_tcs = [
            {
                "id": tc.id,
                "input_data": tc.input_data,
                "expected_output": tc.expected_output,
                "explanation": tc.explanation,
                "order": tc.order,
            }
            for tc in (q.test_cases or [])
            if tc.is_sample
        ]

        boilerplates_list = [
            {
                "id": bp.id,
                "question_id": bp.question_id,
                "language": bp.language,
                "starter_code": bp.starter_code,
                "created_at": bp.created_at,
            }
            for bp in (q.boilerplates or [])
        ]

        allowed_langs = ["python", "javascript", "cpp", "java"]
        if q.allowed_languages:
            try:
                allowed_langs = json.loads(q.allowed_languages)
            except Exception:
                pass

        result.append({
            "id": q.id,
            "section_id": q.section_id or "",
            "section_title": q.section.title if q.section else q.subject,
            "question_text": q.question_text,
            "difficulty": q.difficulty,
            "question_type": q.question_type,
            "marks": q.marks,
            "image_url": q.image_url,
            "options": shuffled_options,
            # Coding fields
            "input_format": q.input_format,
            "output_format": q.output_format,
            "constraints": q.constraints,
            "allowed_languages": allowed_langs,
            "time_limit_seconds": q.time_limit_seconds or 2.0,
            "memory_limit_mb": q.memory_limit_mb or 256,
            "sample_test_cases": sample_tcs,
            "test_cases": sample_tcs,
            "boilerplates": boilerplates_list,
        })

    return result


def record_student_heartbeat(
    db: Session,
    attempt_id: str,
    student_id: str,
    data: StudentHeartbeatRequest,
) -> bool:
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id, ExamAttempt.student_id == student_id).first()
    if not attempt or attempt.status != "IN_PROGRESS":
        return False

    for item in data.answers:
        answer = (
            db.query(StudentAnswer)
            .filter(StudentAnswer.attempt_id == attempt.id, StudentAnswer.question_id == item.question_id)
            .first()
        )
        if not answer:
            answer = StudentAnswer(
                attempt_id=attempt.id,
                question_id=item.question_id,
                selected_option_id=item.selected_option_id,
                selected_option_ids=json.dumps(item.selected_option_ids) if item.selected_option_ids else None,
                text_answer=item.text_answer,
                code_language=item.code_language,
                code_answer=item.code_answer,
                time_spent_seconds=item.delta_seconds,
            )
            db.add(answer)
        else:
            if item.selected_option_id is not None:
                answer.selected_option_id = item.selected_option_id
            if item.selected_option_ids is not None:
                answer.selected_option_ids = json.dumps(item.selected_option_ids)
            if item.text_answer is not None:
                answer.text_answer = item.text_answer
            if item.code_language is not None:
                answer.code_language = item.code_language
            if item.code_answer is not None:
                answer.code_answer = item.code_answer
            answer.time_spent_seconds += item.delta_seconds

        # Record delta time log if delta > 0
        if item.delta_seconds > 0:
            time_log = QuestionTimeLog(
                attempt_id=attempt.id,
                question_id=item.question_id,
                duration_seconds=item.delta_seconds,
            )
            db.add(time_log)

    db.commit()
    return True


def submit_student_attempt(
    db: Session,
    attempt_id: str,
    student_id: str,
    data: StudentSubmitRequest,
) -> Tuple[bool, str, Optional[ExamAttempt]]:
    attempt = (
        db.query(ExamAttempt)
        .options(joinedload(ExamAttempt.exam))
        .filter(ExamAttempt.id == attempt_id, ExamAttempt.student_id == student_id)
        .first()
    )
    if not attempt:
        return False, "Exam attempt record not found.", None

    if attempt.status in ("SUBMITTED", "PENDING_EVALUATION", "EVALUATED"):
        return False, "This exam attempt has already been submitted.", attempt

    now_utc = datetime.now(timezone.utc)
    st = attempt.started_at if attempt.started_at.tzinfo else attempt.started_at.replace(tzinfo=timezone.utc)
    total_time_s = max(1, int((now_utc - st).total_seconds()))
    attempt.total_time_seconds = total_time_s
    attempt.submitted_at = now_utc

    # Update final answers & times
    for item in data.answers:
        answer = (
            db.query(StudentAnswer)
            .filter(StudentAnswer.attempt_id == attempt.id, StudentAnswer.question_id == item.question_id)
            .first()
        )
        if not answer:
            answer = StudentAnswer(
                attempt_id=attempt.id,
                question_id=item.question_id,
                selected_option_id=item.selected_option_id,
                selected_option_ids=json.dumps(item.selected_option_ids) if item.selected_option_ids else None,
                text_answer=item.text_answer,
                code_language=item.code_language,
                code_answer=item.code_answer,
                time_spent_seconds=item.delta_seconds,
            )
            db.add(answer)
        else:
            if item.selected_option_id is not None:
                answer.selected_option_id = item.selected_option_id
            if item.selected_option_ids is not None:
                answer.selected_option_ids = json.dumps(item.selected_option_ids)
            if item.text_answer is not None:
                answer.text_answer = item.text_answer
            if item.code_language is not None:
                answer.code_language = item.code_language
            if item.code_answer is not None:
                answer.code_answer = item.code_answer
            answer.time_spent_seconds += item.delta_seconds

        if item.delta_seconds > 0:
            time_log = QuestionTimeLog(
                attempt_id=attempt.id,
                question_id=item.question_id,
                duration_seconds=item.delta_seconds,
            )
            db.add(time_log)

    db.flush()

    # Auto-grading pipeline
    q_ids = json.loads(attempt.assigned_question_order)
    questions = (
        db.query(QuestionBank)
        .options(
            selectinload(QuestionBank.options),
            selectinload(QuestionBank.test_cases),
            selectinload(QuestionBank.boilerplates),
        )
        .filter(QuestionBank.id.in_(q_ids))
        .all()
    )
    questions_map = {q.id: q for q in questions}

    answers = db.query(StudentAnswer).filter(StudentAnswer.attempt_id == attempt.id).all()
    answers_map = {a.question_id: a for a in answers}

    auto_score = 0.0

    for q_id in q_ids:
        q = questions_map.get(q_id)
        if not q:
            continue

        ans = answers_map.get(q_id)
        q_type = q.question_type.upper()

        if q_type in ("MCQ", "IMAGE"):
            correct_opt = next((o for o in q.options if o.is_correct), None)
            if ans and correct_opt and ans.selected_option_id == correct_opt.id:
                ans.is_correct = True
                ans.marks_obtained = float(q.marks)
                ans.evaluation_status = "AUTO_EVALUATED"
                auto_score += float(q.marks)
            else:
                if ans:
                    ans.is_correct = False
                    ans.marks_obtained = 0.0
                    ans.evaluation_status = "AUTO_EVALUATED"

        elif q_type == "MULTI_SELECT":
            correct_ids = set(o.id for o in q.options if o.is_correct)
            selected_ids = set(json.loads(ans.selected_option_ids)) if ans and ans.selected_option_ids else set()
            if selected_ids == correct_ids and len(correct_ids) > 0:
                ans.is_correct = True
                ans.marks_obtained = float(q.marks)
                ans.evaluation_status = "AUTO_EVALUATED"
                auto_score += float(q.marks)
            else:
                if ans:
                    ans.is_correct = False
                    ans.marks_obtained = 0.0
                    ans.evaluation_status = "AUTO_EVALUATED"

        elif q_type in ("SHORT_ANSWER", "LONG_ANSWER"):
            if ans and ans.text_answer and ans.text_answer.strip():
                ai_res = evaluate_descriptive_answer(
                    question_text=q.question_text,
                    expected_answer=q.expected_answer,
                    student_answer=ans.text_answer,
                    max_marks=float(q.marks),
                    question_type=q_type,
                )
                ans.marks_obtained = ai_res.marks_obtained
                ans.examiner_feedback = ai_res.feedback
                ans.evaluation_status = "AI_EVALUATED"
                ans.is_correct = ai_res.is_correct
                auto_score += ai_res.marks_obtained
            else:
                if ans:
                    ans.marks_obtained = 0.0
                    ans.is_correct = False
                    ans.examiner_feedback = "[AI Evaluation]: Response was left blank."
                    ans.evaluation_status = "AI_EVALUATED"

        elif q_type == "CODING":
            if ans and ans.code_answer and ans.code_answer.strip():
                lang = ans.code_language or "python"
                tcs_data = [
                    {
                        "id": tc.id,
                        "input_data": tc.input_data,
                        "expected_output": tc.expected_output,
                        "is_sample": tc.is_sample,
                        "weightage_marks": tc.weightage_marks,
                    }
                    for tc in (q.test_cases or [])
                ]
                time_limit = q.time_limit_seconds or 2.0
                verdict, results, passed_cnt, total_cnt, exec_ms = evaluate_test_cases_suite(
                    language=lang,
                    code=ans.code_answer,
                    test_cases=tcs_data,
                    time_limit_seconds=time_limit,
                )
                ans.test_cases_passed = passed_cnt
                ans.total_test_cases = total_cnt
                ans.code_execution_logs = json.dumps({
                    "verdict": verdict,
                    "passed_count": passed_cnt,
                    "total_count": total_cnt,
                    "execution_time_ms": exec_ms,
                })
                earned_marks = round((passed_cnt / max(1, total_cnt)) * float(q.marks), 2) if total_cnt > 0 else 0.0
                ans.marks_obtained = earned_marks
                ans.is_correct = (passed_cnt == total_cnt and total_cnt > 0)
                ans.evaluation_status = "AUTO_EVALUATED"
                ans.examiner_feedback = f"[{verdict}]: {passed_cnt}/{total_cnt} Test Cases Passed ({earned_marks}/{q.marks} Marks)"
                auto_score += earned_marks
            else:
                if ans:
                    ans.marks_obtained = 0.0
                    ans.is_correct = False
                    ans.test_cases_passed = 0
                    ans.total_test_cases = len(q.test_cases or [])
                    ans.examiner_feedback = "[CODING]: No code submitted."
                    ans.evaluation_status = "AUTO_EVALUATED"

    total_final_score = round(auto_score, 2)
    attempt.auto_graded_score = total_final_score
    attempt.manual_graded_score = 0.0
    attempt.has_pending_descriptive = False
    attempt.status = "EVALUATED"
    attempt.score = total_final_score
    attempt.percentage = round((total_final_score / max(1.0, float(attempt.total_marks))) * 100, 2)
    attempt.is_passed = (total_final_score >= float(attempt.exam.passing_marks))

    db.commit()
    db.refresh(attempt)
    return True, "Exam submitted and automatically evaluated successfully.", attempt


def evaluate_attempt_descriptive_answers(
    db: Session,
    attempt_id: str,
    data: EvaluateAttemptRequest,
) -> Tuple[bool, str, Optional[ExamAttempt]]:
    attempt = (
        db.query(ExamAttempt)
        .options(joinedload(ExamAttempt.exam), selectinload(ExamAttempt.answers))
        .filter(ExamAttempt.id == attempt_id)
        .first()
    )
    if not attempt:
        return False, "Attempt not found.", None

    answers_map = {a.question_id: a for a in attempt.answers}
    manual_score = 0.0

    for eval_item in data.evaluations:
        ans = answers_map.get(eval_item.question_id)
        if ans:
            ans.marks_obtained = eval_item.marks_obtained
            ans.examiner_feedback = eval_item.feedback
            ans.evaluation_status = "MANUALLY_EVALUATED"
            ans.is_correct = (eval_item.marks_obtained > 0)
            manual_score += eval_item.marks_obtained

    attempt.manual_graded_score = manual_score
    total_score = attempt.auto_graded_score + manual_score
    attempt.score = total_score
    attempt.percentage = round((total_score / float(attempt.total_marks)) * 100, 2)
    attempt.is_passed = (total_score >= float(attempt.exam.passing_marks))
    attempt.has_pending_descriptive = False
    attempt.status = "EVALUATED"

    db.commit()
    db.refresh(attempt)
    return True, "Evaluations recorded and final score updated.", attempt


def batch_ai_evaluate_exam_attempts(
    db: Session,
    exam_id: str,
) -> Tuple[int, int]:
    """
    Evaluates all attempts with descriptive answers for an exam using AI.
    Returns (evaluated_attempts_count, total_questions_evaluated).
    """
    attempts = (
        db.query(ExamAttempt)
        .options(
            joinedload(ExamAttempt.exam),
            selectinload(ExamAttempt.answers).joinedload(StudentAnswer.question),
        )
        .filter(
            ExamAttempt.exam_id == exam_id,
            ExamAttempt.status.in_(["SUBMITTED", "PENDING_EVALUATION", "EVALUATED"]),
        )
        .all()
    )

    evaluated_attempts = 0
    total_q_evaluated = 0

    for attempt in attempts:
        has_updated = False
        answers_by_q = {a.question_id: a for a in attempt.answers}
        q_ids = json.loads(attempt.assigned_question_order) if attempt.assigned_question_order else []

        questions = (
            db.query(QuestionBank)
            .options(selectinload(QuestionBank.options))
            .filter(QuestionBank.id.in_(q_ids))
            .all()
        )
        questions_map = {q.id: q for q in questions}

        total_score = 0.0

        for q_id in q_ids:
            q = questions_map.get(q_id)
            if not q:
                continue

            ans = answers_by_q.get(q_id)
            q_type = q.question_type.upper()

            if q_type in ("MCQ", "IMAGE"):
                correct_opt = next((o for o in q.options if o.is_correct), None)
                if ans and correct_opt and ans.selected_option_id == correct_opt.id:
                    ans.marks_obtained = float(q.marks)
                    ans.is_correct = True
                    total_score += float(q.marks)
                elif ans:
                    ans.marks_obtained = 0.0
                    ans.is_correct = False

            elif q_type == "MULTI_SELECT":
                correct_ids = set(o.id for o in q.options if o.is_correct)
                selected_ids = set(json.loads(ans.selected_option_ids)) if ans and ans.selected_option_ids else set()
                if selected_ids == correct_ids and len(correct_ids) > 0:
                    ans.marks_obtained = float(q.marks)
                    ans.is_correct = True
                    total_score += float(q.marks)
                elif ans:
                    ans.marks_obtained = 0.0
                    ans.is_correct = False

            elif q_type in ("SHORT_ANSWER", "LONG_ANSWER"):
                if ans and ans.text_answer and ans.text_answer.strip():
                    ai_res = evaluate_descriptive_answer(
                        question_text=q.question_text,
                        expected_answer=q.expected_answer,
                        student_answer=ans.text_answer,
                        max_marks=float(q.marks),
                        question_type=q_type,
                    )
                    ans.marks_obtained = ai_res.marks_obtained
                    ans.examiner_feedback = ai_res.feedback
                    ans.evaluation_status = "AI_EVALUATED"
                    ans.is_correct = ai_res.is_correct
                    total_score += ai_res.marks_obtained
                elif ans:
                    ans.marks_obtained = 0.0
                    ans.is_correct = False
                    ans.examiner_feedback = "[AI Evaluation]: Response was left blank."
                    ans.evaluation_status = "AI_EVALUATED"

                has_updated = True
                total_q_evaluated += 1

        if has_updated or attempt.status == "PENDING_EVALUATION":
            attempt.score = round(total_score, 2)
            attempt.auto_graded_score = round(total_score, 2)
            attempt.manual_graded_score = 0.0
            attempt.percentage = round((total_score / max(1.0, float(attempt.total_marks))) * 100, 2)
            attempt.is_passed = (total_score >= float(attempt.exam.passing_marks))
            attempt.has_pending_descriptive = False
            attempt.status = "EVALUATED"
            evaluated_attempts += 1

    db.commit()
    return evaluated_attempts, total_q_evaluated


def get_student_attempt_result(
    db: Session,
    exam_id: str,
    student_id: str,
    attempt_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    query = (
        db.query(ExamAttempt)
        .options(
            joinedload(ExamAttempt.exam),
            joinedload(ExamAttempt.student),
            selectinload(ExamAttempt.answers).joinedload(StudentAnswer.question).selectinload(QuestionBank.options),
        )
        .filter(ExamAttempt.exam_id == exam_id, ExamAttempt.student_id == student_id)
    )

    if attempt_id:
        query = query.filter(ExamAttempt.id == attempt_id)

    attempt = query.order_by(ExamAttempt.attempt_number.desc()).first()
    if not attempt:
        return None

    q_ids = json.loads(attempt.assigned_question_order)
    questions = (
        db.query(QuestionBank)
        .options(
            selectinload(QuestionBank.options),
            selectinload(QuestionBank.test_cases),
            selectinload(QuestionBank.boilerplates),
            joinedload(QuestionBank.section),
        )
        .filter(QuestionBank.id.in_(q_ids))
        .all()
    )
    questions_map = {q.id: q for q in questions}
    answers_map = {a.question_id: a for a in attempt.answers}

    reviews = []
    total_assigned_q = len(q_ids)

    for q_id in q_ids:
        q = questions_map.get(q_id)
        if not q:
            continue

        ans = answers_map.get(q_id)
        correct_opt_ids = [o.id for o in q.options if o.is_correct]

        reviews.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "section_title": q.section.title if q.section else q.subject,
            "question_type": q.question_type,
            "difficulty": q.difficulty,
            "marks": q.marks,
            "marks_obtained": ans.marks_obtained if ans else 0.0,
            "is_correct": ans.is_correct if ans else False,
            "evaluation_status": ans.evaluation_status if ans else "UNANSWERED",
            "examiner_feedback": ans.examiner_feedback if ans else None,
            "time_spent_seconds": ans.time_spent_seconds if ans else 0,
            "selected_option_id": ans.selected_option_id if ans else None,
            "selected_option_ids": json.loads(ans.selected_option_ids) if ans and ans.selected_option_ids else None,
            "text_answer": ans.text_answer if ans else None,
            # Coding Answer Fields
            "code_language": ans.code_language if ans else None,
            "code_answer": ans.code_answer if ans else None,
            "test_cases_passed": ans.test_cases_passed if ans else 0,
            "total_test_cases": ans.total_test_cases if ans else 0,
            "code_execution_logs": ans.code_execution_logs if ans else None,
            "correct_option_ids": correct_opt_ids if attempt.status == "EVALUATED" else None,
            "expected_answer": q.expected_answer if attempt.status == "EVALUATED" else None,
            "options": [
                {
                    "id": o.id,
                    "question_id": o.question_id,
                    "option_text": o.option_text,
                    "is_correct": o.is_correct if attempt.status == "EVALUATED" else False,
                    "order": o.order,
                    "created_at": o.created_at,
                }
                for o in q.options
            ],
            "test_cases": [
                {
                    "id": tc.id,
                    "question_id": tc.question_id,
                    "input_data": tc.input_data,
                    "expected_output": tc.expected_output,
                    "is_sample": tc.is_sample,
                    "explanation": tc.explanation,
                    "weightage_marks": tc.weightage_marks,
                    "order": tc.order,
                    "created_at": tc.created_at,
                }
                for tc in (q.test_cases or [])
            ],
        })

    avg_time_per_q = round(attempt.total_time_seconds / max(1, total_assigned_q), 1)

    return {
        "success": True,
        "attempt_id": attempt.id,
        "exam_id": attempt.exam_id,
        "exam_title": attempt.exam.title,
        "student_id": attempt.student_id,
        "student_name": attempt.student.full_name,
        "student_email": attempt.student.email,
        "status": attempt.status,
        "has_pending_descriptive": attempt.has_pending_descriptive,
        "started_at": attempt.started_at,
        "submitted_at": attempt.submitted_at,
        "total_time_seconds": attempt.total_time_seconds,
        "auto_graded_score": attempt.auto_graded_score,
        "manual_graded_score": attempt.manual_graded_score,
        "score": attempt.score,
        "total_marks": attempt.total_marks,
        "percentage": attempt.percentage,
        "is_passed": attempt.is_passed,
        "average_time_per_question": avg_time_per_q,
        "answers": reviews,
    }


# ==========================================
# Leaderboard & Analytics
# ==========================================

def get_exam_leaderboard(db: Session, exam_id: str) -> Optional[Dict[str, Any]]:
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        return None

    attempts = (
        db.query(ExamAttempt)
        .options(joinedload(ExamAttempt.student))
        .filter(
            ExamAttempt.exam_id == exam.id,
            ExamAttempt.status.in_(["SUBMITTED", "PENDING_EVALUATION", "EVALUATED"]),
        )
        .order_by(
            desc(ExamAttempt.score),
            desc(ExamAttempt.percentage),
            asc(ExamAttempt.total_time_seconds),
            asc(ExamAttempt.submitted_at),
        )
        .all()
    )

    leaderboard = []
    for idx, att in enumerate(attempts):
        q_ids = json.loads(att.assigned_question_order)
        avg_time = round(att.total_time_seconds / max(1, len(q_ids)), 1)

        leaderboard.append({
            "rank": idx + 1,
            "attempt_id": att.id,
            "student_id": att.student_id,
            "student_name": att.student.full_name,
            "student_email": att.student.email,
            "score": att.score,
            "total_marks": att.total_marks,
            "percentage": att.percentage,
            "is_passed": att.is_passed,
            "status": att.status,
            "has_pending_descriptive": att.has_pending_descriptive,
            "total_time_seconds": att.total_time_seconds,
            "average_time_per_question": avg_time,
            "submitted_at": att.submitted_at,
        })

    completed_count = sum(1 for a in attempts if a.status == "EVALUATED")
    pending_count = sum(1 for a in attempts if a.status == "PENDING_EVALUATION")

    return {
        "success": True,
        "exam_id": exam.id,
        "exam_title": exam.title,
        "total_marks": exam.total_marks,
        "passing_marks": exam.passing_marks,
        "total_participants": len(attempts),
        "completed_participants": completed_count,
        "pending_evaluation_count": pending_count,
        "leaderboard": leaderboard,
    }


def get_exam_candidates(db: Session, exam_id: str) -> List[Dict[str, Any]]:
    """Return every candidate attempt for an examiner-owned assessment."""
    attempts = (
        db.query(ExamAttempt)
        .options(joinedload(ExamAttempt.student))
        .filter(ExamAttempt.exam_id == exam_id)
        .order_by(desc(ExamAttempt.started_at))
        .all()
    )
    return [
        {
            "id": attempt.id,
            "student_id": attempt.student_id,
            "student_name": attempt.student.full_name,
            "student_email": attempt.student.email,
            "attempt_number": attempt.attempt_number,
            "status": attempt.status,
            "score": attempt.score,
            "total_marks": attempt.total_marks,
            "percentage": attempt.percentage,
            "is_passed": attempt.is_passed,
            "started_at": attempt.started_at,
            "submitted_at": attempt.submitted_at,
            "has_pending_descriptive": attempt.has_pending_descriptive,
        }
        for attempt in attempts
    ]


def get_exam_analytics(db: Session, exam_id: str) -> Optional[Dict[str, Any]]:
    exam = (
        db.query(Exam)
        .options(
            selectinload(Exam.sections).selectinload(ExamSection.questions),
            selectinload(Exam.questions),
        )
        .filter(Exam.id == exam_id)
        .first()
    )
    if not exam:
        return None

    attempts = (
        db.query(ExamAttempt)
        .filter(
            ExamAttempt.exam_id == exam.id,
            ExamAttempt.status.in_(["SUBMITTED", "PENDING_EVALUATION", "EVALUATED"]),
        )
        .all()
    )

    total_attempts = len(attempts)
    completed_attempts = sum(1 for a in attempts if a.status == "EVALUATED")
    pending_attempts = sum(1 for a in attempts if a.status == "PENDING_EVALUATION")

    scores = [a.score for a in attempts]
    avg_score = round(sum(scores) / max(1, total_attempts), 2)
    highest_score = max(scores) if scores else 0.0
    lowest_score = min(scores) if scores else 0.0
    sorted_scores = sorted(scores)
    median_score = sorted_scores[len(sorted_scores) // 2] if sorted_scores else 0.0

    passed_count = sum(1 for a in attempts if a.is_passed)
    pass_rate = round((passed_count / max(1, total_attempts)) * 100, 1)
    fail_rate = round(100.0 - pass_rate, 1)

    times = [a.total_time_seconds for a in attempts]
    avg_duration = round(sum(times) / max(1, total_attempts), 1)

    # Per question cohort analytics
    q_deep_dive = []
    diff_stats = {"EASY": {"total_q": 0, "correct_sum": 0, "attempts_sum": 0},
                  "MEDIUM": {"total_q": 0, "correct_sum": 0, "attempts_sum": 0},
                  "HARD": {"total_q": 0, "correct_sum": 0, "attempts_sum": 0}}

    section_stats_map = {s.id: {"title": s.title, "target_marks": s.target_marks, "score_sum": 0.0, "count": 0} for s in exam.sections}

    all_answers = (
        db.query(StudentAnswer)
        .join(ExamAttempt, StudentAnswer.attempt_id == ExamAttempt.id)
        .filter(ExamAttempt.exam_id == exam.id)
        .all()
    )

    answers_by_question: Dict[str, List[StudentAnswer]] = {}
    for a in all_answers:
        answers_by_question.setdefault(a.question_id, []).append(a)

    for q in exam.questions:
        q_ans = answers_by_question.get(q.id, [])
        q_att_count = len(q_ans)
        q_corr_count = sum(1 for a in q_ans if a.is_correct)
        q_acc = round((q_corr_count / max(1, q_att_count)) * 100, 1) if q_att_count > 0 else 0.0
        q_avg_time = round(sum(a.time_spent_seconds for a in q_ans) / max(1, q_att_count), 1) if q_att_count > 0 else 0.0
        q_avg_marks = round(sum(a.marks_obtained for a in q_ans) / max(1, q_att_count), 2) if q_att_count > 0 else 0.0

        q_deep_dive.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "section_title": q.section.title if q.section else q.subject,
            "difficulty": q.difficulty,
            "question_type": q.question_type,
            "marks": q.marks,
            "total_attempts": q_att_count,
            "correct_attempts": q_corr_count,
            "accuracy_percentage": q_acc,
            "average_time_spent_seconds": q_avg_time,
            "average_marks_obtained": q_avg_marks,
        })

        if q.difficulty in diff_stats:
            diff_stats[q.difficulty]["total_q"] += 1
            diff_stats[q.difficulty]["correct_sum"] += q_corr_count
            diff_stats[q.difficulty]["attempts_sum"] += q_att_count

    difficulty_breakdown = []
    for diff, data in diff_stats.items():
        acc = round((data["correct_sum"] / max(1, data["attempts_sum"])) * 100, 1) if data["attempts_sum"] > 0 else 0.0
        difficulty_breakdown.append({
            "difficulty": diff,
            "total_questions": data["total_q"],
            "average_accuracy": acc,
        })

    section_breakdown = []
    for sec_id, s_data in section_stats_map.items():
        section_breakdown.append({
            "section_title": s_data["title"],
            "target_marks": s_data["target_marks"],
            "average_score": round(avg_score * (s_data["target_marks"] / max(1, exam.total_marks)), 2),
            "accuracy_percentage": pass_rate,
        })

    avg_time_per_q_cohort = round(avg_duration / max(1, len(exam.questions)), 1)

    return {
        "success": True,
        "exam_id": exam.id,
        "exam_title": exam.title,
        "total_enrolled": db.query(func.count(User.id)).filter(User.role == "STUDENT").scalar() or 0,
        "total_attempts": total_attempts,
        "completed_attempts": completed_attempts,
        "pending_evaluation_attempts": pending_attempts,
        "average_score": avg_score,
        "highest_score": highest_score,
        "lowest_score": lowest_score,
        "median_score": median_score,
        "pass_rate_percentage": pass_rate,
        "fail_rate_percentage": fail_rate,
        "average_completion_time_seconds": avg_duration,
        "average_time_per_question_seconds": avg_time_per_q_cohort,
        "difficulty_breakdown": difficulty_breakdown,
        "section_breakdown": section_breakdown,
        "question_deep_dive": q_deep_dive,
    }


# ==========================================
# Code Runner Endpoints CRUD Helpers
# ==========================================

def run_code_sample_test(
    db: Session,
    language: str,
    code: str,
    custom_input: Optional[str] = None,
    question_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Executes code either against custom input OR against sample test cases of the specified question.
    """
    if custom_input is not None or not question_id:
        # Run free-form with custom stdin
        res = execute_single_run(
            language=language,
            code=code,
            stdin_input=custom_input or "",
            time_limit_seconds=3.0,
        )
        return {
            "success": True,
            "language": language,
            "verdict": res.get("status", "SUCCESS"),
            "stdout": res.get("stdout", ""),
            "stderr": res.get("stderr", ""),
            "execution_time_ms": res.get("execution_time_ms", 0.0),
            "sample_results": [],
            "error_detail": res.get("error_detail"),
        }

    # Fetch question and sample test cases
    question = (
        db.query(QuestionBank)
        .options(selectinload(QuestionBank.test_cases))
        .filter(QuestionBank.id == question_id)
        .first()
    )
    if not question:
        res = execute_single_run(language=language, code=code, stdin_input="", time_limit_seconds=2.0)
        return {
            "success": True,
            "language": language,
            "verdict": res.get("status", "SUCCESS"),
            "stdout": res.get("stdout", ""),
            "stderr": res.get("stderr", ""),
            "execution_time_ms": res.get("execution_time_ms", 0.0),
            "sample_results": [],
            "error_detail": res.get("error_detail"),
        }

    sample_tcs = [
        {
            "id": tc.id,
            "input_data": tc.input_data,
            "expected_output": tc.expected_output,
            "is_sample": True,
        }
        for tc in (question.test_cases or [])
        if tc.is_sample
    ]

    if not sample_tcs:
        res = execute_single_run(language=language, code=code, stdin_input="", time_limit_seconds=float(question.time_limit_seconds or 2.0))
        return {
            "success": True,
            "language": language,
            "verdict": res.get("status", "SUCCESS"),
            "stdout": res.get("stdout", ""),
            "stderr": res.get("stderr", ""),
            "execution_time_ms": res.get("execution_time_ms", 0.0),
            "sample_results": [],
            "error_detail": res.get("error_detail"),
        }

    verdict, results, passed_cnt, total_cnt, exec_ms = evaluate_test_cases_suite(
        language=language,
        code=code,
        test_cases=sample_tcs,
        time_limit_seconds=float(question.time_limit_seconds or 2.0),
    )

    first_stdout = results[0].get("actual_output", "") if results else ""
    first_stderr = results[0].get("error_message", "") if results else ""

    return {
        "success": True,
        "language": language,
        "verdict": verdict,
        "stdout": first_stdout,
        "stderr": first_stderr or "",
        "execution_time_ms": exec_ms,
        "sample_results": results,
        "error_detail": None,
    }


def submit_code_evaluation(
    db: Session,
    question_id: str,
    language: str,
    code: str,
) -> Dict[str, Any]:
    """
    Evaluates candidate's code against ALL test cases (sample + hidden) for the question.
    """
    question = (
        db.query(QuestionBank)
        .options(selectinload(QuestionBank.test_cases))
        .filter(QuestionBank.id == question_id)
        .first()
    )
    if not question:
        return {
            "success": False,
            "question_id": question_id,
            "verdict": "ERROR",
            "test_cases_passed": 0,
            "total_test_cases": 0,
            "score_earned": 0.0,
            "max_marks": 0,
            "execution_time_ms": 0.0,
            "results": [],
        }

    tcs = [
        {
            "id": tc.id,
            "input_data": tc.input_data,
            "expected_output": tc.expected_output,
            "is_sample": tc.is_sample,
            "weightage_marks": tc.weightage_marks,
        }
        for tc in (question.test_cases or [])
    ]

    verdict, results, passed_cnt, total_cnt, exec_ms = evaluate_test_cases_suite(
        language=language,
        code=code,
        test_cases=tcs,
        time_limit_seconds=float(question.time_limit_seconds or 2.0),
    )

    # For hidden test cases, obscure the actual inputs/outputs from the student
    masked_results = []
    for r in results:
        is_sample = r.get("is_sample", False)
        masked_results.append({
            "test_case_id": r.get("test_case_id"),
            "is_sample": is_sample,
            "input_data": r.get("input_data") if is_sample else "[Hidden Test Case]",
            "expected_output": r.get("expected_output") if is_sample else "[Hidden Output]",
            "actual_output": r.get("actual_output") if is_sample else ("[Output Hidden]" if r.get("status") == "PASSED" else r.get("actual_output", "")),
            "status": r.get("status"),
            "execution_time_ms": r.get("execution_time_ms", 0.0),
            "error_message": r.get("error_message"),
        })

    earned = round((passed_cnt / max(1, total_cnt)) * float(question.marks), 2) if total_cnt > 0 else 0.0

    return {
        "success": True,
        "question_id": question_id,
        "verdict": verdict,
        "test_cases_passed": passed_cnt,
        "total_test_cases": total_cnt,
        "score_earned": earned,
        "max_marks": question.marks,
        "execution_time_ms": exec_ms,
        "results": masked_results,
    }

