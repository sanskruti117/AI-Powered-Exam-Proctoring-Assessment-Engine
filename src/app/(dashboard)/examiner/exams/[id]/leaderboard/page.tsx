"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  ArrowLeft,
  Search,
  Clock,
  Award,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  PenTool,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { ExamContextNav } from "@/components/ExamContextNav";

interface LeaderboardEntry {
  rank: number;
  attempt_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  score: number;
  total_marks: number;
  percentage: number;
  is_passed: boolean;
  status: "SUBMITTED" | "PENDING_EVALUATION" | "EVALUATED";
  has_pending_descriptive: boolean;
  total_time_seconds: number;
  average_time_per_question: number;
  submitted_at: string;
}

interface LeaderboardData {
  exam_id: string;
  exam_title: string;
  total_marks: number;
  passing_marks: number;
  total_participants: number;
  completed_participants: number;
  pending_evaluation_count: number;
  leaderboard: LeaderboardEntry[];
}

export default function ExamLeaderboardPage() {
  const params = useParams();
  const examId = params?.id as string;

  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  useEffect(() => {
    if (examId) {
      fetchLeaderboard();
    }
  }, [examId]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${examId}/leaderboard`);
      if (!res.ok) throw new Error("Failed to load exam leaderboard.");
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
    const remainder = secs % 60;
    return `${mins}m ${remainder}s`;
  };

  const filteredEntries = (data?.leaderboard || []).filter((entry) => {
    const matchesSearch =
      entry.student_name.toLowerCase().includes(search.toLowerCase()) ||
      entry.student_email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === "ALL"
        ? true
        : selectedStatusFilter === "PENDING"
        ? entry.status === "PENDING_EVALUATION"
        : entry.status === "EVALUATED";

    return matchesSearch && matchesStatus;
  });

  const topThree = (data?.leaderboard || []).slice(0, 3);

  if (loading && !data) {
    return <div className="p-12 text-center text-slate-400">Loading exam leaderboard...</div>;
  }

  if (!data) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="text-rose-400 font-bold">Exam leaderboard not found or access denied.</div>
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
            <Trophy className="h-5 w-5 text-amber-400" />
            <span>Official Ranked Standings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rankings computed by Maximum Marks Achieved, followed by Least Completion Time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {data.pending_evaluation_count > 0 && (
            <Link
              href={`/examiner/exams/${examId}/evaluate`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/20 transition-all"
            >
              <PenTool className="h-3.5 w-3.5" />
              <span>Evaluate ({data.pending_evaluation_count} Pending)</span>
            </Link>
          )}

          <button
            onClick={fetchLeaderboard}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh Leaderboard"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topThree.map((candidate, idx) => {
            const medalColor =
              idx === 0
                ? "from-amber-500/20 to-amber-600/5 border-amber-500/40 text-amber-300"
                : idx === 1
                ? "from-slate-400/20 to-slate-500/5 border-slate-400/40 text-slate-200"
                : "from-amber-700/20 to-amber-800/5 border-amber-700/40 text-amber-500";

            return (
              <div
                key={candidate.attempt_id}
                className={`glass-card rounded-3xl p-6 border bg-gradient-to-b ${medalColor} space-y-4 relative overflow-hidden`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black flex items-center gap-1.5">
                    <Trophy className="h-6 w-6" />
                    #{candidate.rank}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900/80 border border-slate-800 text-white">
                    {candidate.percentage}%
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white truncate">{candidate.student_name}</h3>
                  <p className="text-xs text-slate-400 truncate">{candidate.student_email}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase block font-semibold">Marks</span>
                    <span className="font-extrabold text-white text-sm">
                      {candidate.score} / {candidate.total_marks}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 uppercase block font-semibold">Avg Time / Q</span>
                    <span className="font-extrabold text-indigo-400 text-sm">
                      {candidate.average_time_per_question}s
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidates by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "EVALUATED", "PENDING"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedStatusFilter === st
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ranked Table */}
      {filteredEntries.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-3">
          <Trophy className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Candidate Submissions Found</h3>
          <p className="text-xs text-slate-400">
            Once enrolled candidates complete their attempts, rankings and average stopwatch speeds will render here.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-4 px-6 text-center w-16">Rank</th>
                  <th className="py-4 px-6">Candidate</th>
                  <th className="py-4 px-6 text-center">Score</th>
                  <th className="py-4 px-6 text-center">Percentage</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Total Time</th>
                  <th className="py-4 px-6 text-center">Avg Time / Q</th>
                  <th className="py-4 px-6 text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEntries.map((entry) => {
                  const isTopOne = entry.rank === 1;
                  const isTopThree = entry.rank <= 3;

                  return (
                    <tr
                      key={entry.attempt_id}
                      className="hover:bg-slate-900/50 transition-colors"
                    >
                      {/* Rank */}
                      <td className="py-4 px-6 text-center font-extrabold text-sm">
                        <span
                          className={`inline-flex items-center justify-center h-7 w-7 rounded-full ${
                            isTopOne
                              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30"
                              : isTopThree
                              ? "bg-slate-700 text-white"
                              : "text-slate-400"
                          }`}
                        >
                          {entry.rank}
                        </span>
                      </td>

                      {/* Candidate */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-white text-sm">{entry.student_name}</div>
                        <div className="text-slate-400 text-xs">{entry.student_email}</div>
                      </td>

                      {/* Score */}
                      <td className="py-4 px-6 text-center font-extrabold text-sm text-white">
                        {entry.score}{" "}
                        <span className="text-xs font-normal text-slate-500">/ {entry.total_marks}</span>
                      </td>

                      {/* Percentage */}
                      <td className="py-4 px-6 text-center font-bold text-sm">
                        <span
                          className={
                            entry.percentage >= 50
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }
                        >
                          {entry.percentage}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            entry.status === "EVALUATED"
                              ? entry.is_passed
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                              : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {entry.status === "EVALUATED"
                            ? entry.is_passed
                              ? "PASSED"
                              : "FAILED"
                            : "PENDING REVIEW"}
                        </span>
                      </td>

                      {/* Total Time */}
                      <td className="py-4 px-6 text-center text-slate-300 font-medium">
                        {formatTime(entry.total_time_seconds)}
                      </td>

                      {/* Avg Time / Q */}
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-extrabold border border-indigo-500/20">
                          {entry.average_time_per_question}s
                        </span>
                      </td>

                      {/* Submitted At */}
                      <td className="py-4 px-6 text-right text-slate-400">
                        {new Date(entry.submitted_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
