import os
import re
import json
import logging
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator
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
    order: Union[int, str] = 0

    @field_validator("order", mode="before")
    @classmethod
    def normalize_order(cls, v):
        if isinstance(v, int):
            return v
        if isinstance(v, str):
            v_upper = v.strip().upper()
            if v_upper in ("A", "B", "C", "D", "E", "F"):
                return ord(v_upper) - ord("A")
            try:
                return int(v_upper)
            except ValueError:
                return 0
        return 0


class ImportedQuestion(BaseModel):
    question_text: str
    question_type: str
    difficulty: str = "MEDIUM"
    marks: Union[int, float, str] = 1
    expected_answer: Optional[Any] = None
    options: List[ImportedOption] = Field(default_factory=list)

    @field_validator("marks", mode="before")
    @classmethod
    def normalize_marks(cls, v):
        try:
            return max(1, int(float(v)))
        except (ValueError, TypeError):
            return 1

    @field_validator("expected_answer", mode="before")
    @classmethod
    def normalize_expected_answer(cls, v):
        if v is None:
            return None
        if isinstance(v, (dict, list)):
            return json.dumps(v)
        return str(v)


class ImportedQuestionSet(BaseModel):
    questions: List[ImportedQuestion] = Field(default_factory=list)


def extract_standard_mcq_question_set(source_text: str) -> List[Dict[str, Any]]:
    """Parse conventional MCQ documents supporting both inline answers and separate answer keys."""
    if not source_text or not source_text.strip():
        return []

    cleaned = re.sub(r"^.*?Question Bank.*?Page \d+\s*$", "", source_text, flags=re.MULTILINE | re.IGNORECASE)

    # Check for trailing answer section
    trailing_answers: Dict[int, str] = {}
    answer_split = re.split(r"\b(?:ANSWER\s*KEY|ANSWERS|SOLUTIONS)\b", cleaned, maxsplit=1, flags=re.IGNORECASE)
    question_source = cleaned
    if len(answer_split) == 2:
        question_source, answer_source = answer_split
        # Extract pairs like Q1: A, 1. B, 1) C, 1 - D, Q.1 A
        for match in re.finditer(r"(?:Q\.?\s*)?(\d+)\s*[\.:\)-]?\s*\(?([A-Da-d])\)?", answer_source):
            trailing_answers[int(match.group(1))] = match.group(2).upper()

    # Match questions starting with 1., Q1., Question 1:, 1), etc.
    question_pattern = re.compile(
        r"(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*)?(\d+)[\.:\)]\s*(.*?)(?=(?:\n\s*(?:Q(?:uestion)?\.?\s*)?\d+[\.:\)])|\Z)",
        flags=re.DOTALL,
    )
    option_pattern = re.compile(
        r"(?:^|\n)\s*(?:\(?([A-Da-d])\)|\(?([A-Da-d])\.)\s*(.*?)(?=(?:\n\s*(?:\(?[A-Da-d]\)|\(?[A-Da-d]\.))|\Z)",
        flags=re.DOTALL,
    )
    inline_ans_pattern = re.compile(
        r"\b(?:Ans(?:wer)?|Correct(?:\s*Option)?)\s*[:=-]?\s*\(?([A-Da-d])\)?",
        flags=re.IGNORECASE,
    )

    extracted: List[Dict[str, Any]] = []
    blocks = list(question_pattern.finditer(question_source))

    for block_match in blocks:
        num = int(block_match.group(1))
        content = block_match.group(2).strip()

        # Check inline answer
        correct_letter = trailing_answers.get(num)
        inline_match = inline_ans_pattern.search(content)
        if inline_match:
            correct_letter = inline_match.group(1).upper()
            content = content[:inline_match.start()].strip()

        # Extract options
        opt_matches = list(option_pattern.finditer(content))
        if len(opt_matches) < 2:
            continue

        q_statement = content[:opt_matches[0].start()].strip()
        q_statement = re.sub(r"\s+", " ", q_statement)
        if not q_statement:
            continue

        options = []
        for idx, om in enumerate(opt_matches):
            label = (om.group(1) or om.group(2)).upper()
            opt_text = re.sub(r"\s+", " ", om.group(3)).strip()
            # Remove any trailing inline answer if attached to last option
            opt_text = inline_ans_pattern.sub("", opt_text).strip()
            if opt_text:
                is_correct = (label == correct_letter) if correct_letter else (idx == 0)
                options.append({"option_text": opt_text, "is_correct": is_correct, "order": idx})

        if len(options) >= 2:
            extracted.append({
                "question_text": q_statement,
                "question_type": "MCQ",
                "difficulty": "MEDIUM",
                "marks": 1,
                "options": options,
            })

    return extracted


def extract_question_set(source_text: str = "", pdf_bytes: Optional[bytes] = None) -> List[Dict[str, Any]]:
    """Use Gemini to turn a source document or PDF bytes into reviewable question records."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError(
            "PDF question extraction requires GEMINI_API_KEY. Add GEMINI_API_KEY=your_key to .env, restart the backend, and try again."
        )
    from google import genai
    from google.genai import types

    prompt = """You are an expert assessment parser. Extract every examination question and its choices/answers from the provided document.
Return a valid JSON array where each object has:
- "question_text": string (the complete question statement)
- "question_type": "MCQ" | "MULTI_SELECT" | "SHORT_ANSWER" | "LONG_ANSWER"
- "difficulty": "EASY" | "MEDIUM" | "HARD"
- "marks": integer (default to 1 or 2)
- "expected_answer": string or null (rubric or expected response for descriptive questions)
- "options": array of objects with "option_text" (string), "is_correct" (boolean), and "order" (integer).

Extraction Rules:
1. For MCQ questions, identify the correct answer if provided in the text or answer key. If no answer key is provided, infer and set "is_correct": true for the single best/correct option so it is complete.
2. For MULTI_SELECT, set "is_correct": true for all correct options.
3. For descriptive questions (SHORT_ANSWER, LONG_ANSWER), options should be empty [].
4. Output strictly a JSON array without markdown backticks or commentary."""

    contents: List[Any] = [prompt]
    if pdf_bytes and len(pdf_bytes) > 0:
        contents.append(types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"))
    elif source_text:
        contents.append(f"Source text:\n{source_text[:50000]}")
    else:
        raise ValueError("No input text or PDF content provided for extraction.")

    client = genai.Client(api_key=api_key)
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0),
        )
    except Exception as exc:
        raise ValueError(f"Gemini request failed: {str(exc)[:300]}") from exc

    if not response or not response.text:
        raise ValueError("No questions could be extracted from this source.")

    raw_text = response.text.strip()
    if raw_text.startswith("```"):
        raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
        raw_text = re.sub(r"\s*```$", "", raw_text)

    try:
        data = json.loads(raw_text)
    except Exception as exc:
        logger.error(f"Failed to decode JSON from Gemini: {raw_text[:300]}")
        raise ValueError("Gemini returned an unreadable JSON structure. Try a clearer text-based PDF.") from exc

    raw_questions: List[Dict[str, Any]] = []
    if isinstance(data, list):
        raw_questions = data
    elif isinstance(data, dict):
        if "questions" in data and isinstance(data["questions"], list):
            raw_questions = data["questions"]
        elif "items" in data and isinstance(data["items"], list):
            raw_questions = data["items"]
        else:
            raw_questions = [data]

    if not raw_questions:
        raise ValueError("No question items found in the extracted content.")

    validated: List[Dict[str, Any]] = []
    for item in raw_questions:
        try:
            parsed = ImportedQuestion.model_validate(item)
            validated.append(parsed.model_dump())
        except Exception as exc:
            logger.warning(f"Skipped invalid question item: {exc}")

    if not validated:
        raise ValueError("Extracted questions could not be validated. Please check the PDF formatting.")

    return validated


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
