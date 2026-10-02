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
  ExternalLink,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ExaminerApprovalModal } from "@/components/ExaminerApprovalModal";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AnimatedTypewriterText } from "@/components/AnimatedTypewriterText";
import { AmbientAuroraBackground } from "@/components/AmbientAuroraBackground";

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

interface AdminQuestionItem {
  id: string;
  exam_id?: string | null;
  section_id?: string | null;
  examiner_id?: string | null;
  question_text: string;
  subject: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  question_type: "MCQ" | "MULTI_SELECT" | "SHORT_ANSWER" | "LONG_ANSWER" | "IMAGE";
  marks: number;
  expected_answer?: string | null;
  options?: {
    id: string;
    option_text: string;
    is_correct: boolean;
    order: number;
  }[];
  created_at: string;
}

interface StatsData {
  totalStudents: number;
  totalExaminers: number;
  pendingApprovals: number;
  activeExaminers: number;
  rejectedExaminers: number;
  totalExams?: number;
  totalAttempts?: number;
}

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"EXAMINERS" | "EXAMS" | "QUESTIONS">("EXAMINERS");
  const [stats, setStats] = useState<StatsData>({
    totalStudents: 0,
    totalExaminers: 0,
    pendingApprovals: 0,
    activeExaminers: 0,
    rejectedExaminers: 0,
    totalExams: 0,
    totalAttempts: 0,
  });
  const [examiners, setExaminers] = useState<ExaminerItem[]>([]);
  const [exams, setExams] = useState<AdminExamItem[]>([]);
  const [questions, setQuestions] = useState<AdminQuestionItem[]>([]);
  const [questionSubjects, setQuestionSubjects] = useState<string[]>([]);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("PENDING");
  const [examFilterStatus, setExamFilterStatus] = useState<string>("ALL");
  const [qSubjectFilter, setQSubjectFilter] = useState<string>("ALL");
  const [qDifficultyFilter, setQDifficultyFilter] = useState<string>("ALL");
  const [qTypeFilter, setQTypeFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedExaminer, setSelectedExaminer] = useState<ExaminerItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchStats = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (res.ok && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    }
  }, []);

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
      const res = await fetch(`/api/admin/exams?status=${examFilterStatus}`);
      const data = await res.json();
      if (res.ok) {
        setExams(data.exams || []);
        if (data.stats) {
          setStats(data.stats);
        } else if (data.total !== undefined) {
          setStats((prev) => ({ ...prev, totalExams: data.total }));
        }
      }
    } catch (err) {
      console.error("Failed to load admin exams:", err);
    } finally {
      setLoading(false);
    }
  }, [examFilterStatus]);

  const fetchGlobalQuestions = React.useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (qSubjectFilter !== "ALL") queryParams.append("subject", qSubjectFilter);
      if (qDifficultyFilter !== "ALL") queryParams.append("difficulty", qDifficultyFilter);
      if (qTypeFilter !== "ALL") queryParams.append("question_type", qTypeFilter);

      const res = await fetch(`/api/admin/questions?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions || []);
        setTotalQuestionsCount(data.total || 0);
        if (data.subjects) {
          setQuestionSubjects(data.subjects);
        }
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load global question bank:", err);
    } finally {
      setLoading(false);
    }
  }, [qSubjectFilter, qDifficultyFilter, qTypeFilter]);

  // Initial load: fetch general stats & prefill all collections
  useEffect(() => {
    fetchStats();
    fetchExaminers("PENDING");
    fetchAdminExams();
    fetchGlobalQuestions();
  }, []);

  useEffect(() => {
    if (activeTab === "EXAMINERS") {
      fetchExaminers(filterStatus);
    } else if (activeTab === "EXAMS") {
      fetchAdminExams();
    } else if (activeTab === "QUESTIONS") {
      fetchGlobalQuestions();
    }
  }, [activeTab, filterStatus, examFilterStatus, qSubjectFilter, qDifficultyFilter, qTypeFilter, fetchExaminers, fetchAdminExams, fetchGlobalQuestions]);

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

  const filteredExams = exams.filter((exam) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      exam.title.toLowerCase().includes(term) ||
      (exam.examiner?.full_name && exam.examiner.full_name.toLowerCase().includes(term)) ||
      (exam.examiner?.email && exam.examiner.email.toLowerCase().includes(term)) ||
      (exam.examiner?.institution && exam.examiner.institution.toLowerCase().includes(term))
    );
  });

  const filteredQuestions = questions.filter((q) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      q.question_text.toLowerCase().includes(term) ||
      q.subject.toLowerCase().includes(term)
    );
  });

  const getStatusLabel = (status: string) => {
    if (status === "PENDING") return t("admin.pending", "Pending");
    if (status === "ACTIVE") return t("admin.active", "Active");
    if (status === "REJECTED") return t("admin.rejected", "Rejected");
    if (status === "SUSPENDED") return t("admin.suspended", "Suspended");
    return status;
  };

  const getExamStatusLabel = (status: string) => {
    if (status === "DRAFT") return t("admin.draft", "Draft");
    if (status === "PUBLISHED") return t("admin.published", "Published");
    if (status === "CLOSED") return t("admin.closed", "Closed");
    return status;
  };

  const getDifficultyLabel = (diff: string) => {
    if (diff === "EASY") return t("admin.easy", "Easy");
    if (diff === "MEDIUM") return t("admin.medium", "Medium");
    if (diff === "HARD") return t("admin.hard", "Hard");
    return diff;
  };

  return (
    <div className="space-y-10 pb-12 relative">
      <AmbientAuroraBackground variant="rose-indigo" intensity="subtle" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <Shield className="h-4 w-4" />
            <span>{t("admin.dashboardTitle", "Master Administrator Control")}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2 min-h-[44px]">
            <AnimatedTypewriterText
              text={t("admin.portalTitle", "System Administration")}
              speed={40}
              cursorColor="text-rose-600 dark:text-rose-400"
            />
          </h1>
          <p className="text-base text-slate-700 dark:text-slate-400 mt-2 max-w-3xl leading-relaxed font-medium">
            {t(
              "admin.portalDescription",
              "Full oversight of academic institutions, verified examiners, question banks, candidate leaderboards, and cohort proctoring analytics."
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              if (activeTab === "EXAMINERS") fetchExaminers(filterStatus);
              else if (activeTab === "EXAMS") fetchAdminExams();
              else fetchGlobalQuestions();
            }}
            disabled={loading}
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""}`} />
            <span>{t("admin.refreshData", "Refresh Data")}</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div
          className={`p-5 rounded-2xl text-base flex items-center justify-between animate-fadeIn ${
            actionMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-3 font-medium">
            {actionMessage.type === "success" ? (
              <CheckCircle className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-sm opacity-80 hover:opacity-100 font-bold uppercase tracking-wider px-3 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-slate-900/50 cursor-pointer"
          >
            {t("admin.dismiss", "Dismiss")}
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t("admin.pendingApprovals", "Pending Approvals")}
          value={loading && stats.totalExaminers === 0 ? "..." : stats.pendingApprovals}
          subtitle={t("admin.pendingApprovalsSubtitle", "Examiner requests awaiting review")}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title={t("admin.activeExaminers", "Active Examiners")}
          value={loading && stats.totalExaminers === 0 ? "..." : stats.activeExaminers}
          subtitle={t("admin.activeExaminersSubtitle", "Verified instructors & proctors")}
          icon={UserCheck}
          color="indigo"
        />
        <StatCard
          title={t("admin.registeredStudents", "Registered Students")}
          value={loading && stats.totalExaminers === 0 ? "..." : stats.totalStudents}
          subtitle={t("admin.registeredStudentsSubtitle", "Active examination candidates")}
          icon={GraduationCap}
          color="emerald"
        />
        <StatCard
          title={t("admin.globalAssessments", "Global Assessments")}
          value={loading && stats.totalExams === 0 ? "..." : (stats.totalExams ?? exams.length)}
          subtitle={t("admin.globalAssessmentsSubtitle", "Examinations across system")}
          icon={FileSpreadsheet}
          color="cyan"
        />
      </div>

      {/* Top Tab Switcher */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => {
            setActiveTab("EXAMINERS");
            setSearchTerm("");
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === "EXAMINERS"
              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/25 scale-[1.02]"
              : "bg-slate-100 dark:bg-slate-900/80 text-slate-800 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>
            {t("admin.examinerApprovalsTab", "Examiner Approvals")} ({stats.pendingApprovals}{" "}
            {t("admin.pending", "Pending")})
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("EXAMS");
            setSearchTerm("");
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === "EXAMS"
              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/25 scale-[1.02]"
              : "bg-slate-100 dark:bg-slate-900/80 text-slate-800 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>
            {t("admin.globalExamsTab", "Global Examinations Oversight")} ({stats.totalExams ?? exams.length})
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("QUESTIONS");
            setSearchTerm("");
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === "QUESTIONS"
              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/25 scale-[1.02]"
              : "bg-slate-100 dark:bg-slate-900/80 text-slate-800 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>
            {t("admin.masterQuestionPoolTab", "Master Question Pool")} ({totalQuestionsCount || t("admin.all", "All")})
          </span>
        </button>
      </div>

      {activeTab === "EXAMINERS" ? (
        /* Examiner Management Section */
        <div className="glass-card rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xl dark:shadow-2xl">
          {/* Table Header & Filter Bar */}
          <div className="p-7 border-b border-slate-200 dark:border-slate-800 space-y-5 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <UserCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                {t("admin.examinerManagementTitle", "Examiner Management & Approvals")}
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-400 mt-1 font-medium">
                {t(
                  "admin.examinerManagementSubtitle",
                  "Review credential verification requests before granting exam creation authority."
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder={t("admin.searchExaminerPlaceholder", "Search name, institution...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64 transition-colors"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-slate-800 text-sm">
                <button
                  onClick={() => setFilterStatus("PENDING")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                    filterStatus === "PENDING"
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold"
                      : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t("admin.pending", "Pending")} ({stats.pendingApprovals})
                </button>
                <button
                  onClick={() => setFilterStatus("ACTIVE")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                    filterStatus === "ACTIVE"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold"
                      : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t("admin.active", "Active")} ({stats.activeExaminers})
                </button>
                <button
                  onClick={() => setFilterStatus("REJECTED")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                    filterStatus === "REJECTED"
                      ? "bg-rose-600 text-white shadow-md shadow-rose-600/20 font-bold"
                      : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t("admin.rejected", "Rejected")} ({stats.rejectedExaminers})
                </button>
                <button
                  onClick={() => setFilterStatus("ALL")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                    filterStatus === "ALL"
                      ? "bg-slate-800 text-white shadow-md font-bold"
                      : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t("admin.all", "All")} ({stats.totalExaminers})
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/90 dark:bg-slate-900/50 text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-400">
                  <th className="px-7 py-4">{t("admin.examinerInfo", "Examiner Info")}</th>
                  <th className="px-7 py-4">{t("admin.institutionAndDept", "Institution & Dept")}</th>
                  <th className="px-7 py-4">{t("admin.status", "Status")}</th>
                  <th className="px-7 py-4">{t("admin.appliedDate", "Applied Date")}</th>
                  <th className="px-7 py-4 text-right">{t("admin.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-7 py-16 text-center text-slate-600 dark:text-slate-400">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600 dark:text-indigo-400 mb-3" />
                      <p className="text-base font-medium text-slate-800 dark:text-slate-300">
                        {t("admin.loadingExaminers", "Loading examiners...")}
                      </p>
                    </td>
                  </tr>
                ) : filteredExaminers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-7 py-16 text-center text-slate-600 dark:text-slate-400">
                      <Users className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
                      <p className="text-base font-semibold text-slate-800 dark:text-slate-300">
                        {t("admin.noExaminersFound", "No examiners found matching this filter.")}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-500 mt-1">
                        {t("admin.noExaminersSubtext", "When instructors submit applications, they will appear in this list.")}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredExaminers.map((examiner) => (
                    <tr key={examiner.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-7 py-5">
                        <div className="font-bold text-base text-slate-900 dark:text-white">{examiner.fullName}</div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-400 mt-0.5">{examiner.email}</div>
                      </td>
                      <td className="px-7 py-5">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                          <Building className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span>{examiner.institution || "—"}</span>
                        </div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-400 flex items-center gap-2 mt-1">
                          <Briefcase className="h-4 w-4 text-slate-500 shrink-0" />
                          <span>{examiner.department || "—"}</span>
                        </div>
                      </td>
                      <td className="px-7 py-5">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            examiner.status === "PENDING"
                              ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30"
                              : examiner.status === "ACTIVE"
                              ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                              : "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"
                          }`}
                        >
                          {examiner.status === "PENDING" && <Clock className="h-3.5 w-3.5 mr-1.5" />}
                          {examiner.status === "ACTIVE" && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                          {examiner.status === "REJECTED" && <XCircle className="h-3.5 w-3.5 mr-1.5" />}
                          {getStatusLabel(examiner.status)}
                        </span>
                      </td>
                      <td className="px-7 py-5 text-sm font-medium text-slate-800 dark:text-slate-400">
                        <div>{new Date(examiner.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-500 mt-0.5">
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
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer shadow-xs"
                              >
                                {t("admin.review", "Review")}
                              </button>
                              <button
                                onClick={() => handleApprove(examiner.id)}
                                className="p-2 rounded-xl text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 border border-emerald-200 dark:border-emerald-500/30 transition-colors cursor-pointer"
                                title={t("admin.approveExaminer", "Approve Examiner")}
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedExaminer(examiner);
                                  setIsModalOpen(true);
                                }}
                                className="p-2 rounded-xl text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 border border-rose-200 dark:border-rose-500/30 transition-colors cursor-pointer"
                                title={t("admin.rejectExaminer", "Reject Examiner")}
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
                              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                            >
                              <Eye className="h-4 w-4" />
                              <span>{t("admin.details", "Details")}</span>
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
      ) : activeTab === "EXAMS" ? (
        /* Global Examinations Oversight Section */
        <div className="glass-card rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xl dark:shadow-2xl space-y-0">
          <div className="p-7 border-b border-slate-200 dark:border-slate-800 space-y-5 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <FileSpreadsheet className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                {t("admin.globalExamsTitle", "Global Examinations Oversight")}
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-400 mt-1 font-medium">
                {t(
                  "admin.globalExamsSubtitle",
                  "Direct administrative access to question blueprints, live candidate rosters, student rankings, and AI proctoring analytics."
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder={t("admin.searchExamsPlaceholder", "Search exam title, examiner...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64 transition-colors"
                />
              </div>

              <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-slate-800 text-sm">
                {["ALL", "DRAFT", "PUBLISHED", "CLOSED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setExamFilterStatus(st)}
                    className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      examFilterStatus === st
                        ? "bg-indigo-600 text-white font-bold shadow-sm"
                        : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {st === "ALL" ? t("admin.all", "All") : getExamStatusLabel(st)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/90 dark:bg-slate-900/50 uppercase font-extrabold text-slate-800 dark:text-slate-400 tracking-wider">
                  <th className="px-6 py-4">{t("admin.examination", "Examination")}</th>
                  <th className="px-6 py-4">{t("admin.examinerAttribution", "Examiner Attribution")}</th>
                  <th className="px-6 py-4 text-center">{t("admin.sectionsPool", "Sections / Pool")}</th>
                  <th className="px-6 py-4 text-center">{t("admin.marksDuration", "Marks / Duration")}</th>
                  <th className="px-6 py-4 text-center">{t("admin.status", "Status")}</th>
                  <th className="px-6 py-4 text-center">{t("admin.attempts", "Attempts")}</th>
                  <th className="px-6 py-4 text-right">{t("admin.oversightActions", "Oversight Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-600 dark:text-slate-400">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600 dark:text-indigo-400 mb-3" />
                      <span>{t("admin.loadingExams", "Loading examinations...")}</span>
                    </td>
                  </tr>
                ) : filteredExams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-600 dark:text-slate-400">
                      <FileSpreadsheet className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">
                        {t("admin.noExamsFound", "No examinations found.")}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">{exam.title}</div>
                        <div className="text-[11px] font-medium text-slate-700 dark:text-slate-400 mt-0.5">
                          {t("admin.window", "Window")}: {new Date(exam.start_time).toLocaleDateString()} -{" "}
                          {new Date(exam.end_time).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-indigo-700 dark:text-indigo-300">
                          {exam.examiner?.full_name || t("admin.academicExaminer", "Academic Examiner")}
                        </div>
                        <div className="text-slate-700 dark:text-slate-400 text-[11px] font-medium">
                          {exam.examiner?.email || exam.examiner?.institution || "—"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {exam.sections.length} {t("admin.sections", "Sections")}
                        </span>
                        <div className="text-[11px] font-medium text-slate-700 dark:text-slate-400">
                          {exam.total_questions} {t("admin.questionsInPool", "Questions in pool")}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="font-extrabold text-amber-600 dark:text-amber-400">
                          {exam.total_marks} {t("admin.marks", "Marks")}
                        </span>
                        <div className="text-[11px] font-medium text-slate-700 dark:text-slate-400">
                          {exam.duration_minutes} {t("admin.mins", "Mins")}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
                            exam.status === "PUBLISHED"
                              ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
                              : exam.status === "DRAFT"
                              ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
                              : "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"
                          }`}
                        >
                          {getExamStatusLabel(exam.status)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center font-extrabold text-sm text-slate-900 dark:text-white">
                        {exam.attempts_count}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/examiner/exams/${exam.id}/manage`}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
                            title="Inspect Question Pools & Blueprint"
                          >
                            <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-[11px] font-semibold hidden xl:inline">
                              {t("admin.pools", "Pools")}
                            </span>
                          </Link>

                          <Link
                            href={`/examiner/exams/${exam.id}/candidates`}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
                            title="Candidate Submissions & Grading"
                          >
                            <Users className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                            <span className="text-[11px] font-semibold hidden xl:inline">
                              {t("admin.candidates", "Candidates")}
                            </span>
                          </Link>

                          <Link
                            href={`/examiner/exams/${exam.id}/leaderboard`}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:border-amber-400 dark:hover:border-amber-500/40 transition-colors shadow-xs"
                            title="Student Leaderboard & Rankings"
                          >
                            <Trophy className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-semibold hidden xl:inline">
                              {t("admin.leaderboard", "Leaderboard")}
                            </span>
                          </Link>

                          <Link
                            href={`/examiner/exams/${exam.id}/analytics`}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-400 dark:hover:border-emerald-500/40 transition-colors shadow-xs"
                            title="Proctoring & Score Analytics"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-semibold hidden xl:inline">
                              {t("admin.analytics", "Analytics")}
                            </span>
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
      ) : (
        /* Global Question Pool Section */
        <div className="glass-card rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xl dark:shadow-2xl space-y-0">
          <div className="p-7 border-b border-slate-200 dark:border-slate-800 space-y-5 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Layers className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                {t("admin.masterQuestionPoolTitle", "Master Question Pool & Bank")}
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-400 mt-1 font-medium">
                {t(
                  "admin.masterQuestionPoolSubtitle",
                  "Browse, search, and verify questions created by examiners across all subjects and difficulty levels."
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder={t("admin.searchQuestionsPlaceholder", "Search question text or subject...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-60 transition-colors"
                />
              </div>

              {/* Subject Filter */}
              <select
                value={qSubjectFilter}
                onChange={(e) => setQSubjectFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">{t("admin.allSubjects", "All Subjects")}</option>
                {questionSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={qDifficultyFilter}
                onChange={(e) => setQDifficultyFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">{t("admin.allDifficulties", "All Difficulties")}</option>
                <option value="EASY">{t("admin.easy", "Easy")}</option>
                <option value="MEDIUM">{t("admin.medium", "Medium")}</option>
                <option value="HARD">{t("admin.hard", "Hard")}</option>
              </select>

              {/* Type Filter */}
              <select
                value={qTypeFilter}
                onChange={(e) => setQTypeFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">{t("admin.allTypes", "All Types")}</option>
                <option value="MCQ">{t("admin.mcq", "MCQ")}</option>
                <option value="MULTI_SELECT">{t("admin.multiSelect", "Multi-Select")}</option>
                <option value="SHORT_ANSWER">{t("admin.shortAnswer", "Short Answer")}</option>
                <option value="LONG_ANSWER">{t("admin.descriptive", "Descriptive")}</option>
                <option value="IMAGE">{t("admin.imageBased", "Image-based")}</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <div className="p-16 text-center text-slate-600 dark:text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600 dark:text-indigo-400 mb-3" />
                <span>{t("admin.loadingQuestionPool", "Loading question pool...")}</span>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-16 text-center text-slate-600 dark:text-slate-400">
                <BookOpen className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
                <p className="text-base font-semibold text-slate-800 dark:text-slate-300">
                  {t("admin.noQuestionsFound", "No questions found matching criteria.")}
                </p>
              </div>
            ) : (
              filteredQuestions.map((q, idx) => (
                <div key={q.id} className="p-6 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                      <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                        {q.subject}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase border ${
                          q.difficulty === "EASY"
                            ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
                            : q.difficulty === "MEDIUM"
                            ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
                            : "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30"
                        }`}
                      >
                        {getDifficultyLabel(q.difficulty)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {q.question_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                        {q.marks} {t("admin.marks", "Marks")}
                      </span>
                      {q.exam_id && (
                        <Link
                          href={`/examiner/exams/${q.exam_id}/manage`}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-semibold"
                        >
                          <span>{t("admin.assignedExam", "Assigned Exam")}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-900 dark:text-slate-200 font-semibold leading-relaxed">
                    {q.question_text}
                  </p>

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={opt.id || oIdx}
                          className={`flex items-center gap-2 p-2.5 rounded-xl text-xs border ${
                            opt.is_correct
                              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-semibold"
                              : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300"
                          }`}
                        >
                          <span className="font-bold text-[10px] opacity-75">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          <span className="flex-1 truncate">{opt.option_text}</span>
                          {opt.is_correct && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
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
