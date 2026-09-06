"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  Camera,
  Mic,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  Award,
  Layers,
  Sparkles,
} from "lucide-react";

interface OptionChoice {
  id: string;
  option_text: string;
  order: number;
}

interface ExamQuestion {
  id: string;
  section_id: string;
  section_title: string;
  question_text: string;
  difficulty: string;
  question_type: "MCQ" | "MULTI_SELECT" | "SHORT_ANSWER" | "LONG_ANSWER" | "IMAGE";
  marks: number;
  image_url?: string;
  options: OptionChoice[];
}

interface SavedAnswer {
  selected_option_id?: string;
  selected_option_ids?: string[];
  text_answer?: string;
  time_spent_seconds: number;
}

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
    activeQuestionStartTimeRef.current = Date.now();
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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center animate-pulse">
          <Layers className="h-6 w-6" />
        </div>
        <div className="text-sm font-bold text-white">Initializing Secure Proctored Chamber...</div>
        <div className="text-xs text-slate-400">Sampling exact question marks and randomizing order</div>
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
              Progress: {answeredCount} / {questions.length} Answered
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

      {/* Chamber Body: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left/Main: Active Question */}
        <div className="lg:col-span-3 glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          {currentQ ? (
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300">
                    {currentQ.section_title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {currentQ.question_type.replace("_", " ")}
                  </span>
                </div>

                <div className="text-sm font-extrabold text-amber-400 flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>{currentQ.marks} Marks</span>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-4">
                <p className="text-base sm:text-lg font-semibold text-white leading-relaxed whitespace-pre-wrap">
                  {currentQ.question_text}
                </p>

                {currentQ.image_url && (
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-md">
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
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] text-white font-mono">
                Face Detection: LOCKED
              </div>
            </div>
          </div>

          {/* Question Palette */}
          <div className="glass-card rounded-3xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
              <span>Question Palette</span>
              <span>
                {answeredCount}/{questions.length}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isAnswered =
                  !!ans?.selected_option_id ||
                  (!!ans?.selected_option_ids && ans.selected_option_ids.length > 0) ||
                  (!!ans?.text_answer && ans.text_answer.trim().length > 0);
                const isCurrent = idx === currentIdx;

                return (
                  <button
                    key={q.id}
                    onClick={() => handleNavigateQuestion(idx)}
                    className={`h-9 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950"
                        : isAnswered
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-md bg-emerald-500/20 border border-emerald-500/30" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-md bg-indigo-600" />
                <span>Current Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-md bg-slate-900 border border-slate-800" />
                <span>Unattempted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mx-auto">
                <Send className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Submit Examination?</h3>
              <p className="text-xs text-slate-400">
                You have answered <span className="text-white font-bold">{answeredCount}</span> out of{" "}
                <span className="text-white font-bold">{questions.length}</span> questions.
              </p>
            </div>

            {answeredCount < questions.length && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  You have {questions.length - answeredCount} unanswered questions. Unanswered questions will receive 0 marks.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Return to Exam
              </button>
              <button
                onClick={() => handleSubmitFinalExam(false)}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
              >
                {submitting ? "Submitting..." : "Yes, Submit Exam"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
