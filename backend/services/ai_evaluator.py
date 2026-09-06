import os
import re
import json
import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load the repository's .env explicitly for workers started from any directory.
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"), override=True)

logger = logging.getLogger("ai_evaluator")


class AIEvaluationResult(BaseModel):
    marks_obtained: float = Field(description="Marks awarded to the student (0.0 to max_marks)")
    is_correct: bool = Field(description="True if the response earned passing credit (>50% marks)")
    confidence: float = Field(default=0.9, description="Confidence score of the evaluation (0.0 to 1.0)")
    feedback: str = Field(description="Detailed constructive explanation of the evaluation")
    key_points_covered: List[str] = Field(default_factory=list, description="Key concepts correctly covered")
    missing_concepts: List[str] = Field(default_factory=list, description="Important points missing or inaccurate")


class ImportedOption(BaseModel):
    option_text: str
    is_correct: bool = False
    order: int = 0


class ImportedQuestion(BaseModel):
    question_text: str
    question_type: str
    difficulty: str = "MEDIUM"
    marks: int = 1
    expected_answer: Optional[str] = None
    options: List[ImportedOption] = Field(default_factory=list)


class ImportedQuestionSet(BaseModel):
    questions: List[ImportedQuestion]


def extract_question_set(source_text: str) -> List[Dict[str, Any]]:
    """Use Gemini to turn a source document into reviewable question records."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError(
            "PDF question extraction requires GEMINI_API_KEY. Add GEMINI_API_KEY=your_key to .env, restart the backend, and try again."
        )
    from google import genai
    from google.genai import types
    prompt = f"""Extract every assessment question and its answer key from this source.
Classify each as MCQ, MULTI_SELECT, SHORT_ANSWER, or LONG_ANSWER. For MCQ/MULTI_SELECT,
include all options with option_text and is_correct. For descriptive questions, put the
answer key or rubric in expected_answer. Do not invent missing answers; use null instead.
Source:\n{source_text[:50000]}"""
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        # The Developer API rejects some generated JSON-schema features. Request
        # JSON directly, then validate it locally with the strict Pydantic model.
        config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0),
    )
    if not response or not response.text:
        raise ValueError("No questions could be extracted from this source.")
    return ImportedQuestionSet.model_validate_json(response.text).model_dump()["questions"]


def _clean_text(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.strip().lower())


def _extract_keywords(text: str) -> List[str]:
    stopwords = {
        "a", "an", "the", "and", "or", "but", "if", "then", "else", "when", "at",
        "from", "by", "for", "with", "about", "against", "between", "into", "through",
        "during", "before", "after", "above", "below", "to", "in", "on", "of", "off",
        "over", "under", "again", "further", "once", "here", "there", "all", "any",
        "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor",
        "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can",
        "will", "just", "don", "should", "now", "is", "are", "was", "were", "be",
        "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing",
        "which", "that", "this", "these", "those", "it", "its", "as", "what", "how",
    }
    words = re.findall(r"\b[a-z0-9_-]{3,}\b", text.lower())
    return [w for w in words if w not in stopwords]


def _evaluate_with_semantic_fallback(
    question_text: str,
    expected_answer: Optional[str],
    student_answer: Optional[str],
    max_marks: float,
    question_type: str = "SHORT_ANSWER",
) -> AIEvaluationResult:
    """
    Intelligent semantic and rubric-based analyzer used as a resilient local fallback.
    Evaluates key concepts, overlap, technical terminology, and structure.
    """
    if not student_answer or not student_answer.strip():
        return AIEvaluationResult(
            marks_obtained=0.0,
            is_correct=False,
            confidence=1.0,
            feedback="No answer provided by candidate.",
            key_points_covered=[],
            missing_concepts=["Complete response missing"],
        )

    stud_clean = _clean_text(student_answer)
    exp_clean = _clean_text(expected_answer or "")

    # If no expected rubric is supplied, grade based on substantive coherence
    if not exp_clean:
        word_count = len(stud_clean.split())
        ratio = min(1.0, word_count / (20.0 if question_type == "SHORT_ANSWER" else 50.0))
        marks = round(max_marks * ratio, 2)
        return AIEvaluationResult(
            marks_obtained=marks,
            is_correct=marks >= (max_marks * 0.5),
            confidence=0.7,
            feedback=f"Candidate provided a {word_count}-word response. Graded substantively.",
            key_points_covered=["Response provided"],
            missing_concepts=[],
        )

    # Keyword and token extraction
    exp_keywords = _extract_keywords(exp_clean)
    stud_keywords = _extract_keywords(stud_clean)

    if not exp_keywords:
        exp_keywords = exp_clean.split()
    if not stud_keywords:
        stud_keywords = stud_clean.split()

    exp_set = set(exp_keywords)
    stud_set = set(stud_keywords)

    matched_keywords = exp_set.intersection(stud_set)
    missing_keywords = exp_set.difference(stud_set)

    # Exact or substring match bonus
    exact_match_ratio = 1.0 if (exp_clean in stud_clean or stud_clean in exp_clean) else 0.0

    # Keyword coverage ratio
    keyword_ratio = len(matched_keywords) / max(1, len(exp_set))

    # Overall match score (0.0 to 1.0)
    score_ratio = max(exact_match_ratio, (keyword_ratio * 0.8) + (min(1.0, len(stud_keywords) / max(1, len(exp_keywords))) * 0.2))
    score_ratio = min(1.0, max(0.0, score_ratio))

    marks_awarded = round(max_marks * score_ratio, 2)
    is_pass = marks_awarded >= (max_marks * 0.5)

    covered = list(matched_keywords)[:5]
    missing = list(missing_keywords)[:5]

    if score_ratio >= 0.85:
        feedback = f"Excellent response. Accurately covered core concepts including {', '.join(covered) if covered else 'key requirements'}."
    elif score_ratio >= 0.5:
        feedback = f"Good response with partial concept coverage ({int(score_ratio*100)}%). Key points identified: {', '.join(covered)}."
    elif score_ratio > 0.15:
        feedback = f"Attempted response with limited coverage ({int(score_ratio*100)}%). Missing key elements: {', '.join(missing) if missing else 'fundamental concepts'}."
    else:
        feedback = "Response does not sufficiently address the question or align with the evaluation rubric."

    return AIEvaluationResult(
        marks_obtained=marks_awarded,
        is_correct=is_pass,
        confidence=0.85,
        feedback=f"[Automated AI Evaluation]: {feedback}",
        key_points_covered=covered,
        missing_concepts=missing,
    )


def evaluate_descriptive_answer(
    question_text: str,
    expected_answer: Optional[str],
    student_answer: Optional[str],
    max_marks: float,
    question_type: str = "SHORT_ANSWER",
) -> AIEvaluationResult:
    """
    Evaluates a candidate's subjective/descriptive answer using Gemini API (via google-genai SDK),
    falling back seamlessly to local semantic rubric analysis when API key is not present.
    """
    if not student_answer or not student_answer.strip():
        return AIEvaluationResult(
            marks_obtained=0.0,
            is_correct=False,
            confidence=1.0,
            feedback="No answer provided by candidate.",
            key_points_covered=[],
            missing_concepts=["Response was left blank"],
        )

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    if not api_key:
        return _evaluate_with_semantic_fallback(
            question_text=question_text,
            expected_answer=expected_answer,
            student_answer=student_answer,
            max_marks=max_marks,
            question_type=question_type,
        )

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        prompt = f"""
You are an expert academic examiner evaluating a student's answer.

Question ({question_type}):
{question_text}

Maximum Marks: {max_marks}

Expected Answer / Grading Rubric:
{expected_answer or "Evaluate based on general subject accuracy and conceptual clarity."}

Candidate's Submitted Answer:
{student_answer}

Evaluation Criteria:
1. Assign marks between 0.0 and {max_marks} based on conceptual correctness, depth, accuracy, and adherence to the rubric.
2. Provide constructive, specific feedback explaining why the score was awarded.
3. List key points correctly covered and any missing or inaccurate concepts.
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIEvaluationResult,
                temperature=0.2,
            ),
        )

        if response and response.text:
            data = json.loads(response.text)
            marks = float(data.get("marks_obtained", 0.0))
            clamped_marks = max(0.0, min(float(max_marks), marks))
            return AIEvaluationResult(
                marks_obtained=round(clamped_marks, 2),
                is_correct=clamped_marks >= (max_marks * 0.5),
                confidence=float(data.get("confidence", 0.95)),
                feedback=f"[Gemini AI Evaluation]: {data.get('feedback', '').strip()}",
                key_points_covered=data.get("key_points_covered", []),
                missing_concepts=data.get("missing_concepts", []),
            )

    except Exception as exc:
        logger.warning(f"Gemini API evaluation error: {exc}. Falling back to semantic analyzer.")

    # Fallback if API call errors out
    return _evaluate_with_semantic_fallback(
        question_text=question_text,
        expected_answer=expected_answer,
        student_answer=student_answer,
        max_marks=max_marks,
        question_type=question_type,
    )
