"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  XCircle,
  BarChart3,
  Trophy,
  PenTool,
  Users,
  Settings,
  Plus,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { ExamContextNav } from "@/components/ExamContextNav";

interface ExamSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  target_marks: number;
  total_pool_questions: number;
  total_pool_marks: number;
}

interface ExamDetail {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  max_attempts: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  sections: ExamSection[];
  total_questions: number;
  total_pool_marks: number;
  attempts_count: number;
  is_active: boolean;
  is_upcoming: boolean;
  is_ended: boolean;
}

export default function ExamOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishLoading, setPublishLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (examId) {
      fetchExam();
    }
  }, [examId]);

  const fetchExam = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${examId}`);
      if (!res.ok) throw new Error("Failed to load exam details.");
      const data = await res.json();
      setExam(data);
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishLoading(true);
      setFeedback(null);
      const res = await fetch(`/api/exams/${examId}/publish`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || "Publish validation failed.");
      }

      setFeedback({ type: "success", msg: data.message || "Exam successfully published!" });
      fetchExam();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setPublishLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading exam overview...</div>;
  }

  if (!exam) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="text-rose-400 font-bold">Exam not found.</div>
        <Link href="/examiner/exams" className="text-xs text-indigo-400 underline">
          Return to Examinations
        </Link>
      </div>
    );
  }

  const isPublishable = exam.sections.every(
    (sec) => sec.total_pool_marks >= sec.target_marks
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Contextual Header & Sub-Nav */}
      <ExamContextNav
        examId={exam.id}
        examTitle={exam.title}
        status={exam.status}
        totalQuestions={exam.total_questions}
        totalMarks={exam.total_marks}
      />

      {/* Feedback Banner */}
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
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold opacity-70">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Target Marks & Readiness */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Exam Marks</span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {exam.total_marks}{" "}
            <span className="text-xs font-normal text-slate-400">
              (Pass: {exam.passing_marks})
            </span>
          </div>
          <div className="text-xs font-semibold">
            {exam.total_pool_marks >= exam.total_marks ? (
              <span className="text-emerald-400">✓ Pool: {exam.total_pool_marks} Marks</span>
            ) : (
              <span className="text-rose-400">⚠️ Pool: {exam.total_pool_marks} / {exam.total_marks}</span>
            )}
          </div>
        </div>

        {/* Duration & Delivery */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Duration & Policy</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white">{exam.duration_minutes} Mins</div>
          <div className="text-xs text-slate-400">
            {exam.max_attempts} Attempt Allowed &bull; Shuffled
          </div>
        </div>

        {/* Testing Window */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Schedule Status</span>
            <Calendar className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-lg font-bold text-white truncate">
            {exam.is_active ? "Live Window Active" : exam.is_upcoming ? "Upcoming Schedule" : "Closed / Ended"}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {formatDate(exam.start_time)}
          </div>
        </div>

        {/* Candidate Submissions */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Submissions</span>
            <Users className="h-4 w-4 text-violet-400" />
          </div>
          <div className="text-3xl font-black text-white">{exam.attempts_count}</div>
          <div className="text-xs text-slate-400">Candidate evaluations</div>
        </div>
      </div>

      {/* Section-by-Section Question Pool Readiness */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              <span>Section-wise Question Pools & Marks Readiness</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Each student attempt will be delivered a randomized combination of questions summing exactly to the section target marks.
            </p>
          </div>

          <Link
            href={`/examiner/exams/${exam.id}/manage`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Manage Question Pools</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exam.sections.map((sec, idx) => {
            const isReady = sec.total_pool_marks >= sec.target_marks;
            const progressPct = Math.min(
              100,
              Math.round((sec.total_pool_marks / (sec.target_marks || 1)) * 100)
            );

            return (
              <div
                key={sec.id}
                className={`p-5 rounded-2xl border space-y-3.5 ${
                  isReady
                    ? "bg-slate-900/80 border-slate-800"
                    : "bg-rose-950/20 border-rose-500/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-sm text-white">{sec.title}</span>
                  </div>
                  <span className="text-xs font-extrabold text-amber-400">
                    Target: {sec.target_marks} Marks
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Pool: {sec.total_pool_questions} questions</span>
                    <span className={isReady ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {sec.total_pool_marks} / {sec.target_marks} Marks ({progressPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        isReady ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Warning Alert if insufficient questions */}
                {!isReady && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>
                      Cannot publish — this section needs enough questions to form exactly {sec.target_marks} marks (currently {sec.total_pool_marks} marks).
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Publish Action Footer */}
        {exam.status === "DRAFT" && (
          <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Publishing Status</h4>
              <p className="text-xs text-slate-400">
                {isPublishable
                  ? "All sections meet the minimum target marks threshold. You can now publish this examination."
                  : "Add more questions to all sections so each section has at least its target marks before publishing."}
              </p>
            </div>

            <button
              onClick={handlePublish}
              disabled={!isPublishable || publishLoading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 transition-all shrink-0"
            >
              <PlayCircle className="h-4 w-4" />
              <span>{publishLoading ? "Validating & Publishing..." : "Publish Examination"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Links Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href={`/examiner/exams/${exam.id}/manage`}
          className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all group space-y-2"
        >
          <div className="h-10 w-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Layers className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-indigo-300">
            Question Paper & Pools
          </h4>
          <p className="text-xs text-slate-400">
            Author, edit, and organize questions under section weightages.
          </p>
        </Link>

        <Link
          href={`/examiner/exams/${exam.id}/leaderboard`}
          className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all group space-y-2"
        >
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Trophy className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-amber-300">
            Candidate Leaderboard
          </h4>
          <p className="text-xs text-slate-400">
            View ranked scores, percentages, and average stopwatch pacing.
          </p>
        </Link>

        <Link
          href={`/examiner/exams/${exam.id}/analytics`}
          className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all group space-y-2"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-emerald-300">
            Cohort Analytics
          </h4>
          <p className="text-xs text-slate-400">
            Inspect pass rates, section mastery gauges, and item diagnostics.
          </p>
        </Link>
      </div>
    </div>
  );
}
