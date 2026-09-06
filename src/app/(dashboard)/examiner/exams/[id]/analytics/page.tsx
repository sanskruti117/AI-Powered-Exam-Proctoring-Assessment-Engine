"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { ExamContextNav } from "@/components/ExamContextNav";

interface DifficultyBreakdown {
  difficulty: string;
  total_questions: number;
  average_accuracy: number;
}

interface SectionBreakdown {
  section_title: string;
  target_marks: number;
  average_score: number;
  accuracy_percentage: number;
}

interface QuestionDeepDive {
  question_id: string;
  question_text: string;
  section_title: string;
  difficulty: string;
  question_type: string;
  marks: number;
  total_attempts: number;
  correct_attempts: number;
  accuracy_percentage: number;
  average_time_spent_seconds: number;
  average_marks_obtained: number;
}

interface AnalyticsData {
  exam_id: string;
  exam_title: string;
  total_marks?: number;
  total_enrolled: number;
  total_attempts: number;
  completed_attempts: number;
  pending_evaluation_attempts: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  median_score: number;
  pass_rate_percentage: number;
  fail_rate_percentage: number;
  average_completion_time_seconds: number;
  average_time_per_question_seconds: number;
  difficulty_breakdown: DifficultyBreakdown[];
  section_breakdown: SectionBreakdown[];
  question_deep_dive: QuestionDeepDive[];
}

export default function ExamAnalyticsPage() {
  const params = useParams();
  const examId = params?.id as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("ALL");

  useEffect(() => {
    if (examId) {
      fetchAnalytics();
    }
  }, [examId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${examId}/analytics`);
      if (!res.ok) throw new Error("Failed to load analytics.");
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

  const filteredQuestions = (data?.question_deep_dive || []).filter((q) => {
    const matchesSearch = q.question_text.toLowerCase().includes(search.toLowerCase());
    const matchesSection =
      sectionFilter === "ALL" || q.section_title.toLowerCase() === sectionFilter.toLowerCase();
    return matchesSearch && matchesSection;
  });

  if (loading && !data) {
    return <div className="p-12 text-center text-slate-400">Loading exam analytics...</div>;
  }

  if (!data) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="text-rose-400 font-bold">Analytics record not found or access denied.</div>
        <Link href="/examiner/exams" className="text-xs text-indigo-400 underline">
          Return to Examinations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Contextual Sub-Nav */}
      <ExamContextNav
        examId={examId}
        examTitle={data.exam_title}
        status="PUBLISHED"
        totalMarks={data.total_marks}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            <span>Cohort Performance Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical evaluation of candidate cohort mastery, section distributions, and item diagnostics.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white self-start sm:self-auto"
          title="Refresh Analytics"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pass Rate */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pass Rate</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {data.pass_rate_percentage}%
          </div>
          <div className="text-xs text-slate-500">
            Fail Rate: {data.fail_rate_percentage}% ({data.total_attempts} total attempts)
          </div>
        </div>

        {/* Average Score */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
            <Award className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {data.average_score} <span className="text-xs font-normal text-slate-400">marks</span>
          </div>
          <div className="text-xs text-slate-500">
            Median: {data.median_score} | High: {data.highest_score} | Low: {data.lowest_score}
          </div>
        </div>

        {/* Avg Completion Time */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Completion Time</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">
            {formatTime(data.average_completion_time_seconds)}
          </div>
          <div className="text-xs text-slate-500">Per candidate full session duration</div>
        </div>

        {/* Avg Time per Question */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Time / Question</span>
            <Sparkles className="h-4 w-4 text-violet-400" />
          </div>
          <div className="text-2xl font-extrabold text-violet-400">
            {data.average_time_per_question_seconds}s
          </div>
          <div className="text-xs text-slate-500">Cumulative stopwatch benchmark</div>
        </div>
      </div>

      {/* Difficulty & Section Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Difficulty Breakdown */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Difficulty Pacing & Accuracy</h3>
            <span className="text-xs text-slate-400">Cohort Accuracy %</span>
          </div>

          <div className="space-y-3">
            {data.difficulty_breakdown.map((item) => (
              <div key={item.difficulty} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span
                    className={
                      item.difficulty === "EASY"
                        ? "text-emerald-400"
                        : item.difficulty === "MEDIUM"
                        ? "text-amber-400"
                        : "text-rose-400"
                    }
                  >
                    {item.difficulty} ({item.total_questions} questions)
                  </span>
                  <span className="text-white font-extrabold">{item.average_accuracy}% Accuracy</span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.difficulty === "EASY"
                        ? "bg-emerald-500"
                        : item.difficulty === "MEDIUM"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.max(5, item.average_accuracy)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Mastery Breakdown */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Subject Section Mastery</h3>
            <span className="text-xs text-slate-400">Target Marks vs Cohort Avg</span>
          </div>

          <div className="space-y-3">
            {data.section_breakdown.map((sec) => (
              <div key={sec.section_title} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{sec.section_title}</span>
                  <span className="text-indigo-400">
                    {sec.average_score} / {sec.target_marks} Marks Avg
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(5, (sec.average_score / Math.max(1, sec.target_marks)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Question-by-Question Deep Dive Table */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Question Cohort Diagnostics</h3>
            <p className="text-xs text-slate-400">
              Granular accuracy rate, candidate attempts, and cumulative stopwatch duration per question.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Question Statement</th>
                <th className="py-3.5 px-4 text-center">Section</th>
                <th className="py-3.5 px-4 text-center">Difficulty</th>
                <th className="py-3.5 px-4 text-center">Attempts</th>
                <th className="py-3.5 px-4 text-center">Accuracy %</th>
                <th className="py-3.5 px-4 text-center">Avg Stopwatch</th>
                <th className="py-3.5 px-4 text-right">Avg Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredQuestions.map((q) => {
                const accColor =
                  q.accuracy_percentage >= 70
                    ? "text-emerald-400"
                    : q.accuracy_percentage >= 40
                    ? "text-amber-400"
                    : "text-rose-400";

                return (
                  <tr key={q.question_id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-semibold text-white truncate">{q.question_text}</div>
                      <div className="text-[11px] text-slate-500">{q.question_type.replace("_", " ")}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                      {q.section_title}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase border ${
                          q.difficulty === "EASY"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : q.difficulty === "MEDIUM"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center text-slate-300 font-medium">
                      {q.total_attempts}
                    </td>

                    <td className={`py-3.5 px-4 text-center font-extrabold ${accColor}`}>
                      {q.accuracy_percentage}%
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-indigo-300 font-bold">
                        {q.average_time_spent_seconds}s
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-white">
                      {q.average_marks_obtained} / {q.marks}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
