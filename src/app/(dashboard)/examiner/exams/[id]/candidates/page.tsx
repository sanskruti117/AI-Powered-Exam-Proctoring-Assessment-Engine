"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PenTool,
  Search,
  ExternalLink,
  Award,
} from "lucide-react";
import { ExamContextNav } from "@/components/ExamContextNav";

interface CandidateAttempt {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  attempt_number: number;
  status: "IN_PROGRESS" | "SUBMITTED" | "PENDING_EVALUATION" | "EVALUATED";
  score: number;
  total_marks: number;
  percentage: number;
  is_passed: boolean;
  started_at: string;
  submitted_at?: string;
  has_pending_descriptive: boolean;
}

export default function ExamCandidatesPage() {
  const params = useParams();
  const examId = params?.id as string;

  const [exam, setExam] = useState<any>(null);
  const [candidates, setCandidates] = useState<CandidateAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (examId) {
      fetchData();
    }
  }, [examId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examRes, candRes] = await Promise.all([
        fetch(`/api/exams/${examId}`),
        fetch(`/api/exams/${examId}/candidates`),
      ]);

      if (!examRes.ok) throw new Error("Failed to load exam.");
      const examData = await examRes.json();
      setExam(examData);

      if (candRes.ok) {
        const candData = await candRes.json();
        setCandidates(candData.candidates || candData || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  const filtered = candidates.filter(
    (c) =>
      c.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.student_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      {exam && (
        <ExamContextNav
          examId={exam.id}
          examTitle={exam.title}
          status={exam.status}
          totalQuestions={exam.total_questions}
          totalMarks={exam.total_marks}
        />
      )}

      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            <span>Candidate Attempts & Submissions ({candidates.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time tracking of candidate attempt statuses, auto-scores, and manual evaluations.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Candidate</th>
                <th className="p-4">Started</th>
                <th className="p-4">Submitted</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Score</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading candidates...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No candidate attempts found for this examination.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{c.student_name}</div>
                      <div className="text-[11px] text-slate-400">{c.student_email}</div>
                    </td>
                    <td className="p-4 text-slate-400">{formatDate(c.started_at)}</td>
                    <td className="p-4 text-slate-400">{formatDate(c.submitted_at)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          c.status === "EVALUATED"
                            ? c.is_passed
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                            : c.status === "PENDING_EVALUATION"
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                        }`}
                      >
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-white">
                      {c.score !== undefined ? `${c.score} / ${c.total_marks}` : "—"}
                      {c.percentage !== undefined && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {c.percentage}%
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {c.has_pending_descriptive ? (
                        <Link
                          href={`/examiner/exams/${examId}/evaluate`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 transition-all"
                        >
                          <PenTool className="h-3 w-3" />
                          <span>Grade</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/examiner/exams/${examId}/leaderboard`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
                        >
                          <span>View</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
