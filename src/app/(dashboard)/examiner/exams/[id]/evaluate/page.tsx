"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Check,
  X,
  Code2,
  Layers,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { ExamContextNav } from "@/components/ExamContextNav";

interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order: number;
}

interface TestCaseItem {
  id: string;
  question_id: string;
  input_data: string;
  expected_output: string;
  is_sample: boolean;
  explanation?: string;
  weightage_marks: number;
}

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
  selected_option_id?: string;
  selected_option_ids?: string[];
  text_answer?: string;
  expected_answer?: string;
  code_language?: string;
  code_answer?: string;
  test_cases_passed?: number;
  total_test_cases?: number;
  code_execution_logs?: string;
  correct_option_ids?: string[];
  options?: QuestionOption[];
  test_cases?: TestCaseItem[];
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

interface CandidateItem {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  attempt_number: number;
  status: string;
  score: number;
  total_marks: number;
  percentage: number;
  is_passed: boolean;
  started_at: string;
  submitted_at: string;
  has_pending_descriptive: boolean;
}

function ExamEvaluationStudioContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = params?.id as string;
  const initialAttemptId = searchParams.get("attempt_id");
  const initialStudentId = searchParams.get("student_id");

  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [candidateFilter, setCandidateFilter] = useState<"ALL" | "PENDING" | "EVALUATED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(initialAttemptId);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId);
  const [activeAttempt, setActiveAttempt] = useState<AttemptDetail | null>(null);
  const [exam, setExam] = useState<any>(null);

  const [questionTabFilter, setQuestionTabFilter] = useState<"ALL" | "MCQ" | "DESCRIPTIVE" | "CODING">("ALL");

  const [loading, setLoading] = useState(true);
  const [attemptLoading, setAttemptLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishingResults, setPublishingResults] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [aiEvaluating, setAiEvaluating] = useState(false);

  // Form state for grading: question_id -> { marks, feedback }
  const [evaluations, setEvaluations] = useState<{
    [qId: string]: { marks: number; feedback: string };
  }>({});

  useEffect(() => {
    if (examId) {
      fetchCandidates();
    }
  }, [examId]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const [candRes, examRes] = await Promise.all([
        fetch(`/api/exams/${examId}/candidates`),
        fetch(`/api/exams/${examId}`),
      ]);

      if (examRes.ok) {
        const examData = await examRes.json();
        setExam(examData);
      }

      if (!candRes.ok) throw new Error("Failed to load candidate attempts.");
      const data = await candRes.json();
      const list: CandidateItem[] = data.candidates || [];
      setCandidates(list);

      // Determine which candidate attempt to load
      let targetAttempt = list.find((c) => c.id === initialAttemptId);
      if (!targetAttempt && initialStudentId) {
        targetAttempt = list.find((c) => c.student_id === initialStudentId);
      }
      if (!targetAttempt && list.length > 0) {
        const pending = list.find((c) => c.status === "PENDING_EVALUATION" || c.has_pending_descriptive);
        targetAttempt = pending || list[0];
      }

      if (targetAttempt) {
        setSelectedAttemptId(targetAttempt.id);
        setSelectedStudentId(targetAttempt.student_id);
        fetchAttemptResult(targetAttempt.id, targetAttempt.student_id);
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublishResults = async (publish: boolean) => {
    try {
      setPublishingResults(true);
      const res = await fetch(`/api/exams/${examId}/publish-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || "Failed to update score publication.");
      setFeedback({ type: "success", msg: data.message || "Score publication updated!" });
      fetchCandidates();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setPublishingResults(false);
    }
  };


  const fetchAttemptResult = async (attemptId: string, studentId: string) => {
    try {
      setAttemptLoading(true);
      const res = await fetch(
        `/api/exams/${examId}/result?attempt_id=${attemptId}&student_id=${studentId}`
      );
      if (!res.ok) throw new Error("Failed to load student attempt details.");
      const data: AttemptDetail = await res.json();
      setActiveAttempt(data);

      // Populate initial evaluations for all questions
      const initEval: { [qId: string]: { marks: number; feedback: string } } = {};
      (data.answers || []).forEach((a: AnswerReview) => {
        initEval[a.question_id] = {
          marks: a.marks_obtained !== undefined ? a.marks_obtained : 0,
          feedback: a.examiner_feedback || "",
        };
      });
      setEvaluations(initEval);
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setAttemptLoading(false);
    }
  };

  const handleSelectCandidate = (c: CandidateItem) => {
    setSelectedAttemptId(c.id);
    setSelectedStudentId(c.student_id);
    setFeedback(null);
    fetchAttemptResult(c.id, c.student_id);
  };

  const handleMarksChange = (qId: string, maxMarks: number, val: number) => {
    const clamped = Math.max(0, Math.min(maxMarks, isNaN(val) ? 0 : val));
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

  // Live total score calculation
  const liveTotalScore = useMemo(() => {
    if (!activeAttempt) return 0;
    return (
      Math.round(
        Object.values(evaluations).reduce((acc, curr) => acc + (Number(curr.marks) || 0), 0) * 100
      ) / 100
    );
  }, [evaluations, activeAttempt]);

  const livePercentage = useMemo(() => {
    if (!activeAttempt || !activeAttempt.total_marks) return 0;
    return Math.round((liveTotalScore / activeAttempt.total_marks) * 10000) / 100;
  }, [liveTotalScore, activeAttempt]);

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
          feedback: data.feedback?.trim() || undefined,
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
        msg: `Grades updated successfully! Final Recorded Score: ${resData.score} / ${activeAttempt?.total_marks} (${resData.status})`,
      });

      // Refresh candidate data
      if (selectedStudentId) {
        fetchAttemptResult(selectedAttemptId, selectedStudentId);
      }
      fetchCandidates();
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

      // Refresh candidates and current attempt
      fetchCandidates();
      if (selectedAttemptId && selectedStudentId) {
        fetchAttemptResult(selectedAttemptId, selectedStudentId);
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setAiEvaluating(false);
    }
  };

  // Filtered candidate list
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchSearch =
        c.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.student_email.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (candidateFilter === "PENDING") {
        return c.status === "PENDING_EVALUATION" || c.has_pending_descriptive;
      }
      if (candidateFilter === "EVALUATED") {
        return c.status === "EVALUATED";
      }
      return true;
    });
  }, [candidates, candidateFilter, searchQuery]);

  // Filtered questions in active attempt
  const filteredQuestions = useMemo(() => {
    if (!activeAttempt || !activeAttempt.answers) return [];
    return activeAttempt.answers.filter((q) => {
      if (questionTabFilter === "MCQ") {
        return ["MCQ", "MULTI_SELECT", "IMAGE"].includes(q.question_type);
      }
      if (questionTabFilter === "DESCRIPTIVE") {
        return ["SHORT_ANSWER", "LONG_ANSWER"].includes(q.question_type);
      }
      if (questionTabFilter === "CODING") {
        return q.question_type === "CODING";
      }
      return true;
    });
  }, [activeAttempt, questionTabFilter]);

  const mcqCount = (activeAttempt?.answers || []).filter((q) =>
    ["MCQ", "MULTI_SELECT", "IMAGE"].includes(q.question_type)
  ).length;
  const descCount = (activeAttempt?.answers || []).filter((q) =>
    ["SHORT_ANSWER", "LONG_ANSWER"].includes(q.question_type)
  ).length;
  const codeCount = (activeAttempt?.answers || []).filter((q) => q.question_type === "CODING").length;

  return (
    <div className="space-y-8 pb-16">
      {/* Contextual Sub-Nav */}
      <ExamContextNav
        examId={examId}
        examTitle={activeAttempt?.exam_title || "Candidate Evaluation Studio"}
        status="PUBLISHED"
        totalMarks={activeAttempt?.total_marks || 0}
      />

      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PenTool className="h-5 w-5 text-indigo-400" />
            <span>Candidate Evaluation & Grading Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review detailed student responses (MCQs, coding, descriptive), inspect solution keys, and modify or finalize marks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {exam && (
            <button
              onClick={() => handleTogglePublishResults(!exam.results_published)}
              disabled={publishingResults}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                exam.results_published
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>
                {publishingResults
                  ? "Updating..."
                  : exam.results_published
                  ? "Unpublish Scores"
                  : "Publish Scores to Students"}
              </span>
            </button>
          )}

          <button
            onClick={handleAIEvaluateAll}
            disabled={aiEvaluating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`h-3.5 w-3.5 ${aiEvaluating ? "animate-spin" : "text-amber-300"}`} />
            <span>{aiEvaluating ? "Evaluating with AI..." : "⚡ Auto-Evaluate All with AI"}</span>
          </button>

          <Link
            href={`/examiner/exams/${examId}/candidates`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <User className="h-3.5 w-3.5 text-indigo-400" />
            <span>Candidates List</span>
          </Link>

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
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading candidate queue...</div>
      ) : candidates.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-3">
          <User className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Candidate Attempts Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            When students take and submit this assessment, their complete answers and evaluation records will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Candidate Queue Sidebar */}
          <div className="glass-card rounded-3xl p-4 border border-slate-800 space-y-4 h-fit lg:sticky lg:top-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400 px-1">
                <span>Candidates Queue</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {candidates.length}
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name/email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setCandidateFilter("ALL")}
                  className={`flex-1 py-1 rounded-lg transition-all ${
                    candidateFilter === "ALL" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All ({candidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateFilter("PENDING")}
                  className={`flex-1 py-1 rounded-lg transition-all ${
                    candidateFilter === "PENDING" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateFilter("EVALUATED")}
                  className={`flex-1 py-1 rounded-lg transition-all ${
                    candidateFilter === "EVALUATED" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Done
                </button>
              </div>
            </div>

            {/* Candidates List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">No matching candidates.</div>
              ) : (
                filteredCandidates.map((c) => {
                  const isSelected = selectedAttemptId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCandidate(c)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 scale-[1.01]"
                          : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="font-bold text-xs truncate text-white">{c.student_name}</div>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md border ${
                            c.status === "EVALUATED"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : c.status === "PENDING_EVALUATION" || c.has_pending_descriptive
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                          }`}
                        >
                          {c.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{c.student_email}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800/80">
                        <span>Att. #{c.attempt_number}</span>
                        <span className="font-bold text-white">
                          {c.score !== undefined ? `${c.score} / ${c.total_marks}` : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Grading & Response Review Workspace */}
          <div className="lg:col-span-3 space-y-6">
            {attemptLoading ? (
              <div className="p-16 text-center text-slate-400 space-y-2">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-400" />
                <div className="text-sm font-bold text-white">Loading candidate response sheet...</div>
              </div>
            ) : !activeAttempt ? (
              <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 text-slate-400">
                Please select a candidate attempt from the queue sidebar to inspect responses and grade.
              </div>
            ) : (
              <form onSubmit={handleSubmitEvaluations} className="space-y-6">
                {/* Candidate Info Banner */}
                <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                          Attempt ID: <code className="text-slate-300">{activeAttempt.attempt_id.slice(0, 8)}</code>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            activeAttempt.status === "EVALUATED"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {activeAttempt.status.replace("_", " ")}
                        </span>
                      </div>
                      <h2 className="text-2xl font-extrabold text-white">{activeAttempt.student_name}</h2>
                      <p className="text-xs text-slate-400">
                        {activeAttempt.student_email} &bull; Submitted at:{" "}
                        <span className="text-slate-300">
                          {activeAttempt.submitted_at
                            ? new Date(activeAttempt.submitted_at).toLocaleString()
                            : "In Progress"}
                        </span>
                      </p>
                    </div>

                    {/* Live Score Counter */}
                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                      <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Total Marks</div>
                        <div className="text-lg font-black text-white">
                          <span className="text-indigo-400">{liveTotalScore}</span> / {activeAttempt.total_marks}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold">{livePercentage}%</div>
                      </div>

                      <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Duration</div>
                        <div className="text-lg font-black text-emerald-400">
                          {Math.round(activeAttempt.total_time_seconds / 60)}m {activeAttempt.total_time_seconds % 60}s
                        </div>
                        <div className="text-[10px] text-slate-500">Pacing Average</div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/25 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        <span>{submitting ? "Saving..." : "Save & Finalize Grades"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Category Tabs */}
                  <div className="flex items-center gap-2 border-t border-slate-800/80 pt-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setQuestionTabFilter("ALL")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        questionTabFilter === "ALL"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      All Questions ({activeAttempt.answers?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionTabFilter("MCQ")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        questionTabFilter === "MCQ"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      MCQs & Objectives ({mcqCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionTabFilter("DESCRIPTIVE")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        questionTabFilter === "DESCRIPTIVE"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      Descriptive & Essays ({descCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionTabFilter("CODING")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        questionTabFilter === "CODING"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      Coding & Algorithms ({codeCount})
                    </button>
                  </div>
                </div>

                {/* Questions Review List */}
                <div className="space-y-6">
                  {filteredQuestions.map((q, idx) => {
                    const currentMarks = evaluations[q.question_id]?.marks ?? 0;
                    const currentFeedback = evaluations[q.question_id]?.feedback ?? "";
                    const isMCQ = ["MCQ", "MULTI_SELECT", "IMAGE"].includes(q.question_type);
                    const isDescriptive = ["SHORT_ANSWER", "LONG_ANSWER"].includes(q.question_type);
                    const isCoding = q.question_type === "CODING";

                    return (
                      <div
                        key={q.question_id}
                        className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-5 shadow-lg"
                      >
                        {/* Question Card Header */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-400">Q{idx + 1}.</span>
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-900 border border-slate-800 text-indigo-300">
                              {q.section_title}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300">
                              {q.question_type.replace("_", " ")}
                            </span>
                            {q.evaluation_status === "AI_EVALUATED" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                <Sparkles className="h-3 w-3 text-amber-300" />
                                🤖 AI Evaluated
                              </span>
                            )}
                            {q.time_spent_seconds > 0 && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {q.time_spent_seconds}s spent
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">Max Weightage:</span>
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-indigo-950/40 border border-indigo-500/30 text-indigo-300">
                              {q.marks} Marks
                            </span>
                          </div>
                        </div>

                        {/* Question Prompt */}
                        <div className="space-y-1">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Question Statement
                          </div>
                          <p className="text-sm font-semibold text-white whitespace-pre-wrap leading-relaxed">
                            {q.question_text}
                          </p>
                        </div>

                        {/* MCQ Options Breakdown */}
                        {isMCQ && q.options && q.options.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Candidate Response vs Official Answer Key
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {q.options.map((opt, optIdx) => {
                                const isSelected =
                                  q.selected_option_id === opt.id ||
                                  (q.selected_option_ids && q.selected_option_ids.includes(opt.id));
                                const isCorrect =
                                  opt.is_correct || (q.correct_option_ids && q.correct_option_ids.includes(opt.id));

                                let cardStyle = "bg-slate-900/60 border-slate-800 text-slate-300";
                                if (isCorrect && isSelected) {
                                  cardStyle =
                                    "bg-emerald-950/40 border-emerald-500 text-white shadow-md shadow-emerald-500/10";
                                } else if (isCorrect && !isSelected) {
                                  cardStyle = "bg-emerald-950/20 border-emerald-500/50 text-emerald-200 border-dashed";
                                } else if (!isCorrect && isSelected) {
                                  cardStyle = "bg-rose-950/40 border-rose-500 text-white shadow-md shadow-rose-500/10";
                                }

                                return (
                                  <div
                                    key={opt.id}
                                    className={`p-3.5 rounded-2xl border text-xs flex items-start justify-between gap-3 ${cardStyle}`}
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <span className="font-mono font-bold text-slate-400 uppercase">
                                        {String.fromCharCode(65 + optIdx)}.
                                      </span>
                                      <span className="font-medium leading-relaxed">{opt.option_text}</span>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                      {isCorrect && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                          <Check className="h-3 w-3" />
                                          Correct Answer
                                        </span>
                                      )}
                                      {isSelected && (
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                            isCorrect
                                              ? "bg-emerald-500 text-black border-emerald-400"
                                              : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                          }`}
                                        >
                                          {isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                          Student Choice
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Descriptive Expected Solution & Student Answer */}
                        {isDescriptive && (
                          <div className="space-y-4">
                            {q.expected_answer && (
                              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-1.5">
                                <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                                  <Sparkles className="h-3.5 w-3.5" />
                                  <span>Official Rubric / Reference Solution</span>
                                </div>
                                <p className="text-xs text-indigo-200/90 whitespace-pre-wrap leading-relaxed">
                                  {q.expected_answer}
                                </p>
                              </div>
                            )}

                            <div className="space-y-1">
                              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Candidate&apos;s Submitted Text
                              </div>
                              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                                {q.text_answer ? (
                                  q.text_answer
                                ) : (
                                  <span className="text-slate-500 italic">No response submitted.</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Coding Solution & Test Cases */}
                        {isCoding && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-white">
                                <Code2 className="h-4 w-4 text-indigo-400" />
                                Candidate Source Code ({q.code_language || "python"})
                              </span>
                              {q.test_cases_passed !== undefined && q.total_test_cases !== undefined && (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[11px]">
                                  {q.test_cases_passed} / {q.total_test_cases} Test Cases Passed
                                </span>
                              )}
                            </div>

                            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-72">
                              {q.code_answer || "// No code submitted"}
                            </pre>

                            {q.test_cases && q.test_cases.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                  Configured Test Cases ({q.test_cases.length})
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {q.test_cases.map((tc, tcIdx) => (
                                    <div
                                      key={tc.id}
                                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1"
                                    >
                                      <div className="flex items-center justify-between text-slate-400 font-sans font-bold">
                                        <span>
                                          Case #{tcIdx + 1} {tc.is_sample && "(Sample)"}
                                        </span>
                                        <span className="text-indigo-400">{tc.weightage_marks} Marks</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 font-sans font-bold">Input: </span>
                                        <span className="text-slate-200">{tc.input_data}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 font-sans font-bold">Expected: </span>
                                        <span className="text-emerald-300">{tc.expected_output}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Grading Controls on Every Question */}
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                                  Marks Awarded (0 - {q.marks}) *
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    required
                                    step="0.1"
                                    min={0}
                                    max={q.marks}
                                    value={currentMarks}
                                    onChange={(e) =>
                                      handleMarksChange(q.question_id, q.marks, parseFloat(e.target.value))
                                    }
                                    className="w-24 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-extrabold text-white focus:outline-none focus:border-indigo-500 text-center"
                                  />
                                  <span className="text-xs text-slate-400 font-semibold">/ {q.marks}</span>
                                </div>
                              </div>

                              {/* Quick Mark Presets */}
                              <div className="flex items-center gap-1.5 pt-4">
                                <button
                                  type="button"
                                  onClick={() => handleMarksChange(q.question_id, q.marks, q.marks)}
                                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all cursor-pointer"
                                  title="Award Full Marks"
                                >
                                  Full ({q.marks})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarksChange(q.question_id, q.marks, Math.round((q.marks / 2) * 10) / 10)}
                                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-all cursor-pointer"
                                  title="Award Half Marks"
                                >
                                  Half
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarksChange(q.question_id, q.marks, 0)}
                                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-all cursor-pointer"
                                  title="Award Zero"
                                >
                                  Zero (0)
                                </button>
                              </div>
                            </div>

                            <div className="flex-1 sm:max-w-md">
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                                Examiner Feedback / Evaluation Note
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Correct reasoning, missed edge case."
                                value={currentFeedback}
                                onChange={(e) => handleFeedbackChange(q.question_id, e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Submit Action Bar */}
                <div className="glass-card rounded-3xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky bottom-4 z-30 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <Award className="h-6 w-6 text-indigo-400 shrink-0" />
                    <div>
                      <div className="text-xs text-slate-400">Total Calculated Grade</div>
                      <div className="text-lg font-extrabold text-white">
                        <span className="text-indigo-400">{liveTotalScore}</span> / {activeAttempt.total_marks} marks{" "}
                        <span className="text-xs font-bold text-slate-400">({livePercentage}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/examiner/exams/${examId}/candidates`}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
                    >
                      Back to Candidates
                    </Link>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/25 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{submitting ? "Saving Grades..." : "Save & Finalize Grades"}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExamEvaluationStudioPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading grading studio...</div>}>
      <ExamEvaluationStudioContent />
    </Suspense>
  );
}

