"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  PenTool,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  User,
  FileText,
  Sparkles,
  HelpCircle,
  Save,
  Trophy,
} from "lucide-react";
import { ExamContextNav } from "@/components/ExamContextNav";

interface AnswerReview {
  question_id: string;
  question_text: string;
  section_title: string;
  question_type: string;
  difficulty: string;
  marks: number;
  marks_obtained: number;
  is_correct: boolean;
  evaluation_status: string;
  examiner_feedback?: string;
  time_spent_seconds: number;
  text_answer?: string;
  expected_answer?: string;
}

interface AttemptDetail {
  attempt_id: string;
  exam_id: string;
  exam_title: string;
  student_id: string;
  student_name: string;
  student_email: string;
  status: string;
  has_pending_descriptive: boolean;
  started_at: string;
  submitted_at: string;
  total_time_seconds: number;
  auto_graded_score: number;
  manual_graded_score: number;
  score: number;
  total_marks: number;
  percentage: number;
  is_passed: boolean;
  answers: AnswerReview[];
}

interface PendingCandidate {
  rank: number;
  attempt_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  score: number;
  total_marks: number;
  status: string;
}

export default function ExamEvaluationStudioPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const [pendingCandidates, setPendingCandidates] = useState<PendingCandidate[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [attemptLoading, setAttemptLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [aiEvaluating, setAiEvaluating] = useState(false);

  // Form state for grading
  const [evaluations, setEvaluations] = useState<{
    [qId: string]: { marks: number; feedback: string };
  }>({});

  useEffect(() => {
    if (examId) {
      fetchPendingCandidates();
    }
  }, [examId]);

  const fetchPendingCandidates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${examId}/leaderboard`);
      if (!res.ok) throw new Error("Failed to load candidates.");
      const data = await res.json();
      const pending = (data.leaderboard || []).filter(
        (c: PendingCandidate) => c.status === "PENDING_EVALUATION"
      );
      setPendingCandidates(pending);

      if (pending.length > 0 && !selectedAttemptId) {
        setSelectedAttemptId(pending[0].attempt_id);
        fetchAttemptResult(pending[0].attempt_id, pending[0].student_id);
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttemptResult = async (attemptId: string, studentId: string) => {
    try {
      setAttemptLoading(true);
      const res = await fetch(
        `/api/exams/${examId}/result?attempt_id=${attemptId}&student_id=${studentId}`
      );
      if (!res.ok) throw new Error("Failed to load attempt details.");
      const data = await res.json();
      setActiveAttempt(data);

      // Initialize evaluation fields
      const initEval: { [qId: string]: { marks: number; feedback: string } } = {};
      (data.answers || []).forEach((a: AnswerReview) => {
        if (["SHORT_ANSWER", "LONG_ANSWER"].includes(a.question_type)) {
          initEval[a.question_id] = {
            marks: a.marks_obtained || 0,
            feedback: a.examiner_feedback || "",
          };
        }
      });
      setEvaluations(initEval);
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setAttemptLoading(false);
    }
  };

  const handleSelectCandidate = (c: PendingCandidate) => {
    setSelectedAttemptId(c.attempt_id);
    fetchAttemptResult(c.attempt_id, c.student_id);
  };

  const handleMarksChange = (qId: string, maxMarks: number, val: number) => {
    const clamped = Math.max(0, Math.min(maxMarks, val));
    setEvaluations((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], marks: clamped },
    }));
  };

  const handleFeedbackChange = (qId: string, val: string) => {
    setEvaluations((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], feedback: val },
    }));
  };

  const handleSubmitEvaluations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttemptId) return;

    try {
      setSubmitting(true);
      setFeedback(null);

      const payload = {
        evaluations: Object.entries(evaluations).map(([question_id, data]) => ({
          question_id,
          marks_obtained: Number(data.marks),
          feedback: data.feedback.trim() || undefined,
        })),
      };

      const res = await fetch(`/api/exams/${examId}/evaluate/${selectedAttemptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.detail || "Failed to submit evaluations.");

      setFeedback({
        type: "success",
        msg: `Evaluations recorded successfully! Updated Total Score: ${resData.score}`,
      });

      // Refresh candidate queue
      fetchPendingCandidates();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIEvaluateAll = async () => {
    try {
      setAiEvaluating(true);
      setFeedback(null);
      const res = await fetch(`/api/exams/${examId}/ai-evaluate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || "AI evaluation failed.");

      setFeedback({
        type: "success",
        msg: data.message || "AI auto-evaluation completed successfully!",
      });

      // Refresh candidate queue & active attempt
      fetchPendingCandidates();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setAiEvaluating(false);
    }
  };

  const descriptiveAnswers = (activeAttempt?.answers || []).filter((a) =>
    ["SHORT_ANSWER", "LONG_ANSWER"].includes(a.question_type)
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Contextual Sub-Nav */}
      <ExamContextNav
        examId={examId}
        examTitle={activeAttempt?.exam_title || "Examination Workspace"}
        status="PUBLISHED"
        totalMarks={activeAttempt?.total_marks || 0}
      />

      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PenTool className="h-5 w-5 text-violet-400" />
            <span>Descriptive Grading Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Grade subjective responses, assign partial marks, and provide qualitative feedback to finalize official candidate scores.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleAIEvaluateAll}
            disabled={aiEvaluating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`h-3.5 w-3.5 ${aiEvaluating ? "animate-spin" : "text-amber-300"}`} />
            <span>{aiEvaluating ? "Evaluating with AI..." : "⚡ Auto-Evaluate All with AI"}</span>
          </button>

          <Link
            href={`/examiner/exams/${examId}/leaderboard`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>Leaderboard</span>
          </Link>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400" />
            )}
            <span className="text-sm font-medium">{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold opacity-70">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading evaluation queue...</div>
      ) : pendingCandidates.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">All Candidate Responses Evaluated!</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            There are currently no candidate submissions awaiting manual evaluation. All finalized grades are updated on the live leaderboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Candidate Queue Sidebar */}
          <div className="glass-card rounded-3xl p-4 border border-slate-800 space-y-3 h-fit">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400 px-2">
              <span>Pending Queue</span>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                {pendingCandidates.length}
              </span>
            </div>

            <div className="space-y-2">
              {pendingCandidates.map((c) => {
                const isSelected = selectedAttemptId === c.attempt_id;
                return (
                  <div
                    key={c.attempt_id}
                    onClick={() => handleSelectCandidate(c)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-violet-950/30 border-violet-500 text-white shadow-lg shadow-violet-500/10"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-bold text-xs truncate">{c.student_name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{c.student_email}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Auto-Graded: {c.score} / {c.total_marks}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grading Workspace */}
          <div className="lg:col-span-3 space-y-6">
            {attemptLoading ? (
              <div className="p-12 text-center text-slate-400">Loading student submission...</div>
            ) : !activeAttempt ? (
              <div className="p-12 text-center text-slate-400">Select a candidate to review.</div>
            ) : (
              <form onSubmit={handleSubmitEvaluations} className="space-y-6">
                {/* Candidate Info Header */}
                <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                      Reviewing Submission
                    </span>
                    <h2 className="text-xl font-bold text-white">{activeAttempt.student_name}</h2>
                    <p className="text-xs text-slate-400">{activeAttempt.student_email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Auto Score</div>
                      <div className="text-sm font-extrabold text-white">
                        {activeAttempt.auto_graded_score} / {activeAttempt.total_marks}
                      </div>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Duration</div>
                      <div className="text-sm font-extrabold text-indigo-400">
                        {Math.round(activeAttempt.total_time_seconds / 60)}m
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descriptive Questions Review Cards */}
                <div className="space-y-4">
                  {descriptiveAnswers.map((q, idx) => {
                    const currentMarks = evaluations[q.question_id]?.marks ?? 0;
                    const currentFeedback = evaluations[q.question_id]?.feedback ?? "";

                    return (
                      <div
                        key={q.question_id}
                        className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">Q{idx + 1}.</span>
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-900 border border-slate-800 text-indigo-300">
                              {q.section_title}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              {q.question_type.replace("_", " ")}
                            </span>
                            {q.evaluation_status === "AI_EVALUATED" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                <Sparkles className="h-3 w-3 text-amber-300" />
                                🤖 AI Evaluated
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-extrabold text-amber-400">
                            Max Marks: {q.marks}
                          </span>
                        </div>

                        {/* Question Prompt */}
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Question Statement
                          </div>
                          <p className="text-sm font-semibold text-white whitespace-pre-wrap">
                            {q.question_text}
                          </p>
                        </div>

                        {/* Expected Rubric */}
                        {q.expected_answer && (
                          <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-1">
                            <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>Expected Rubric / Solution Key</span>
                            </div>
                            <p className="text-xs text-indigo-200/90 whitespace-pre-wrap">
                              {q.expected_answer}
                            </p>
                          </div>
                        )}

                        {/* Candidate's Text Answer */}
                        <div className="space-y-1">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Candidate&apos;s Submitted Answer
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {q.text_answer || (
                              <span className="text-slate-500 italic">No answer submitted.</span>
                            )}
                          </div>
                        </div>

                        {/* Grading Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                              Marks Awarded (0 - {q.marks}) *
                            </label>
                            <input
                              type="number"
                              required
                              step="0.5"
                              min={0}
                              max={q.marks}
                              value={currentMarks}
                              onChange={(e) =>
                                handleMarksChange(q.question_id, q.marks, Number(e.target.value))
                              }
                              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-extrabold text-white focus:outline-none focus:border-violet-500"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                              Examiner Feedback (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Good clarity on leaf nodes, missed time complexity justification."
                              value={currentFeedback}
                              onChange={(e) =>
                                handleFeedbackChange(q.question_id, e.target.value)
                              }
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submit Evaluation Action */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white bg-violet-600 hover:bg-violet-500 shadow-xl shadow-violet-600/25 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    <span>{submitting ? "Finalizing Grades..." : "Finalize & Update Candidate Grade"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
