import os
import sys
import shutil
import tempfile
import subprocess
import time
from typing import List, Dict, Any, Optional, Tuple


# ==========================================
# Language Runtime Configurations
# ==========================================

DEFAULT_TIMEOUT_SECONDS = 2.5

def _get_java_cmd():
    java_home = os.environ.get("JAVA_HOME")
    if java_home:
        cand_javac = os.path.join(java_home, "bin", "javac.exe" if os.name == "nt" else "javac")
        cand_java = os.path.join(java_home, "bin", "java.exe" if os.name == "nt" else "java")
        if os.path.exists(cand_javac) and os.path.exists(cand_java):
            return cand_javac, cand_java
    return "javac", "java"

LANGUAGE_CONFIGS = {
    "python": {
        "file_ext": ".py",
        "file_name": "solution.py",
        "run_cmd": lambda f: [sys.executable, f],
        "needs_compile": False,
    },
    "javascript": {
        "file_ext": ".js",
        "file_name": "solution.js",
        "run_cmd": lambda f: ["node", f],
        "needs_compile": False,
    },
    "cpp": {
        "file_ext": ".cpp",
        "file_name": "solution.cpp",
        "compile_cmd": lambda src, out: ["g++", "-O2", src, "-o", out],
        "run_cmd": lambda exe: [exe],
        "needs_compile": True,
    },
    "c": {
        "file_ext": ".c",
        "file_name": "solution.c",
        "compile_cmd": lambda src, out: ["gcc", "-O2", src, "-o", out],
        "run_cmd": lambda exe: [exe],
        "needs_compile": True,
    },
    "java": {
        "file_ext": ".java",
        "file_name": "Main.java",
        "compile_cmd": lambda src, _: [_get_java_cmd()[0], src],
        "run_cmd": lambda d: [_get_java_cmd()[1], "-cp", d, "Main"],
        "needs_compile": True,
    },
}


def normalize_output(text: str) -> str:
    """Normalizes console output by stripping trailing whitespace from lines and entire output."""
    if not text:
        return ""
    lines = [line.rstrip() for line in text.strip().splitlines()]
    return "\n".join(lines)


def execute_single_run(
    language: str,
    code: str,
    stdin_input: str = "",
    time_limit_seconds: float = DEFAULT_TIMEOUT_SECONDS,
) -> Dict[str, Any]:
    """
    Executes a single run of code with standard input in an isolated scratch directory.
    Returns:
        {
            "status": "SUCCESS" | "COMPILATION_ERROR" | "RUNTIME_ERROR" | "TIME_LIMIT_EXCEEDED" | "ENV_ERROR",
            "stdout": str,
            "stderr": str,
            "execution_time_ms": float,
            "error_detail": Optional[str]
        }
    """
    lang_key = language.lower().strip()
    if lang_key not in LANGUAGE_CONFIGS:
        return {
            "status": "ENV_ERROR",
            "stdout": "",
            "stderr": f"Unsupported language: {language}",
            "execution_time_ms": 0.0,
            "error_detail": f"Language '{language}' is not configured on this judge server.",
        }

    cfg = LANGUAGE_CONFIGS[lang_key]

    with tempfile.TemporaryDirectory(prefix="judge_run_") as temp_dir:
        src_path = os.path.join(temp_dir, cfg["file_name"])

        with open(src_path, "w", encoding="utf-8") as f:
            f.write(code)

        # 1. Compilation Step (for C++, C, Java)
        if cfg["needs_compile"]:
            exe_path = os.path.join(temp_dir, "solution.exe" if os.name == "nt" else "solution.out")
            try:
                compile_args = cfg["compile_cmd"](src_path, exe_path)
                c_proc = subprocess.run(
                    compile_args,
                    cwd=temp_dir,
                    capture_output=True,
                    text=True,
                    timeout=10.0,
                )
                if c_proc.returncode != 0:
                    return {
                        "status": "COMPILATION_ERROR",
                        "stdout": "",
                        "stderr": c_proc.stderr or c_proc.stdout,
                        "execution_time_ms": 0.0,
                        "error_detail": "Compilation failed.",
                    }
            except FileNotFoundError:
                return {
                    "status": "ENV_ERROR",
                    "stdout": "",
                    "stderr": f"Compiler for '{language}' is not installed on the system PATH.",
                    "execution_time_ms": 0.0,
                    "error_detail": f"Missing compiler runtime for {language}.",
                }
            except subprocess.TimeoutExpired:
                return {
                    "status": "COMPILATION_ERROR",
                    "stdout": "",
                    "stderr": "Compilation timed out.",
                    "execution_time_ms": 0.0,
                    "error_detail": "Compilation time limit exceeded.",
                }

        # 2. Execution Step
        if lang_key == "java":
            run_args = cfg["run_cmd"](temp_dir)
        elif cfg["needs_compile"]:
            run_args = cfg["run_cmd"](exe_path)
        else:
            run_args = cfg["run_cmd"](src_path)

        start_time = time.perf_counter()
        try:
            r_proc = subprocess.run(
                run_args,
                input=stdin_input,
                cwd=temp_dir,
                capture_output=True,
                text=True,
                timeout=max(0.5, float(time_limit_seconds)),
            )
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

            if r_proc.returncode != 0:
                return {
                    "status": "RUNTIME_ERROR",
                    "stdout": r_proc.stdout or "",
                    "stderr": r_proc.stderr or "",
                    "execution_time_ms": elapsed_ms,
                    "error_detail": f"Process exited with non-zero code {r_proc.returncode}.",
                }

            return {
                "status": "SUCCESS",
                "stdout": r_proc.stdout or "",
                "stderr": r_proc.stderr or "",
                "execution_time_ms": elapsed_ms,
                "error_detail": None,
            }

        except subprocess.TimeoutExpired as te:
            elapsed_ms = round(float(time_limit_seconds) * 1000, 2)
            return {
                "status": "TIME_LIMIT_EXCEEDED",
                "stdout": te.stdout or "" if isinstance(te.stdout, str) else "",
                "stderr": "Execution timed out (Time Limit Exceeded).",
                "execution_time_ms": elapsed_ms,
                "error_detail": f"Exceeded time limit of {time_limit_seconds}s.",
            }
        except FileNotFoundError:
            return {
                "status": "ENV_ERROR",
                "stdout": "",
                "stderr": f"Runtime interpreter for '{language}' was not found.",
                "execution_time_ms": 0.0,
                "error_detail": f"Missing runtime interpreter for {language}.",
            }
        except Exception as ex:
            return {
                "status": "RUNTIME_ERROR",
                "stdout": "",
                "stderr": str(ex),
                "execution_time_ms": 0.0,
                "error_detail": f"Execution error: {str(ex)}",
            }


def evaluate_test_cases_suite(
    language: str,
    code: str,
    test_cases: List[Dict[str, Any]],
    time_limit_seconds: float = DEFAULT_TIMEOUT_SECONDS,
) -> Tuple[str, List[Dict[str, Any]], int, int, float]:
    """
    Evaluates a candidate's code against a list of test cases.
    Returns:
        (overall_verdict, results_list, passed_count, total_count, total_time_ms)
    """
    results: List[Dict[str, Any]] = []
    passed_count = 0
    total_time_ms = 0.0
    overall_verdict = "ACCEPTED"

    for tc in test_cases:
        tc_id = tc.get("id")
        input_data = tc.get("input_data", "")
        expected_output = tc.get("expected_output", "")
        is_sample = tc.get("is_sample", False)

        run_res = execute_single_run(
            language=language,
            code=code,
            stdin_input=input_data,
            time_limit_seconds=time_limit_seconds,
        )

        exec_ms = run_res.get("execution_time_ms", 0.0)
        total_time_ms += exec_ms
        actual_output = run_res.get("stdout", "")
        status = run_res.get("status")

        if status == "COMPILATION_ERROR":
            overall_verdict = "COMPILATION_ERROR"
            tc_status = "ERROR"
            error_msg = run_res.get("stderr") or "Compilation Error"
        elif status == "TIME_LIMIT_EXCEEDED":
            tc_status = "TIMEOUT"
            error_msg = "Time Limit Exceeded"
            if overall_verdict == "ACCEPTED":
                overall_verdict = "TIME_LIMIT_EXCEEDED"
        elif status == "RUNTIME_ERROR" or status == "ENV_ERROR":
            tc_status = "ERROR"
            error_msg = run_res.get("stderr") or "Runtime Error"
            if overall_verdict == "ACCEPTED":
                overall_verdict = "RUNTIME_ERROR"
        else:
            # Check equality of normalized output
            norm_actual = normalize_output(actual_output)
            norm_expected = normalize_output(expected_output)

            if norm_actual == norm_expected:
                tc_status = "PASSED"
                error_msg = None
                passed_count += 1
            else:
                tc_status = "FAILED"
                error_msg = "Wrong Answer (Output did not match expected)"
                if overall_verdict == "ACCEPTED":
                    overall_verdict = "WRONG_ANSWER"

        results.append({
            "test_case_id": tc_id,
            "is_sample": is_sample,
            "input_data": input_data,
            "expected_output": expected_output,
            "actual_output": actual_output,
            "status": tc_status,
            "execution_time_ms": exec_ms,
            "error_message": error_msg,
        })

    if passed_count == len(test_cases) and len(test_cases) > 0:
        overall_verdict = "ACCEPTED"
    elif overall_verdict == "ACCEPTED" and len(test_cases) > 0:
        overall_verdict = "WRONG_ANSWER"

    return overall_verdict, results, passed_count, len(test_cases), round(total_time_ms, 2)
