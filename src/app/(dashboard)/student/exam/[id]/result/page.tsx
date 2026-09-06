"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  HelpCircle,
} from "lucide-react";

interface AnswerItem {
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
  correct_option_ids?: string[];
  expected_answer?: string;
  options: {
    id: string;
    option_text: string;
    is_correct: boolean;
    order: number;
  }[];
}

interface ResultData {
  attempt_id: string;
  exam_id: string;
  exam_title: string;
  student_name: string;
  student_email: string;
  status: "SUBMITTED" | "PENDING_EVALUATION" | "EVALUATED";
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
  average_time_per_question: number;
  answers: AnswerItem[];
}

export default function StudentExamResultPage() {
  const params = useParams();
  const examId = params?.id as string;

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (examId) {
      fetchResult();
    }
  }, [examId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${examId}/result`);
      if (!res.ok) throw new Error("Failed to load result.");
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.round(secs % 60);
    return `${mins}m ${remainder}s`;
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading your score report...</div>;
  }

  if (!data) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="text-rose-400 font-bold">No exam submission record found.</div>
        <Link href="/student" className="text-xs text-indigo-400 underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link href="/student" className="hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-600" />
        <span className="text-white font-bold">{data.exam_title}</span>
        <ChevronRight className="h-3 w-3 text-slate-600" />
        <span className="text-indigo-400">Official Score Report</span>
      </div>

      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Award className="h-4 w-4" />
              <span>Certified Candidate Performance Record</span>
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {data.exam_title} - Result
            </h1>
            <p className="text-xs text-slate-400">
              Candidate: <span className="text-white font-semibold">{data.student_name}</span> &bull; Attempt ID:{" "}
              <code className="text-slate-300">{data.attempt_id.slice(0, 8)}</code>
            </p>
          </div>

          <Link
            href="/student"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-all self-start md:self-auto"
          >
            <span>Back to Assessments</span>
          </Link>
        </div>

        {/* Pending Descriptive Evaluation Notice */}
        {data.has_pending_descriptive && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold block">Descriptive Evaluation Pending</span>
              Your multiple-choice questions have been auto-evaluated. Subjective answers are awaiting examiner review. Final score and rank will update once graded.
            </div>
          </div>
        )}
      </div>

      {/* Performance Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Score */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Score</span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {data.score} <span className="text-sm font-normal text-slate-400">/ {data.total_marks}</span>
          </div>
          <div className="text-xs text-slate-500">
            Auto: {data.auto_graded_score} | Manual: {data.manual_graded_score}
          </div>
        </div>

        {/* Percentage & Status */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Performance Status</span>
            {data.status === "EVALUATED" ? (
              data.is_passed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-400" />
              )
            ) : (
              <Sparkles className="h-4 w-4 text-amber-400" />
            )}
          </div>
          <div
            className={`text-2xl font-extrabold ${
              data.status === "EVALUATED"
                ? data.is_passed
                  ? "text-emerald-400"
                  : "text-rose-400"
                : "text-amber-400"
            }`}
          >
            {data.status === "EVALUATED"
              ? data.is_passed
                ? `PASSED (${data.percentage}%)`
                : `FAILED (${data.percentage}%)`
              : `PENDING (${data.percentage}%)`}
          </div>
          <div className="text-xs text-slate-500">
            {data.status === "EVALUATED" ? "Official result finalized" : "Awaiting examiner review"}
          </div>
        </div>

        {/* Total Completion Time */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Time Taken</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {formatTime(data.total_time_seconds)}
          </div>
          <div className="text-xs text-slate-500">Submitted at {new Date(data.submitted_at).toLocaleTimeString()}</div>
        </div>

        {/* Avg Time / Question */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Time / Question</span>
            <Sparkles className="h-4 w-4 text-violet-400" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-400">
            {data.average_time_per_question}s
          </div>
          <div className="text-xs text-slate-500">Stopwatch pacing average</div>
        </div>
      </div>

      {/* Question Breakdown List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-400" />
          Question-by-Question Breakdown
        </h2>

        <div className="space-y-4">
          {data.answers.map((q, idx) => {
            const isEvaluated = q.evaluation_status !== "PENDING_REVIEW";

            return (
              <div
                key={q.question_id}
                className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-500">Q{idx + 1}.</span>
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-900 border border-slate-800 text-indigo-300">
                      {q.section_title}
                    </span>
                    <span className="text-xs text-slate-400">
                      {q.question_type.replace("_", " ")}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Stopwatch: {q.time_spent_seconds}s
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        q.evaluation_status === "PENDING_REVIEW"
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : q.is_correct
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {q.evaluation_status === "PENDING_REVIEW"
                        ? "PENDING REVIEW"
                        : q.is_correct
                        ? "CORRECT"
                        : "INCORRECT"}
                    </span>

                    <span className="text-xs font-extrabold text-white">
                      {q.marks_obtained} / {q.marks} Marks
                    </span>
                  </div>
                </div>

                {/* Question Statement */}
                <p className="text-sm font-semibold text-white whitespace-pre-wrap">
                  {q.question_text}
                </p>

                {/* Choice rendering for objective questions */}
                {["MCQ", "MULTI_SELECT", "IMAGE"].includes(q.question_type) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const isSelected =
                        q.selected_option_id === opt.id ||
                        (q.selected_option_ids && q.selected_option_ids.includes(opt.id));
                      const isCorrect = opt.is_correct;

                      let style = "bg-slate-900/60 border-slate-800 text-slate-300";
                      if (isSelected && isCorrect) {
                        style = "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold";
                      } else if (isSelected && !isCorrect) {
                        style = "bg-rose-500/15 border-rose-500/40 text-rose-300 font-bold";
                      } else if (!isSelected && isCorrect) {
                        style = "bg-emerald-500/5 border-emerald-500/20 text-emerald-400/80";
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${style}`}
                        >
                          <span className="truncate pr-2">{opt.option_text}</span>
                          {isSelected && (
                            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-black/40">
                              Your Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Text answer for descriptive questions */}
                {["SHORT_ANSWER", "LONG_ANSWER"].includes(q.question_type) && (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Your Submitted Answer:
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {q.text_answer || (
                        <span className="text-slate-500 italic">No answer submitted.</span>
                      )}
                    </div>

                    {q.examiner_feedback && (
                      <div className="p-3.5 rounded-2xl bg-violet-950/20 border border-violet-500/30 text-xs text-violet-200">
                        <span className="font-bold text-violet-300 block mb-0.5">
                          Examiner Qualitative Feedback:
                        </span>
                        <span>{q.examiner_feedback}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
