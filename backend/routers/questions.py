import os
import uuid
import shutil
import re
import logging
from io import BytesIO
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form, Query, status
from fastapi.responses import JSONResponse
import requests
from pypdf import PdfReader
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas import (
    QuestionCreateRequest,
    QuestionUpdateRequest,
    QuestionResponse,
    QuestionListResponse,
    QuestionStatsResponse,
)
from backend.crud import (
    create_question,
    get_questions,
    get_question_by_id,
    update_question,
    delete_question,
    get_examiner_question_stats,
    get_distinct_subjects,
)
from backend.routers.auth import get_current_user_payload
from backend.services.ai_evaluator import extract_question_set

router = APIRouter(prefix="/api/questions", tags=["questions"])
logger = logging.getLogger(__name__)

# Setup upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def require_examiner(request: Request) -> dict:
    payload = get_current_user_payload(request)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )

    role = payload.get("role")
    user_status = payload.get("status")

    if role not in ("EXAMINER", "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized. Examiner or Admin access required.",
        )

    if user_status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user_status}. Active examiner status required.",
        )

    return payload


@router.get("", response_model=QuestionListResponse)
def list_questions(
    request: Request,
    exam_id: Optional[str] = None,
    section_id: Optional[str] = None,
    subject: Optional[str] = None,
    difficulty: Optional[str] = None,
    question_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    user = require_examiner(request)
    examiner_id = user.get("userId") if user.get("role") == "EXAMINER" else None

    skip = (page - 1) * page_size
    questions, total = get_questions(
        db=db,
        examiner_id=examiner_id,
        exam_id=exam_id,
        section_id=section_id,
        subject=subject,
        difficulty=difficulty,
        question_type=question_type,
        search=search,
        skip=skip,
        limit=page_size,
    )
    subjects = get_distinct_subjects(db, examiner_id=examiner_id, exam_id=exam_id)

    return {
        "success": True,
        "total": total,
        "page": page,
        "page_size": page_size,
        "questions": questions,
        "subjects": subjects,
    }


@router.get("/stats", response_model=QuestionStatsResponse)
def get_stats(
    request: Request,
    exam_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    user = require_examiner(request)
    examiner_id = user.get("userId")

    stats = get_examiner_question_stats(db, examiner_id=examiner_id, exam_id=exam_id)
    subjects = get_distinct_subjects(db, examiner_id=examiner_id, exam_id=exam_id)

    return {
        "success": True,
        "stats": stats,
        "subjects": subjects,
    }



@router.get("/{id}", response_model=QuestionResponse)
def get_question(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner(request)
    examiner_id = user.get("userId") if user.get("role") == "EXAMINER" else None

    question = get_question_by_id(db, question_id=id, examiner_id=examiner_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    return question


@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_new_question(
    body: QuestionCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner(request)
    examiner_id = user.get("userId")

    # Validate option requirements based on type
    q_type = body.question_type.upper()
    if q_type in ("MCQ", "MULTI_SELECT", "IMAGE") and body.options:
        if len(body.options) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Multiple choice questions must have at least 2 options.",
            )

        correct_count = sum(1 for opt in body.options if opt.is_correct)
        if q_type == "MCQ" and correct_count != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MCQ must have exactly 1 correct answer selected.",
            )
        if q_type == "MULTI_SELECT" and correct_count < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Multi-select questions must have at least 1 correct answer selected.",
            )

    question = create_question(db, examiner_id=examiner_id, data=body)
    return question


@router.put("/{id}", response_model=QuestionResponse)
@router.patch("/{id}", response_model=QuestionResponse)
def update_existing_question(
    id: str,
    body: QuestionUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner(request)
    examiner_id = user.get("userId")

    # Validate option requirements if options are provided
    if body.options is not None:
        q_type = body.question_type.upper() if body.question_type else None
        if not q_type:
            existing = get_question_by_id(db, id, examiner_id)
            if existing:
                q_type = existing.question_type

        if q_type in ("MCQ", "MULTI_SELECT", "IMAGE") and len(body.options) > 0:
            if len(body.options) < 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Multiple choice questions must have at least 2 options.",
                )
            correct_count = sum(1 for opt in body.options if opt.is_correct)
            if q_type == "MCQ" and correct_count != 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="MCQ must have exactly 1 correct answer selected.",
                )
            if q_type == "MULTI_SELECT" and correct_count < 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Multi-select questions must have at least 1 correct answer selected.",
                )

    updated = update_question(db, question_id=id, examiner_id=examiner_id, data=body)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found or you do not have permission to edit it.",
        )

    return updated


@router.delete("/{id}")
def delete_existing_question(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user = require_examiner(request)
    examiner_id = user.get("userId")

    deleted = delete_question(db, question_id=id, examiner_id=examiner_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found or you do not have permission to delete it.",
        )

    return {"success": True, "message": "Question deleted successfully."}


@router.post("/upload-image")
async def upload_question_image(
    request: Request,
    file: UploadFile = File(...),
):
    require_examiner(request)

    # Validate file format
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{ext}'. Allowed: {', '.join(allowed_extensions)}",
        )

    filename = f"q_{uuid.uuid4().hex[:12]}{ext}"
    destination_path = os.path.join(UPLOAD_DIR, filename)

    with open(destination_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"/api/uploads/{filename}"
    return {
        "success": True,
        "image_url": image_url,
        "filename": filename,
    }


@router.post("/import-source")
async def import_question_source(
    request: Request,
    file: Optional[UploadFile] = File(default=None),
    google_doc_url: Optional[str] = Form(default=None),
):
    """Extract editable text from a PDF/text file or a public Google Doc."""
    require_examiner(request)

    if bool(file) == bool(google_doc_url and google_doc_url.strip()):
        raise HTTPException(status_code=400, detail="Provide either one source file or one public Google Docs link.")

    if google_doc_url and google_doc_url.strip():
        match = re.match(r"^https://docs\.google\.com/document/d/([a-zA-Z0-9_-]+)", google_doc_url.strip())
        if not match:
            raise HTTPException(status_code=400, detail="Use a public Google Docs document link (docs.google.com/document/d/...).")
        try:
            response = requests.get(
                f"https://docs.google.com/document/d/{match.group(1)}/export?format=txt",
                timeout=15,
            )
            response.raise_for_status()
            text = response.text.strip()
        except requests.RequestException as exc:
            raise HTTPException(status_code=400, detail="Could not download this Google Doc. Ensure anyone with the link can view it.") from exc
    else:
        filename = (file.filename or "").lower()
        if not filename.endswith((".pdf", ".txt", ".md", ".csv")):
            raise HTTPException(status_code=400, detail="Supported source files: PDF, TXT, Markdown, and CSV.")
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Source files must be 10 MB or smaller.")
        try:
            if filename.endswith(".pdf"):
                reader = PdfReader(BytesIO(content))
                text = "\n\n".join(page.extract_text() or "" for page in reader.pages).strip()
            else:
                text = content.decode("utf-8-sig").strip()
        except Exception as exc:
            raise HTTPException(status_code=400, detail="The source could not be read. Use a text-based, non-password-protected PDF.") from exc

    if not text:
        raise HTTPException(status_code=400, detail="No extractable text was found in this source.")
    return {"success": True, "text": text[:50000], "truncated": len(text) > 50000}


@router.post("/import-batch")
async def import_question_batch(
    request: Request,
    subject: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Extract a mixed-format PDF and create review-ready question-bank records."""
    user = require_examiner(request)
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Bulk import currently accepts PDF files.")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="PDF files must be 10 MB or smaller.")
    try:
        source_text = "\n\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(content)).pages).strip()
        extracted = extract_question_set(source_text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not extract questions from this PDF.") from exc
    created, skipped = [], 0
    for item in extracted:
        try:
            question_type = str(item.get("question_type", "SHORT_ANSWER")).upper()
            if question_type not in {"MCQ", "MULTI_SELECT", "SHORT_ANSWER", "LONG_ANSWER"}:
                skipped += 1
                continue
            options = [option for option in item.get("options", []) if option.get("option_text", "").strip()]
            if question_type == "MCQ" and sum(bool(option.get("is_correct")) for option in options) != 1:
                skipped += 1
                continue
            if question_type == "MULTI_SELECT" and sum(bool(option.get("is_correct")) for option in options) < 1:
                skipped += 1
                continue
            payload = QuestionCreateRequest(
                subject=subject.strip(), question_text=str(item.get("question_text", "")).strip(),
                question_type=question_type, difficulty=str(item.get("difficulty", "MEDIUM")).upper(),
                marks=min(100, max(1, int(item.get("marks", 1)))), expected_answer=item.get("expected_answer"),
                options=options or None,
            )
            created_question = create_question(db, user["userId"], payload)
            created.append(created_question.id)
        except Exception as exc:
            db.rollback()
            skipped += 1
            logger.warning("Skipped invalid imported question: %s", exc)
    return {"success": True, "created": len(created), "skipped": skipped, "question_ids": created}
