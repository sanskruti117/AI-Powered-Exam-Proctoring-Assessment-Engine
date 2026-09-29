import os
import re
import json
import logging
import hashlib
import requests
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"), override=True)

logger = logging.getLogger("translator")

LANGUAGE_NAMES: Dict[str, str] = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "mr": "Marathi (मराठी)",
    "ml": "Malayalam (മലയാളം)",
    "te": "Telugu (తెలుగు)",
    "ta": "Tamil (தமிழ்)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "bn": "Bengali (বাংলা)",
    "gu": "Gujarati (ગુજરાતી)",
}

SARVAM_LANG_CODES: Dict[str, str] = {
    "hi": "hi-IN",
    "mr": "mr-IN",
    "ml": "ml-IN",
    "te": "te-IN",
    "ta": "ta-IN",
    "kn": "kn-IN",
    "bn": "bn-IN",
    "gu": "gu-IN",
    "en": "en-IN",
}

# In-memory translation cache: hash_key -> translation result dict
_TRANSLATION_CACHE: Dict[str, Dict[str, Any]] = {}


def _compute_cache_key(target_lang: str, question_text: str, options: List[Dict[str, Any]]) -> str:
    serialized = f"{target_lang}::{question_text}::{json.dumps(options, sort_keys=True)}"
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _translate_with_sarvam(text: str, target_lang: str, api_key: str) -> Optional[str]:
    """Translates text using Sarvam AI translation endpoint."""
    if not text or not text.strip():
        return text
    target_code = SARVAM_LANG_CODES.get(target_lang.lower().strip())
    if not target_code or target_code == "en-IN":
        return text

    try:
        url = "https://api.sarvam.ai/translate"
        headers = {
            "api-subscription-key": api_key,
            "Content-Type": "application/json",
        }
        payload = {
            "input": text.strip(),
            "source_language_code": "en-IN",
            "target_language_code": target_code,
            "mode": "formal",
            "model": "mayura:v1",
        }
        resp = requests.post(url, json=payload, headers=headers, timeout=8)
        if resp.status_code == 200:
            data = resp.json()
            translated = data.get("translated_text")
            if translated:
                return translated.strip()
    except Exception as exc:
        logger.warning(f"Sarvam translation error for text '{text[:30]}...': {exc}")
    return None


def translate_question_content(
    target_language: str,
    question_text: str,
    options: Optional[List[Dict[str, Any]]] = None,
    constraints: Optional[str] = None,
    input_format: Optional[str] = None,
    output_format: Optional[str] = None,
    question_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Translates question text, choices, and coding specifications into the specified Indian regional language or English.
    Uses Sarvam AI for fast Indian regional language translation with fallback to Gemini.
    """
    norm_lang = target_language.lower().strip()
    lang_name = LANGUAGE_NAMES.get(norm_lang, norm_lang)
    safe_options = options or []

    # If target is English or text is empty, return original
    if norm_lang == "en" or not question_text or not question_text.strip():
        return {
            "success": True,
            "target_language": norm_lang,
            "target_language_name": lang_name,
            "question_id": question_id,
            "translated_question_text": question_text,
            "translated_options": safe_options,
            "translated_constraints": constraints,
            "translated_input_format": input_format,
            "translated_output_format": output_format,
        }

    # Check Cache
    cache_key = _compute_cache_key(norm_lang, question_text, safe_options)
    if cache_key in _TRANSLATION_CACHE:
        cached = _TRANSLATION_CACHE[cache_key].copy()
        cached["question_id"] = question_id
        return cached

    # 1. First Attempt: Sarvam AI
    sarvam_key = os.environ.get("SARVAM_API_KEY") or "sk_3eqncaw5_kR3dGvNuooZNhQn3EVDoyQBX"
    if sarvam_key:
        try:
            trans_q_text = _translate_with_sarvam(question_text, norm_lang, sarvam_key)
            if trans_q_text:
                trans_opts = []
                for opt in safe_options:
                    opt_text = opt.get("option_text", "")
                    trans_opt_text = _translate_with_sarvam(opt_text, norm_lang, sarvam_key) if opt_text else opt_text
                    trans_opts.append({
                        "id": opt.get("id"),
                        "option_text": trans_opt_text or opt_text,
                    })

                trans_constraints = _translate_with_sarvam(constraints, norm_lang, sarvam_key) if constraints else constraints
                trans_in_format = _translate_with_sarvam(input_format, norm_lang, sarvam_key) if input_format else input_format
                trans_out_format = _translate_with_sarvam(output_format, norm_lang, sarvam_key) if output_format else output_format

                res = {
                    "success": True,
                    "target_language": norm_lang,
                    "target_language_name": lang_name,
                    "question_id": question_id,
                    "translated_question_text": trans_q_text,
                    "translated_options": trans_opts,
                    "translated_constraints": trans_constraints,
                    "translated_input_format": trans_in_format,
                    "translated_output_format": trans_out_format,
                    "provider": "sarvam_ai",
                }
                _TRANSLATION_CACHE[cache_key] = res
                return res
        except Exception as exc:
            logger.warning(f"Sarvam translation pipeline error: {exc}. Trying Gemini fallback.")

    # 2. Second Attempt: Gemini AI
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if gemini_key:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=gemini_key)

            prompt = f"""You are an expert multilingual academic examiner and translator.
Translate the following examination question and its choices/specifications accurately into {lang_name} ({norm_lang}).

Strict Translation Guidelines:
1. Maintain academic and technical precision in {lang_name}.
2. Keep programming keywords, mathematical expressions, variable names, and code syntax intact (e.g. O(log n), print, int, Python, Java, x, y, n).
3. Translate the question statement and option statements naturally so students can comprehend the problem clearly in their native language.
4. Return ONLY a valid JSON object matching this schema:
{{
  "translated_question_text": "Translated question text in {lang_name}",
  "translated_options": [
    {{ "id": "option_id", "option_text": "Translated option text" }}
  ],
  "translated_constraints": "Translated constraints (or null)",
  "translated_input_format": "Translated input format (or null)",
  "translated_output_format": "Translated output format (or null)"
}}

Content to translate:
Question Statement:
{question_text}

Options:
{json.dumps(safe_options, ensure_ascii=False, indent=2)}

Constraints:
{constraints or "None"}

Input Format:
{input_format or "None"}

Output Format:
{output_format or "None"}
"""

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )

            raw_text = response.text.strip() if response and response.text else ""
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
                raw_text = re.sub(r"\s*```$", "", raw_text)

            parsed = json.loads(raw_text)

            res = {
                "success": True,
                "target_language": norm_lang,
                "target_language_name": lang_name,
                "question_id": question_id,
                "translated_question_text": parsed.get("translated_question_text", question_text),
                "translated_options": parsed.get("translated_options", safe_options),
                "translated_constraints": parsed.get("translated_constraints", constraints),
                "translated_input_format": parsed.get("translated_input_format", input_format),
                "translated_output_format": parsed.get("translated_output_format", output_format),
                "provider": "gemini_ai",
            }

            _TRANSLATION_CACHE[cache_key] = res
            return res

        except Exception as exc:
            logger.warning(f"Gemini question translation error: {exc}. Falling back to original.")

    # Graceful fallback if API key unavailable or failed
    fallback_res = {
        "success": True,
        "target_language": norm_lang,
        "target_language_name": lang_name,
        "question_id": question_id,
        "translated_question_text": question_text,
        "translated_options": safe_options,
        "translated_constraints": constraints,
        "translated_input_format": input_format,
        "translated_output_format": output_format,
        "provider": "original",
    }
    return fallback_res


def batch_translate_questions_content(
    target_language: str,
    questions: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Translates a batch of questions sequentially or from cache."""
    results = []
    for q in questions:
        t_res = translate_question_content(
            target_language=target_language,
            question_text=q.get("question_text", ""),
            options=q.get("options", []),
            constraints=q.get("constraints"),
            input_format=q.get("input_format"),
            output_format=q.get("output_format"),
            question_id=q.get("question_id") or q.get("id"),
        )
        results.append(t_res)
    return results
