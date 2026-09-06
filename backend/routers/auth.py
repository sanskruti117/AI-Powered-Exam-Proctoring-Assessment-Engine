from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas import (
    LoginRequest,
    StudentRegisterRequest,
    ExaminerRegisterRequest,
    UserResponse,
)
from backend.crud import (
    get_user_by_email,
    get_user_by_id,
    create_student,
    create_examiner,
)
from backend.auth import (
    hash_password,
    compare_password,
    sign_token,
    verify_token,
    AUTH_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_current_user_payload(request: Request) -> Optional[dict]:
    # 1. Check HttpOnly cookie
    token = request.cookies.get(AUTH_COOKIE_NAME)
    if token:
        payload = verify_token(token)
        if payload:
            return payload

    # 2. Check Authorization Bearer header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = verify_token(token)
        if payload:
            return payload

    return None


@router.post("/register/student")
def register_student(
    body: StudentRegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    if body.password != body.confirmPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    normalized_email = body.email.lower().strip()
    existing = get_user_by_email(db, normalized_email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists",
        )

    pwd_hash = hash_password(body.password)
    user = create_student(
        db=db,
        full_name=body.fullName,
        email=normalized_email,
        password_hash=pwd_hash,
    )

    # Issue JWT token
    token = sign_token(
        {
            "userId": user.id,
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role,
            "status": user.status,
        }
    )

    # Set auth cookie
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=15 * 60,
        path="/",
        samesite="lax",
    )

    return {
        "success": True,
        "message": "Student registration successful! Redirecting...",
        "user": {
            "id": user.id,
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role,
            "status": user.status,
        },
    }


@router.post("/register/examiner")
def register_examiner(
    body: ExaminerRegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    if body.password != body.confirmPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    normalized_email = body.email.lower().strip()
    existing = get_user_by_email(db, normalized_email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists",
        )

    pwd_hash = hash_password(body.password)
    user = create_examiner(
        db=db,
        full_name=body.fullName,
        email=normalized_email,
        password_hash=pwd_hash,
        institution=body.institution,
        department=body.department,
    )

    # Issue JWT token with PENDING status
    token = sign_token(
        {
            "userId": user.id,
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role,
            "status": user.status,
            "institution": user.institution,
            "department": user.department,
        }
    )

    # Set auth cookie
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=15 * 60,
        path="/",
        samesite="lax",
    )

    return {
        "success": True,
        "message": "Examiner registration request submitted successfully. Awaiting Administrator approval.",
        "user": {
            "id": user.id,
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role,
            "status": user.status,
            "institution": user.institution,
            "department": user.department,
        },
    }


@router.post("/login")
def login(
    body: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    normalized_email = body.email.lower().strip()
    user = get_user_by_email(db, normalized_email)

    if not user or not compare_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Status: PENDING
    if user.status == "PENDING":
        token = sign_token(
            {
                "userId": user.id,
                "email": user.email,
                "fullName": user.full_name,
                "role": user.role,
                "status": user.status,
                "institution": user.institution,
                "department": user.department,
            }
        )
        response.set_cookie(
            key=AUTH_COOKIE_NAME,
            value=token,
            httponly=True,
            max_age=15 * 60,
            path="/",
            samesite="lax",
        )
        return {
            "success": True,
            "status": "PENDING",
            "message": "Your examiner account is currently pending administrator approval.",
            "redirectTo": "/pending-approval",
            "user": {
                "id": user.id,
                "email": user.email,
                "fullName": user.full_name,
                "role": user.role,
                "status": user.status,
            },
        }

    # Status: REJECTED
    if user.status == "REJECTED":
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "error": "Your examiner application was rejected by the administrator.",
                "rejectionReason": user.rejection_reason or "No specific reason provided.",
                "status": "REJECTED",
            },
        )

    # Status: SUSPENDED
    if user.status == "SUSPENDED":
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "error": "Your account has been suspended. Please contact the administrator.",
                "status": "SUSPENDED",
            },
        )

    # Status: ACTIVE
    token = sign_token(
        {
            "userId": user.id,
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role,
            "status": user.status,
            "institution": user.institution,
            "department": user.department,
        }
    )

    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=15 * 60,
        path="/",
        samesite="lax",
    )

    redirect_to = "/student"
    if user.role == "ADMIN":
        redirect_to = "/admin"
    elif user.role == "EXAMINER":
        redirect_to = "/examiner"

    return {
        "success": True,
        "message": "Login successful!",
        "redirectTo": redirect_to,
        "user": {
            "id": user.id,
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role,
            "status": user.status,
        },
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=AUTH_COOKIE_NAME, path="/")
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path="/")
    return {"success": True, "message": "Logged out successfully"}


@router.get("/me")
def get_me(request: Request, db: Session = Depends(get_db)):
    payload = get_current_user_payload(request)
    if not payload:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"authenticated": False, "user": None},
        )

    user = get_user_by_id(db, payload.get("userId"))
    if not user:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"authenticated": False, "user": None},
        )

    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role,
            "status": user.status,
            "institution": user.institution,
            "department": user.department,
            "createdAt": user.created_at.isoformat() if user.created_at else None,
            "rejectionReason": user.rejection_reason,
        },
    }
