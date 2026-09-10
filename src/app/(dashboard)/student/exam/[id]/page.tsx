"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import {
  Clock,
  ShieldCheck,
  Camera,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  Award,
  Layers,
  Sparkles,
  Code2,
  Terminal,
  Play,
  RotateCcw,
  Sun,
  Moon,
  Check,
  X,
  RefreshCw,
  Cpu,
} from "lucide-react";

interface OptionChoice {
  id: string;
  option_text: string;
  order: number;
}

interface TestCaseStudent {
  id: string;
  input_data: string;
  expected_output: string;
  explanation?: string;
  order: number;
}

interface CodeBoilerplateItem {
  id: string;
  language: string;
  starter_code: string;
}

interface ExamQuestion {
  id: string;
  section_id: string;
  section_title: string;
  question_text: string;
  difficulty: string;
  question_type: "MCQ" | "MULTI_SELECT" | "SHORT_ANSWER" | "LONG_ANSWER" | "IMAGE" | "CODING";
  marks: number;
  image_url?: string;
  options: OptionChoice[];
  // Coding fields
  input_format?: string;
  output_format?: string;
  constraints?: string;
  allowed_languages?: string[];
  time_limit_seconds?: number;
  memory_limit_mb?: number;
  sample_test_cases?: TestCaseStudent[];
  boilerplates?: CodeBoilerplateItem[];
}

interface SavedAnswer {
  selected_option_id?: string;
  selected_option_ids?: string[];
  text_answer?: string;
  code_language?: string;
  code_answer?: string;
  test_cases_passed?: number;
  total_test_cases?: number;
  time_spent_seconds: number;
}

const DEFAULT_STARTERS: Record<string, string> = {
  python: `import sys

def solve():
    # Read inputs from standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    # TODO: Implement your solution here
    print("result")

if __name__ == "__main__":
    solve()
`,
  javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;
    // TODO: Implement your solution here
    console.log("result");
}

solve();
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // TODO: Read inputs and print result
    return 0;
}
`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // TODO: Read inputs and print result
        
        sc.close();
    }
}
`,
};

export default function StudentExamChamberPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ [qId: string]: SavedAnswer }>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [totalMarks, setTotalMarks] = useState(30);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Proctoring States
  const [proctorWarnings, setProctorWarnings] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeQuestionStartTimeRef = useRef<number>(Date.now());

  // Coding Question Workspace States
  const [activeLang, setActiveLang] = useState<string>("python");
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">("vs-dark");
  const [customStdin, setCustomStdin] = useState<string>("");
  const [activeConsoleTab, setActiveConsoleTab] = useState<"sample_tests" | "custom_input" | "submission">("sample_tests");
  const [runningCode, setRunningCode] = useState(false);
  const [codeRunResult, setCodeRunResult] = useState<any>(null);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [codeSubmitResult, setCodeSubmitResult] = useState<any>(null);

  // 1. Initialize or Resume Attempt
  useEffect(() => {
    if (examId) {
      startExamAttempt();
    }
  }, [examId]);

  const startExamAttempt = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await fetch(`/api/exams/${examId}/start`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to enter exam chamber.");
      }

      setAttemptId(data.attempt_id);
      setQuestions(data.questions || []);
      setRemainingSeconds(data.remaining_seconds);
      setDurationMinutes(data.duration_minutes);
      setTotalMarks(data.total_marks);

      // Restore saved answers
      const loadedAnswers: { [qId: string]: SavedAnswer } = {};
      if (data.saved_answers) {
        Object.entries(data.saved_answers).forEach(([qId, ans]: [string, any]) => {
          loadedAnswers[qId] = {
            selected_option_id: ans.selected_option_id || undefined,
            selected_option_ids: ans.selected_option_ids || undefined,
            text_answer: ans.text_answer || undefined,
            code_language: ans.code_language || undefined,
            code_answer: ans.code_answer || undefined,
            test_cases_passed: ans.test_cases_passed || 0,
            total_test_cases: ans.total_test_cases || 0,
            time_spent_seconds: ans.time_spent_seconds || 0,
          };
        });
      }
      setAnswers(loadedAnswers);
      activeQuestionStartTimeRef.current = Date.now();

      // Start webcam preview
      initWebcam();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initWebcam = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn("Webcam access optional or denied:", err);
    }
  };

  // 2. Countdown Timer
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitOnExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  // 3. Periodic Heartbeat Sync (every 15s)
  useEffect(() => {
    if (!attemptId) return;

    const interval = setInterval(() => {
      sendHeartbeat();
    }, 15000);

    return () => clearInterval(interval);
  }, [attemptId, currentIdx, answers]);

  // 4. Tab Visibility Proctor Event Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && examId) {
        fetch(`/api/exams/${examId}/proctor-event?event_type=TAB_SWITCH&severity=HIGH&details=Candidate switched tabs or minimized window`, {
          method: "POST",
        }).catch(() => {});
        setProctorWarnings((prev) => [
          ...prev,
          `Tab switch detected at ${new Date().toLocaleTimeString()}. Incident logged.`,
        ]);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [examId]);

  const sendHeartbeat = async () => {
    if (!attemptId || questions.length === 0) return;

    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    const now = Date.now();
    const deltaSeconds = Math.max(1, Math.round((now - activeQuestionStartTimeRef.current) / 1000));
    activeQuestionStartTimeRef.current = now;

    // Update local state stopwatch
    setAnswers((prev) => {
      const existing = prev[currentQ.id] || { time_spent_seconds: 0 };
      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          time_spent_seconds: existing.time_spent_seconds + deltaSeconds,
        },
      };
    });

    const currentAns = answers[currentQ.id];
    try {
      await fetch(`/api/exams/${examId}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [
            {
              question_id: currentQ.id,
              selected_option_id: currentAns?.selected_option_id,
              selected_option_ids: currentAns?.selected_option_ids,
              text_answer: currentAns?.text_answer,
              code_language: currentAns?.code_language,
              code_answer: currentAns?.code_answer,
              delta_seconds: deltaSeconds,
            },
          ],
        }),
      });
    } catch (e) {
      console.warn("Heartbeat sync deferred:", e);
    }
  };

  const handleNavigateQuestion = (targetIdx: number) => {
    if (targetIdx === currentIdx || targetIdx < 0 || targetIdx >= questions.length) return;
    sendHeartbeat();
    setCurrentIdx(targetIdx);
    setCodeRunResult(null);
    setCodeSubmitResult(null);
    activeQuestionStartTimeRef.current = Date.now();

    const nextQ = questions[targetIdx];
    if (nextQ && nextQ.question_type === "CODING") {
      const existing = answers[nextQ.id];
      if (existing?.code_language) {
        setActiveLang(existing.code_language);
      } else if (nextQ.allowed_languages && nextQ.allowed_languages.length > 0) {
        setActiveLang(nextQ.allowed_languages[0]);
      }
    }
  };

  const handleSelectMCQ = (optionId: string) => {
    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...(prev[currentQ.id] || { time_spent_seconds: 0 }),
        selected_option_id: optionId,
      },
    }));
  };

  const handleToggleMultiSelect = (optionId: string) => {
    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    setAnswers((prev) => {
      const existing = prev[currentQ.id] || { time_spent_seconds: 0 };
      const currentSelected = existing.selected_option_ids || [];
      const updated = currentSelected.includes(optionId)
        ? currentSelected.filter((id) => id !== optionId)
        : [...currentSelected, optionId];

      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          selected_option_ids: updated,
        },
      };
    });
  };

  const handleTextAnswerChange = (val: string) => {
    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...(prev[currentQ.id] || { time_spent_seconds: 0 }),
        text_answer: val,
      },
    }));
  };

  const handleCodeAnswerChange = (codeVal: string) => {
    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...(prev[currentQ.id] || { time_spent_seconds: 0 }),
        code_language: activeLang,
        code_answer: codeVal,
      },
    }));
  };

  const getStarterCode = (q: ExamQuestion, lang: string) => {
    if (q.boilerplates && q.boilerplates.length > 0) {
      const match = q.boilerplates.find((b) => b.language.toLowerCase() === lang.toLowerCase());
      if (match) return match.starter_code;
    }
    return DEFAULT_STARTERS[lang] || "";
  };

  const handleResetStarterCode = () => {
    const currentQ = questions[currentIdx];
    if (!currentQ) return;
    const starter = getStarterCode(currentQ, activeLang);
    handleCodeAnswerChange(starter);
  };

  const handleRunSampleTests = async () => {
    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    try {
      setRunningCode(true);
      setActiveConsoleTab("sample_tests");
      setCodeRunResult(null);

      const codeVal = answers[currentQ.id]?.code_answer || getStarterCode(currentQ, activeLang);

      const res = await fetch(`/api/exams/${examId}/code/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: currentQ.id,
          language: activeLang,
          code: codeVal,
        }),
      });

      const data = await res.json();
      setCodeRunResult(data);
    } catch (e: any) {
      setCodeRunResult({
        success: false,
        verdict: "ERROR",
        stderr: e.message || "Failed to execute code run.",
      });
    } finally {
      setRunningCode(false);
    }
  };

  const handleRunCustomInput = async () => {
    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    try {
      setRunningCode(true);
      setActiveConsoleTab("custom_input");
      setCodeRunResult(null);

      const codeVal = answers[currentQ.id]?.code_answer || getStarterCode(currentQ, activeLang);

      const res = await fetch(`/api/exams/${examId}/code/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: activeLang,
          code: codeVal,
          custom_input: customStdin,
        }),
      });

      const data = await res.json();
      setCodeRunResult(data);
    } catch (e: any) {
      setCodeRunResult({
        success: false,
        verdict: "ERROR",
        stderr: e.message || "Failed to execute code run.",
      });
    } finally {
      setRunningCode(false);
    }
  };

  const handleSubmitHiddenTestCases = async () => {
    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    try {
      setSubmittingTest(true);
      setActiveConsoleTab("submission");
      setCodeSubmitResult(null);

      const codeVal = answers[currentQ.id]?.code_answer || getStarterCode(currentQ, activeLang);

      const res = await fetch(`/api/exams/${examId}/code/submit-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: currentQ.id,
          language: activeLang,
          code: codeVal,
        }),
      });

      const data = await res.json();
      setCodeSubmitResult(data);

      if (data.success) {
        setAnswers((prev) => ({
          ...prev,
          [currentQ.id]: {
            ...(prev[currentQ.id] || { time_spent_seconds: 0 }),
            code_language: activeLang,
            code_answer: codeVal,
            test_cases_passed: data.test_cases_passed,
            total_test_cases: data.total_test_cases,
          },
        }));
      }
    } catch (e: any) {
      setCodeSubmitResult({
        success: false,
        verdict: "ERROR",
        error_detail: e.message,
      });
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleAutoSubmitOnExpiry = () => {
    handleSubmitFinalExam(true);
  };

  const handleSubmitFinalExam = async (isAuto = false) => {
    if (!attemptId) return;

    try {
      setSubmitting(true);
      const now = Date.now();
      const deltaSeconds = Math.max(1, Math.round((now - activeQuestionStartTimeRef.current) / 1000));

      const payloadAnswers = questions.map((q, idx) => {
        const ans = answers[q.id];
        const isCurrent = idx === currentIdx;
        return {
          question_id: q.id,
          selected_option_id: ans?.selected_option_id || undefined,
          selected_option_ids: ans?.selected_option_ids || undefined,
          text_answer: ans?.text_answer || undefined,
          code_language: ans?.code_language || (q.question_type === "CODING" ? activeLang : undefined),
          code_answer: ans?.code_answer || (q.question_type === "CODING" ? getStarterCode(q, activeLang) : undefined),
          delta_seconds: isCurrent ? deltaSeconds : 0,
        };
      });

      const res = await fetch(`/api/exams/${examId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payloadAnswers }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to submit exam.");
      }

      // Redirect to Result Page
      router.push(`/student/exam/${examId}/result`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit exam.");
      setSubmitting(false);
    }
  };

  const formatTimer = (secs: number | null) => {
    if (secs === null) return "00:00";
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  const getMonacoLanguage = (lang: string) => {
    switch (lang.toLowerCase()) {
      case "python":
        return "python";
      case "javascript":
        return "javascript";
      case "cpp":
        return "cpp";
      case "c":
        return "c";
      case "java":
        return "java";
      default:
        return "python";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center animate-pulse">
          <Layers className="h-6 w-6" />
        </div>
        <div className="text-sm font-bold text-white">Initializing Secure Proctored Chamber...</div>
        <div className="text-xs text-slate-400">Loading assessments, code templates and randomizing palette</div>
      </div>
    );
  }

  if (errorMessage && !questions.length) {
    return (
      <div className="p-12 text-center space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Exam Chamber Access Notice</h2>
        <p className="text-sm text-slate-300">{errorMessage}</p>
        <Link
          href="/student"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;

  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    if (!a) return false;
    if (a.selected_option_id) return true;
    if (a.selected_option_ids && a.selected_option_ids.length > 0) return true;
    if (a.text_answer && a.text_answer.trim().length > 0) return true;
    if (a.code_answer && a.code_answer.trim().length > 0) return true;
    return false;
  }).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Bar: Timer, Proctor Indicator, Submit CTA */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-4 z-40 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Proctored Session Active</span>
            </div>
            <div className="text-sm font-bold text-white">
              Progress: {answeredCount} / {questions.length} Questions Answered
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-4">
          <div
            className={`px-5 py-2.5 rounded-2xl border flex items-center gap-2.5 ${
              (remainingSeconds || 0) <= 300
                ? "bg-rose-500/15 border-rose-500/40 text-rose-300 animate-pulse"
                : "bg-slate-900/90 border-slate-800 text-white"
            }`}
          >
            <Clock className="h-4 w-4 text-indigo-400" />
            <div className="text-xs text-slate-400 uppercase font-bold">Time Remaining:</div>
            <div className="text-lg font-black tracking-widest font-mono">
              {formatTimer(remainingSeconds)}
            </div>
          </div>

          <button
            onClick={() => setIsConfirmModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Finish & Submit</span>
          </button>
        </div>
      </div>

      {/* Proctor Incident Warnings */}
      {proctorWarnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
            <span>{proctorWarnings[proctorWarnings.length - 1]}</span>
          </div>
          <span className="font-bold">{proctorWarnings.length} Warnings Logged</span>
        </div>
      )}

      {/* Chamber Body */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left/Main Column: Active Question Workspace */}
        <div className="lg:col-span-3 space-y-6">
          {currentQ ? (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300">
                    {currentQ.section_title}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    {currentQ.question_type.replace("_", " ")}
                  </span>
                </div>

                <div className="text-sm font-extrabold text-amber-400 flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>{currentQ.marks} Marks</span>
                </div>
              </div>

              {/* ==================================================== */}
              {/* CODING PROBLEM WORKSPACE (LeetCode / HackerEarth UX) */}
              {/* ==================================================== */}
              {currentQ.question_type === "CODING" ? (
                <div className="space-y-6">
                  {/* Problem Description & Specifications */}
                  <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
                    <p className="text-base font-semibold text-white leading-relaxed whitespace-pre-wrap">
                      {currentQ.question_text}
                    </p>

                    {/* Constraints & Limits */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                      {currentQ.constraints && (
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                          <span className="font-bold text-slate-400 uppercase block mb-1">Constraints</span>
                          <span className="text-slate-300 font-mono whitespace-pre-wrap">{currentQ.constraints}</span>
                        </div>
                      )}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400 font-bold uppercase">Limits</span>
                        <div className="flex items-center gap-3 text-slate-300 font-mono">
                          <span>⏱️ {currentQ.time_limit_seconds || 2.0}s</span>
                          <span>💾 {currentQ.memory_limit_mb || 256}MB</span>
                        </div>
                      </div>
                    </div>

                    {/* Input/Output Format */}
                    {(currentQ.input_format || currentQ.output_format) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                        {currentQ.input_format && (
                          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                            <span className="font-bold text-slate-400 uppercase block mb-1">Input Format</span>
                            <span className="text-slate-300 whitespace-pre-wrap">{currentQ.input_format}</span>
                          </div>
                        )}
                        {currentQ.output_format && (
                          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                            <span className="font-bold text-slate-400 uppercase block mb-1">Output Format</span>
                            <span className="text-slate-300 whitespace-pre-wrap">{currentQ.output_format}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sample Test Cases (Visible to Candidate) */}
                  {currentQ.sample_test_cases && currentQ.sample_test_cases.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                        Sample Test Cases
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentQ.sample_test_cases.map((tc, sIdx) => (
                          <div key={tc.id || sIdx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                              <span>Example #{sIdx + 1}</span>
                              {tc.explanation && <span className="text-slate-500 font-normal italic">{tc.explanation}</span>}
                            </div>
                            <div className="space-y-1.5 font-mono text-xs">
                              <div>
                                <span className="text-slate-500 text-[10px] uppercase font-bold block">Input:</span>
                                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 whitespace-pre-wrap">
                                  {tc.input_data || "(empty)"}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[10px] uppercase font-bold block">Expected Output:</span>
                                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 whitespace-pre-wrap">
                                  {tc.expected_output}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monaco IDE Chamber */}
                  <div className="space-y-3 pt-2">
                    {/* IDE Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Code2 className="h-4 w-4 text-indigo-400" />
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Language:
                          </label>
                        </div>
                        <select
                          value={activeLang}
                          onChange={(e) => {
                            const newLang = e.target.value;
                            setActiveLang(newLang);
                            if (!answers[currentQ.id]?.code_answer) {
                              handleCodeAnswerChange(getStarterCode(currentQ, newLang));
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                        >
                          {(currentQ.allowed_languages || ["python", "javascript", "cpp", "java"]).map((l) => (
                            <option key={l} value={l}>
                              {l === "python" ? "Python 3" : l === "javascript" ? "JavaScript (Node.js)" : l === "cpp" ? "C++ (g++)" : l === "java" ? "Java 17" : l}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Reset Code */}
                        <button
                          type="button"
                          onClick={handleResetStarterCode}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                          title="Reset to boilerplate code"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Reset</span>
                        </button>

                        {/* Theme Switcher */}
                        <button
                          type="button"
                          onClick={() => setEditorTheme(editorTheme === "vs-dark" ? "light" : "vs-dark")}
                          className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Toggle Editor Theme"
                        >
                          {editorTheme === "vs-dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Monaco Editor Component */}
                    <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                      <Editor
                        height="380px"
                        language={getMonacoLanguage(activeLang)}
                        theme={editorTheme}
                        value={
                          currentAnswer?.code_answer !== undefined
                            ? currentAnswer.code_answer
                            : getStarterCode(currentQ, activeLang)
                        }
                        onChange={(val) => handleCodeAnswerChange(val || "")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          lineNumbers: "on",
                          automaticLayout: true,
                          scrollBeyondLastLine: false,
                          tabSize: 4,
                          wordWrap: "on",
                        }}
                      />
                    </div>
                  </div>

                  {/* Execution Console & Test Runner Tabs */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    {/* Console Header Tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveConsoleTab("sample_tests")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            activeConsoleTab === "sample_tests"
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                              : "bg-slate-900 text-slate-400 hover:text-white"
                          }`}
                        >
                          Sample Test Cases
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveConsoleTab("custom_input")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            activeConsoleTab === "custom_input"
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                              : "bg-slate-900 text-slate-400 hover:text-white"
                          }`}
                        >
                          Custom Stdin
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveConsoleTab("submission")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            activeConsoleTab === "submission"
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                              : "bg-slate-900 text-slate-400 hover:text-white"
                          }`}
                        >
                          Evaluate Hidden Suite
                        </button>
                      </div>

                      {/* Action Run Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={activeConsoleTab === "custom_input" ? handleRunCustomInput : handleRunSampleTests}
                          disabled={runningCode || submittingTest}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all disabled:opacity-50"
                        >
                          {runningCode ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 text-emerald-400" />}
                          <span>{runningCode ? "Running..." : "Run Code (Sample)"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSubmitHiddenTestCases}
                          disabled={runningCode || submittingTest}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                        >
                          {submittingTest ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          <span>{submittingTest ? "Testing..." : "Submit Code"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Console Tab Content */}
                    {activeConsoleTab === "sample_tests" && (
                      <div className="space-y-3 font-mono text-xs">
                        {codeRunResult ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-900">
                              <span className={`font-bold ${codeRunResult.verdict === "ACCEPTED" || codeRunResult.verdict === "SUCCESS" ? "text-emerald-400" : "text-rose-400"}`}>
                                Verdict: {codeRunResult.verdict}
                              </span>
                              <span className="text-slate-400 font-sans">
                                Exec Time: {codeRunResult.execution_time_ms}ms
                              </span>
                            </div>

                            {codeRunResult.sample_results && codeRunResult.sample_results.length > 0 ? (
                              <div className="space-y-2">
                                {codeRunResult.sample_results.map((r: any, idx: number) => (
                                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-white">Sample Case #{idx + 1}</span>
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${r.status === "PASSED" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"}`}>
                                        {r.status} ({r.execution_time_ms}ms)
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                                      <div>
                                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Expected:</span>
                                        <div className="text-emerald-400">{r.expected_output}</div>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Your Output:</span>
                                        <div className={r.status === "PASSED" ? "text-slate-200" : "text-rose-400"}>
                                          {r.actual_output || r.error_message || "(no output)"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                                <div>Output:</div>
                                <pre className="whitespace-pre-wrap text-emerald-400">{codeRunResult.stdout || "(no output)"}</pre>
                                {codeRunResult.stderr && <pre className="text-rose-400 mt-2 whitespace-pre-wrap">{codeRunResult.stderr}</pre>}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-500 text-xs italic p-4 text-center">
                            Click &quot;Run Code (Sample)&quot; to validate your solution against sample test cases.
                          </div>
                        )}
                      </div>
                    )}

                    {activeConsoleTab === "custom_input" && (
                      <div className="space-y-3 font-mono text-xs">
                        <textarea
                          rows={3}
                          value={customStdin}
                          onChange={(e) => setCustomStdin(e.target.value)}
                          placeholder="Type custom input values to pipe to stdin..."
                          className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        {codeRunResult && (
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                            <span className="text-slate-500 text-[10px] uppercase font-bold block">Console Output:</span>
                            <pre className="text-emerald-400 whitespace-pre-wrap">{codeRunResult.stdout || "(no stdout)"}</pre>
                            {codeRunResult.stderr && <pre className="text-rose-400 whitespace-pre-wrap">{codeRunResult.stderr}</pre>}
                          </div>
                        )}
                      </div>
                    )}

                    {activeConsoleTab === "submission" && (
                      <div className="space-y-3 font-mono text-xs">
                        {codeSubmitResult ? (
                          <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                              <div>
                                <div className={`text-sm font-bold ${codeSubmitResult.verdict === "ACCEPTED" ? "text-emerald-400" : "text-amber-400"}`}>
                                  Verdict: {codeSubmitResult.verdict}
                                </div>
                                <div className="text-slate-400 text-xs font-sans mt-0.5">
                                  Test Cases Passed: {codeSubmitResult.test_cases_passed} / {codeSubmitResult.total_test_cases}
                                </div>
                              </div>
                              <div className="text-right font-sans">
                                <div className="text-base font-extrabold text-white">
                                  {codeSubmitResult.score_earned} / {codeSubmitResult.max_marks} Marks
                                </div>
                                <div className="text-[11px] text-slate-500">{codeSubmitResult.execution_time_ms}ms total</div>
                              </div>
                            </div>

                            {/* Summary Grid of Test Case Badges */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {codeSubmitResult.results?.map((r: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                    r.status === "PASSED"
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                      : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                                  }`}
                                >
                                  <span>Case #{idx + 1}</span>
                                  <span className="font-bold">{r.status}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-500 text-xs italic p-4 text-center">
                            Click &quot;Submit Code&quot; to test against hidden test suite and save marks.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ==================================================== */
                /* STANDARD MCQ / MULTI_SELECT / DESCRIPTIVE / IMAGE    */
                /* ==================================================== */
                <div className="space-y-6">
                  {/* Question Text */}
                  <div className="space-y-4">
                    <p className="text-base sm:text-lg font-semibold text-white leading-relaxed whitespace-pre-wrap">
                      {currentQ.question_text}
                    </p>

                    {currentQ.image_url && (
                      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentQ.image_url}
                          alt="Question Context"
                          className="rounded-xl object-contain max-h-64 w-auto mx-auto"
                        />
                      </div>
                    )}
                  </div>

                  {/* Input Choices based on Question Type */}
                  <div className="pt-2 space-y-3">
                    {currentQ.question_type === "MCQ" || currentQ.question_type === "IMAGE" ? (
                      <div className="space-y-2.5">
                        {currentQ.options.map((opt, oIdx) => {
                          const isSelected = currentAnswer?.selected_option_id === opt.id;
                          const letter = String.fromCharCode(65 + oIdx);

                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleSelectMCQ(opt.id)}
                              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                                isSelected
                                  ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500"
                                  : "bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700"
                              }`}
                            >
                              <div
                                className={`h-7 w-7 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                {letter}
                              </div>
                              <span className="text-sm font-medium flex-1">{opt.option_text}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : currentQ.question_type === "MULTI_SELECT" ? (
                      <div className="space-y-2.5">
                        <div className="text-xs text-indigo-400 font-semibold mb-1">
                          (Multiple options may be correct. Select all that apply.)
                        </div>
                        {currentQ.options.map((opt, oIdx) => {
                          const isSelected = (currentAnswer?.selected_option_ids || []).includes(opt.id);
                          const letter = String.fromCharCode(65 + oIdx);

                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleToggleMultiSelect(opt.id)}
                              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                                isSelected
                                  ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500"
                                  : "bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700"
                              }`}
                            >
                              <div
                                className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-indigo-600 border-indigo-500 text-white"
                                    : "border-slate-700 bg-slate-800"
                                }`}
                              >
                                {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                              </div>
                              <span className="text-sm font-medium flex-1">{opt.option_text}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                          Write your response below:
                        </label>
                        <textarea
                          rows={currentQ.question_type === "LONG_ANSWER" ? 8 : 4}
                          value={currentAnswer?.text_answer || ""}
                          onChange={(e) => handleTextAnswerChange(e.target.value)}
                          placeholder="Type your explanation or calculations here..."
                          className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Chamber Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleNavigateQuestion(currentIdx - 1)}
                  disabled={currentIdx === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => handleNavigateQuestion(currentIdx + 1)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
                  >
                    <span>Save & Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Review & Submit</span>
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Sidebar: Webcam & Question Palette */}
        <div className="space-y-6">
          {/* Webcam Live Feed Preview */}
          <div className="glass-card rounded-3xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Camera className="h-3.5 w-3.5" />
                Live Camera Feed
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                TRACKING
              </span>
            </div>

            <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            </div>
            <div className="text-[10px] text-slate-500 text-center">
              AI proctor monitors gaze, audio, and browser focus continuously.
            </div>
          </div>

          {/* Question Navigator Palette */}
          <div className="glass-card rounded-3xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>Question Palette</span>
              <span className="text-indigo-400">{questions.length} Items</span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const a = answers[q.id];
                const isAnswered =
                  a &&
                  (a.selected_option_id ||
                    (a.selected_option_ids && a.selected_option_ids.length > 0) ||
                    (a.text_answer && a.text_answer.trim().length > 0) ||
                    (a.code_answer && a.code_answer.trim().length > 0));
                const isCurrent = idx === currentIdx;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleNavigateQuestion(idx)}
                    className={`h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center border ${
                      isCurrent
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-500/50"
                        : isAnswered
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-md bg-emerald-500/30 border border-emerald-500" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-md bg-slate-900 border border-slate-800" />
                <span>Unattempted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-md bg-indigo-600" />
                <span>Current</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation & Final Submit Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 max-w-md w-full space-y-6 shadow-2xl animate-scaleUp">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Submit Examination?</h3>
              <p className="text-xs text-slate-400">
                You have answered <span className="font-bold text-white">{answeredCount}</span> of{" "}
                <span className="font-bold text-white">{questions.length}</span> questions. Once
                submitted, your answers will be automatically graded and finalized.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Answered:</span>
                <span className="font-bold text-emerald-400">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Unanswered:</span>
                <span className="font-bold text-amber-400">{questions.length - answeredCount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Assessment Marks:</span>
                <span className="font-bold text-white">{totalMarks} Marks</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-700"
              >
                Return to Exam
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  handleSubmitFinalExam(false);
                }}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Grading...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Confirm Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
