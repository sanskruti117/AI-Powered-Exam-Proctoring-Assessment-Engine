"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Users,
  UserCheck,
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  Building,
  Briefcase,
  Mail,
  RefreshCw,
  Search,
  Check,
  X,
  Eye,
  AlertCircle,
  FileSpreadsheet,
  Trophy,
  BarChart3,
  Layers,
  Award,
  ExternalLink,
  Trash2,
  PlayCircle,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ExaminerApprovalModal } from "@/components/ExaminerApprovalModal";

interface ExaminerItem {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  institution?: string | null;
  department?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  approvedBy?: {
    fullName: string;
    email: string;
  } | null;
}

interface ExamSection {
  id: string;
  title: string;
  target_marks: number;
  total_pool_questions: number;
  total_pool_marks: number;
}

interface AdminExamItem {
  id: string;
  examiner_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  created_at: string;
  sections: ExamSection[];
  total_questions: number;
  attempts_count: number;
  examiner?: {
    full_name: string;
    email: string;
    institution?: string;
  };
}

interface StatsData {
  totalStudents: number;
  totalExaminers: number;
  pendingApprovals: number;
  activeExaminers: number;
  rejectedExaminers: number;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"EXAMINERS" | "EXAMS">("EXAMINERS");
  const [stats, setStats] = useState<StatsData>({
    totalStudents: 0,
    totalExaminers: 0,
    pendingApprovals: 0,
    activeExaminers: 0,
    rejectedExaminers: 0,
  });
  const [examiners, setExaminers] = useState<ExaminerItem[]>([]);
  const [exams, setExams] = useState<AdminExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("PENDING");
  const [examFilterStatus, setExamFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExaminer, setSelectedExaminer] = useState<ExaminerItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchExaminers = React.useCallback(async (status: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/examiners?status=${status}`);
      const data = await res.json();
      if (res.ok) {
        setExaminers(data.examiners || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load examiners:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdminExams = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (examFilterStatus !== "ALL") params.append("status", examFilterStatus);
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(`/api/exams?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setExams(data.exams || []);
      }
    } catch (err) {
      console.error("Failed to load exams:", err);
    } finally {
      setLoading(false);
    }
  }, [examFilterStatus, searchTerm]);

  useEffect(() => {
    if (activeTab === "EXAMINERS") {
      fetchExaminers(filterStatus);
    } else {
      fetchAdminExams();
    }
  }, [activeTab, filterStatus, examFilterStatus, fetchExaminers, fetchAdminExams]);


  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/examiners/${id}/approve`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve");

      setActionMessage({ type: "success", text: data.message || "Examiner approved successfully." });
      fetchExaminers(filterStatus);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to approve examiner." });
      throw err;
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const res = await fetch(`/api/admin/examiners/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject");

      setActionMessage({ type: "success", text: data.message || "Examiner rejected." });
      fetchExaminers(filterStatus);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to reject examiner." });
      throw err;
    }
  };

  const filteredExaminers = examiners.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      e.fullName.toLowerCase().includes(term) ||
      e.email.toLowerCase().includes(term) ||
      (e.institution && e.institution.toLowerCase().includes(term)) ||
      (e.department && e.department.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-10 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-800 pb-8">
        <div>
          <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-rose-400">
            <Shield className="h-4 w-4" />
            <span>Master Administrator Control</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
            System Administration
          </h1>
          <p className="text-base text-slate-400 mt-2 max-w-3xl leading-relaxed">
            Manage academic institutions, review examiner verification requests, and maintain role boundaries.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => fetchExaminers(filterStatus)}
            disabled={loading}
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div
          className={`p-5 rounded-2xl text-base flex items-center justify-between animate-fadeIn ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/25 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-3 font-medium">
            {actionMessage.type === "success" ? (
              <CheckCircle className="h-6 w-6 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-6 w-6 shrink-0 text-rose-400" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-sm opacity-80 hover:opacity-100 font-bold uppercase tracking-wider px-3 py-1 rounded-lg hover:bg-slate-900/50"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          subtitle="Examiner requests awaiting review"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Active Examiners"
          value={stats.activeExaminers}
          subtitle="Verified instructors & proctors"
          icon={UserCheck}
          color="indigo"
        />
        <StatCard
          title="Registered Students"
          value={stats.totalStudents}
          subtitle="Active examination candidates"
          icon={GraduationCap}
          color="emerald"
        />
        <StatCard
          title="Admin Authority"
          value="1 / 1"
          subtitle="Single Master Admin Enforced"
          icon={Shield}
          color="rose"
        />
      </div>

      {/* Top Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => {
            setActiveTab("EXAMINERS");
            setSearchTerm("");
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === "EXAMINERS"
              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Examiner Approvals ({stats.pendingApprovals} Pending)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("EXAMS");
            setSearchTerm("");
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === "EXAMS"
              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Global Examinations Oversight ({exams.length})</span>
        </button>
      </div>

      {activeTab === "EXAMINERS" ? (
        /* Examiner Management Section */
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          {/* Table Header & Filter Bar */}
          <div className="p-7 border-b border-slate-800 space-y-5 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <UserCheck className="h-6 w-6 text-indigo-400" />
                Examiner Management & Approvals
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Review credential verification requests before granting exam creation authority.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, institution..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64 transition-colors"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center rounded-xl bg-slate-900 p-1.5 border border-slate-800 text-sm">
                <button
                  onClick={() => setFilterStatus("PENDING")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                    filterStatus === "PENDING"
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Pending ({stats.pendingApprovals})
                </button>
                <button
                  onClick={() => setFilterStatus("ACTIVE")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                    filterStatus === "ACTIVE"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Active ({stats.activeExaminers})
                </button>
                <button
                  onClick={() => setFilterStatus("REJECTED")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                    filterStatus === "REJECTED"
                      ? "bg-rose-600 text-white shadow-md shadow-rose-600/20 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Rejected ({stats.rejectedExaminers})
                </button>
                <button
                  onClick={() => setFilterStatus("ALL")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                    filterStatus === "ALL"
                      ? "bg-slate-700 text-white shadow-md font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  All ({stats.totalExaminers})
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-7 py-4">Examiner Info</th>
                  <th className="px-7 py-4">Institution & Dept</th>
                  <th className="px-7 py-4">Status</th>
                  <th className="px-7 py-4">Applied Date</th>
                  <th className="px-7 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-7 py-16 text-center text-slate-400">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-400 mb-3" />
                      <p className="text-base font-medium text-slate-300">Loading examiners...</p>
                    </td>
                  </tr>
                ) : filteredExaminers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-7 py-16 text-center text-slate-400">
                      <Users className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                      <p className="text-base font-semibold text-slate-300">No examiners found matching this filter.</p>
                      <p className="text-sm text-slate-500 mt-1">When instructors submit applications, they will appear in this list.</p>
                    </td>
                  </tr>
                ) : (
                  filteredExaminers.map((examiner) => (
                    <tr key={examiner.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-7 py-5">
                        <div className="font-bold text-base text-white">{examiner.fullName}</div>
                        <div className="text-sm text-slate-400 mt-0.5">{examiner.email}</div>
                      </td>
                      <td className="px-7 py-5">
                        <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
                          <Building className="h-4 w-4 text-indigo-400 shrink-0" />
                          <span>{examiner.institution || "—"}</span>
                        </div>
                        <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                          <Briefcase className="h-4 w-4 text-slate-500 shrink-0" />
                          <span>{examiner.department || "—"}</span>
                        </div>
                      </td>
                      <td className="px-7 py-5">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            examiner.status === "PENDING"
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : examiner.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {examiner.status === "PENDING" && <Clock className="h-3.5 w-3.5 mr-1.5" />}
                          {examiner.status === "ACTIVE" && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                          {examiner.status === "REJECTED" && <XCircle className="h-3.5 w-3.5 mr-1.5" />}
                          {examiner.status}
                        </span>
                      </td>
                      <td className="px-7 py-5 text-sm text-slate-400">
                        <div>{new Date(examiner.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(examiner.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="px-7 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {examiner.status === "PENDING" ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedExaminer(examiner);
                                  setIsModalOpen(true);
                                }}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
                              >
                                Review
                              </button>
                              <button
                                onClick={() => handleApprove(examiner.id)}
                                className="p-2 rounded-xl text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors cursor-pointer"
                                title="Approve Examiner"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedExaminer(examiner);
                                  setIsModalOpen(true);
                                }}
                                className="p-2 rounded-xl text-rose-400 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 transition-colors cursor-pointer"
                                title="Reject Examiner"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedExaminer(examiner);
                                setIsModalOpen(true);
                              }}
                              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                              <span>Details</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Global Examinations Oversight Section */
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl space-y-0">
          <div className="p-7 border-b border-slate-800 space-y-5 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <FileSpreadsheet className="h-6 w-6 text-indigo-400" />
                Global Examinations Oversight
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Comprehensive supervision of all tests, examiner attributions, and candidate score reports across the platform.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search exam title, examiner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64 transition-colors"
                />
              </div>

              <div className="flex items-center rounded-xl bg-slate-900 p-1.5 border border-slate-800 text-sm">
                {["ALL", "DRAFT", "PUBLISHED", "CLOSED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setExamFilterStatus(st)}
                    className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      examFilterStatus === st
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/50 uppercase font-bold text-slate-400 tracking-wider">
                  <th className="px-6 py-4">Examination</th>
                  <th className="px-6 py-4">Examiner Attribution</th>
                  <th className="px-6 py-4 text-center">Sections / Pool</th>
                  <th className="px-6 py-4 text-center">Marks / Duration</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Attempts</th>
                  <th className="px-6 py-4 text-right">Oversight Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-400 mb-3" />
                      <span>Loading examinations...</span>
                    </td>
                  </tr>
                ) : exams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                      <FileSpreadsheet className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                      <p className="text-sm font-semibold text-slate-300">No examinations found.</p>
                    </td>
                  </tr>
                ) : (
                  exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-white">{exam.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Window: {new Date(exam.start_time).toLocaleDateString()} -{" "}
                          {new Date(exam.end_time).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-indigo-300">
                          {exam.examiner?.full_name || "Academic Examiner"}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {exam.examiner?.email || exam.examiner?.institution || "—"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-white">
                          {exam.sections.length} Sections
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {exam.total_questions} Questions in pool
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="font-extrabold text-amber-400">
                          {exam.total_marks} Marks
                        </span>
                        <div className="text-[11px] text-slate-400">{exam.duration_minutes} Mins</div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
                            exam.status === "PUBLISHED"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : exam.status === "DRAFT"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          {exam.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center font-extrabold text-sm text-white">
                        {exam.attempts_count}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/examiner/exams/${exam.id}/manage`}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                            title="Inspect Question Pools"
                          >
                            <Layers className="h-3.5 w-3.5" />
                          </Link>

                          <Link
                            href={`/examiner/exams/${exam.id}/leaderboard`}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 hover:text-white"
                            title="Leaderboard"
                          >
                            <Trophy className="h-3.5 w-3.5" />
                          </Link>

                          <Link
                            href={`/examiner/exams/${exam.id}/analytics`}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 hover:text-white"
                            title="Cohort Analytics"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ExaminerApprovalModal
        examiner={selectedExaminer}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExaminer(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
