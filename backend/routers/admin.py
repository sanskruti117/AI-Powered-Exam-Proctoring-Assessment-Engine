from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas import RejectExaminerRequest
from backend.crud import (
    get_admin_examiners,
    get_system_stats,
    approve_examiner,
    reject_examiner,
    get_user_by_id,
    get_exams,
    get_questions,
    get_distinct_subjects,
)
from backend.routers.auth import get_current_user_payload

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(request: Request) -> dict:
    payload = get_current_user_payload(request)
    if not payload or payload.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized. Admin access required.",
        )
    return payload


@router.get("/examiners")
def list_examiners(
    request: Request,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    require_admin(request)

    examiners = get_admin_examiners(db, status_filter=status)
    stats = get_system_stats(db)

    examiners_data = []
    for ex in examiners:
        approved_by_data = None
        if ex.approved_by:
            approved_by_data = {
                "fullName": ex.approved_by.full_name,
                "email": ex.approved_by.email,
            }

        examiners_data.append(
            {
                "id": ex.id,
                "email": ex.email,
                "fullName": ex.full_name,
                "role": ex.role,
                "status": ex.status,
                "institution": ex.institution,
                "department": ex.department,
                "createdAt": ex.created_at.isoformat() if ex.created_at else None,
                "approvedAt": ex.approved_at.isoformat() if ex.approved_at else None,
                "rejectionReason": ex.rejection_reason,
                "approvedBy": approved_by_data,
            }
        )

    return {
        "success": True,
        "stats": stats,
        "examiners": examiners_data,
    }


@router.get("/stats")
def get_admin_dashboard_stats(
    request: Request,
    db: Session = Depends(get_db),
):
    require_admin(request)
    stats = get_system_stats(db)
    return {
        "success": True,
        "stats": stats,
    }


@router.get("/exams")
def list_all_exams_admin(
    request: Request,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    require_admin(request)
    exams = get_exams(db, examiner_id=None, status=status, search=search)
    stats = get_system_stats(db)
    return {
        "success": True,
        "total": len(exams),
        "exams": exams,
        "stats": stats,
    }


@router.get("/questions")
def list_all_questions_admin(
    request: Request,
    subject: Optional[str] = None,
    difficulty: Optional[str] = None,
    question_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    require_admin(request)
    skip = (page - 1) * page_size
    questions_objs, total = get_questions(
        db=db,
        examiner_id=None,
        subject=subject,
        difficulty=difficulty,
        question_type=question_type,
        search=search,
        skip=skip,
        limit=page_size,
    )
    subjects = get_distinct_subjects(db, examiner_id=None)
    stats = get_system_stats(db)

    # Serialize questions
    questions_data = []
    for q in questions_objs:
        options_data = []
        if q.options:
            for opt in q.options:
                options_data.append({
                    "id": opt.id,
                    "option_text": opt.option_text,
                    "is_correct": opt.is_correct,
                    "order": opt.order,
                })

        questions_data.append({
            "id": q.id,
            "exam_id": q.exam_id,
            "section_id": q.section_id,
            "examiner_id": q.examiner_id,
            "question_text": q.question_text,
            "subject": q.subject,
            "difficulty": q.difficulty,
            "question_type": q.question_type,
            "marks": q.marks,
            "expected_answer": q.expected_answer,
            "image_url": q.image_url,
            "options": options_data,
            "created_at": q.created_at.isoformat() if q.created_at else None,
        })

    return {
        "success": True,
        "total": total,
        "page": page,
        "page_size": page_size,
        "questions": questions_data,
        "subjects": subjects,
        "stats": stats,
    }


@router.patch("/examiners/{id}/approve")
def approve_examiner_endpoint(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    admin_payload = require_admin(request)

    target_user = get_user_by_id(db, id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examiner not found",
        )

    if target_user.role != "EXAMINER":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target user is not an examiner",
        )

    updated = approve_examiner(db, id, admin_payload.get("userId"))

    return {
        "success": True,
        "message": f"Examiner {updated.full_name} has been approved successfully!",
        "examiner": {
            "id": updated.id,
            "email": updated.email,
            "fullName": updated.full_name,
            "status": updated.status,
            "approvedAt": updated.approved_at.isoformat() if updated.approved_at else None,
        },
    }


@router.patch("/examiners/{id}/reject")
def reject_examiner_endpoint(
    id: str,
    body: RejectExaminerRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    admin_payload = require_admin(request)

    target_user = get_user_by_id(db, id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examiner not found",
        )

    if target_user.role != "EXAMINER":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target user is not an examiner",
        )

    updated = reject_examiner(db, id, admin_payload.get("userId"), body.reason)

    return {
        "success": True,
        "message": f"Examiner {updated.full_name} has been rejected.",
        "examiner": {
            "id": updated.id,
            "email": updated.email,
            "fullName": updated.full_name,
            "status": updated.status,
            "rejectionReason": updated.rejection_reason,
        },
    }
