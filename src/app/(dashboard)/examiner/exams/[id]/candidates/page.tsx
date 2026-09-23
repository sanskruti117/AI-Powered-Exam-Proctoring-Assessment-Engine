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
  const [publishingResults, setPublishingResults] = useState(false);
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

  const handleTogglePublishResults = async (publish: boolean) => {
    try {
      setPublishingResults(true);
      const res = await fetch(`/api/exams/${examId}/publish-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || data.message || "Failed to update score publication.");
      }
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPublishingResults(false);
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

      {/* Header & Score Release Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-400" />
              <span>Candidate Attempts & Submissions ({candidates.length})</span>
            </h2>
            {exam && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  exam.results_published
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                }`}
              >
                {exam.results_published ? "● Scores Published to Students" : "○ Scores Withheld (Private to Examiner)"}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time tracking of candidate attempt statuses, auto-scores, and manual evaluations.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {exam && (
            <button
              onClick={() => handleTogglePublishResults(!exam.results_published)}
              disabled={publishingResults}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                exam.results_published
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25"
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
                      <Link
                        href={`/examiner/exams/${examId}/evaluate?attempt_id=${c.id}&student_id=${c.student_id}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          c.has_pending_descriptive
                            ? "text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30"
                            : "text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <PenTool className="h-3 w-3 text-indigo-400" />
                        <span>{c.has_pending_descriptive ? "Grade" : "Review / Grade"}</span>
                      </Link>
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
