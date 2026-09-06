from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
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
