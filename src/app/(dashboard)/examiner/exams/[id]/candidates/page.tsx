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
  Download,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
  Radio,
  Eye,
  Smartphone,
  Maximize2,
  MonitorOff,
} from "lucide-react";
import { ExamContextNav } from "@/components/ExamContextNav";

interface ProctorIncident {
  id: string;
  event_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  details?: string;
  timestamp?: string;
}

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
  updated_at?: string;
  total_time_seconds?: number;
  has_pending_descriptive: boolean;
  proctor_warnings_count?: number;
  proctor_events?: ProctorIncident[];
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

  // Proctor Incident Timeline Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateAttempt | null>(null);

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

  const formatSeconds = (secs?: number) => {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const handleExportCSV = () => {
    if (!candidates || candidates.length === 0) return;

    const headers = [
      "Candidate Name",
      "Candidate Email",
      "Attempt #",
      "Status",
      "Score",
      "Total Marks",
      "Percentage",
      "Result",
      "Proctor Warnings Count",
      "Time Spent",
      "Started At",
      "Submitted At",
    ];

    const rows = candidates.map((c) => [
      `"${(c.student_name || "").replace(/"/g, '""')}"`,
      `"${(c.student_email || "").replace(/"/g, '""')}"`,
      c.attempt_number || 1,
      `"${c.status}"`,
      c.score ?? 0,
      c.total_marks ?? (exam?.total_marks || 0),
      `${c.percentage ?? 0}%`,
      c.status === "EVALUATED" ? (c.is_passed ? "PASSED" : "FAILED") : "PENDING",
      c.proctor_warnings_count ?? 0,
      `"${formatSeconds(c.total_time_seconds)}"`,
      `"${c.started_at ? new Date(c.started_at).toISOString() : ""}"`,
      `"${c.submitted_at ? new Date(c.submitted_at).toISOString() : ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const examSlug = exam?.title ? exam.title.replace(/[^a-zA-Z0-9_-]/g, "_") : "Exam";
    link.setAttribute("href", url);
    link.setAttribute("download", `${examSlug}_Candidate_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType?.toUpperCase()) {
      case "TAB_SWITCH":
      case "WINDOW_BLUR":
        return <Eye className="h-4 w-4 text-amber-400" />;
      case "FULLSCREEN_EXIT":
        return <Maximize2 className="h-4 w-4 text-rose-400" />;
      case "PROHIBITED_DEVICE":
      case "SECONDARY_DEVICE":
        return <Smartphone className="h-4 w-4 text-rose-400" />;
      case "MULTIPLE_PERSONS":
        return <Users className="h-4 w-4 text-rose-400" />;
      case "CANDIDATE_ABSENT":
      case "NO_FACE":
        return <MonitorOff className="h-4 w-4 text-amber-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
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
            Real-time tracking of candidate attempt statuses, live proctoring activity, auto-scores, and manual evaluations.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={candidates.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title="Download Candidate Roster as CSV"
          >
            <Download className="h-3.5 w-3.5 text-indigo-400" />
            <span>Export CSV</span>
          </button>

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

          <div className="relative w-full sm:w-60">
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
                <th className="p-4">Live Status</th>
                <th className="p-4">Started / Submitted</th>
                <th className="p-4 text-center">Proctoring Telemetry</th>
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
                filtered.map((c) => {
                  const isLiveTesting = c.status === "IN_PROGRESS";
                  const warningCount = c.proctor_warnings_count ?? 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{c.student_name}</span>
                          {c.attempt_number > 1 && (
                            <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              Attempt #{c.attempt_number}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{c.student_email}</div>
                      </td>

                      {/* Live Status Badge */}
                      <td className="p-4">
                        {isLiveTesting ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                            <span>Live In-Progress</span>
                          </span>
                        ) : (
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
                        )}
                      </td>

                      {/* Timing */}
                      <td className="p-4 text-slate-400">
                        <div>
                          <span className="text-slate-500">Start: </span>
                          {formatDate(c.started_at)}
                        </div>
                        <div>
                          <span className="text-slate-500">Sub: </span>
                          {formatDate(c.submitted_at)}
                        </div>
                      </td>

                      {/* Proctoring Incident Inspector Button */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedCandidate(c)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                            warningCount > 0
                              ? "bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                              : "bg-slate-900/80 text-emerald-400 border-emerald-500/20 hover:bg-slate-800"
                          }`}
                          title="Click to view Proctoring Incident Timeline"
                        >
                          {warningCount > 0 ? (
                            <>
                              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                              <span>{warningCount} Strike{warningCount > 1 ? "s" : ""}</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                              <span>0 Flags</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Score */}
                      <td className="p-4 text-right font-bold text-white">
                        {c.score !== undefined ? `${c.score} / ${c.total_marks}` : "—"}
                        {c.percentage !== undefined && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            {c.percentage}%
                          </div>
                        )}
                      </td>

                      {/* Actions */}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Proctoring Incident Timeline & Evidence Inspector Modal                   */}
      {/* ========================================================================= */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-800 max-w-xl w-full space-y-5 shadow-2xl animate-scaleUp max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    (selectedCandidate.proctor_warnings_count ?? 0) > 0
                      ? "bg-rose-500/20 text-rose-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Proctoring Incident Timeline
                  </h3>
                  <p className="text-xs text-slate-400">
                    Candidate: <span className="text-white font-semibold">{selectedCandidate.student_name}</span> ({selectedCandidate.student_email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Summary Banner */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Total Strikes</div>
                <div className="text-lg font-black text-white">
                  {selectedCandidate.proctor_warnings_count ?? 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Total Duration</div>
                <div className="text-lg font-black text-indigo-400">
                  {formatSeconds(selectedCandidate.total_time_seconds)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Integrity Level</div>
                <div
                  className={`text-lg font-black ${
                    (selectedCandidate.proctor_warnings_count ?? 0) === 0
                      ? "text-emerald-400"
                      : (selectedCandidate.proctor_warnings_count ?? 0) <= 2
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  {(selectedCandidate.proctor_warnings_count ?? 0) === 0
                    ? "Verified Clean"
                    : (selectedCandidate.proctor_warnings_count ?? 0) <= 2
                    ? "Flagged"
                    : "High Risk"}
                </div>
              </div>
            </div>

            {/* Incident List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {!selectedCandidate.proctor_events || selectedCandidate.proctor_events.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
                  <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto" />
                  <div className="text-sm font-bold text-white">Clean Proctoring Record</div>
                  <p className="text-xs text-slate-400">
                    No violations, tab switches, secondary devices, or absence events were detected during this candidate's attempt.
                  </p>
                </div>
              ) : (
                selectedCandidate.proctor_events.map((ev, idx) => (
                  <div
                    key={ev.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-white">
                        {getEventIcon(ev.event_type)}
                        <span>{ev.event_type.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            ev.severity === "CRITICAL"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : ev.severity === "HIGH"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {ev.severity}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "—"}
                        </span>
                      </div>
                    </div>
                    {ev.details && (
                      <p className="text-slate-300 text-[11px] leading-relaxed pl-6">
                        {ev.details}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
