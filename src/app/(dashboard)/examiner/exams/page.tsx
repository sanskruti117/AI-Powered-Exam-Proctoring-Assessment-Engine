"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Calendar,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Trophy,
  PenTool,
  PlayCircle,
  XCircle,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  FileText,
  LayoutDashboard,
  Users,
} from "lucide-react";

interface ExamSection {
  id: string;
  exam_id: string;
  title: string;
  description?: string;
  order: number;
  target_marks: number;
  required_question_count?: number;
  total_pool_questions: number;
  total_pool_marks: number;
}

interface ExamItem {
  id: string;
  examiner_id: string;
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
  created_at: string;
  sections: ExamSection[];
  total_questions: number;
  total_pool_marks: number;
  attempts_count: number;
  can_delete: boolean;
  is_active: boolean;
  is_upcoming: boolean;
  is_ended: boolean;
}

export default function ExaminerExamsPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDesc, setModalDesc] = useState("");
  const [modalStartTime, setModalStartTime] = useState("");
  const [modalEndTime, setModalEndTime] = useState("");
  const [modalDuration, setModalDuration] = useState(30);
  const [modalTotalMarks, setModalTotalMarks] = useState(30);
  const [modalPassingMarks, setModalPassingMarks] = useState(12);
  const [modalMaxAttempts, setModalMaxAttempts] = useState(1);
  const [modalShuffleQuestions, setModalShuffleQuestions] = useState(true);
  const [modalShuffleOptions, setModalShuffleOptions] = useState(true);
  const [modalSections, setModalSections] = useState<
    { id?: string; title: string; target_marks: number; description: string }[]
  >([{ title: "Section 1", target_marks: 30, description: "" }]);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
  }, [statusFilter]);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      openCreateModal();
    }
  }, [searchParams]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const res = await fetch(`/api/exams?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load examinations.");

      const data = await res.json();
      setExams(data.exams || data || []);
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to load exams." });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExams();
  };

  const openCreateModal = () => {
    setEditingExamId(null);
    setModalTitle("");
    setModalDesc("");
    setModalError(null);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setModalStartTime(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setModalEndTime(new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16));

    setModalDuration(30);
    setModalTotalMarks(30);
    setModalPassingMarks(12);
    setModalMaxAttempts(1);
    setModalShuffleQuestions(true);
    setModalShuffleOptions(true);
    setModalSections([{ title: "Section 1", target_marks: 30, description: "" }]);
    setIsModalOpen(true);
  };

  const toDateTimeLocal = (value: string) => {
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const openEditModal = (exam: ExamItem) => {
    setEditingExamId(exam.id);
    setModalTitle(exam.title);
    setModalDesc(exam.description || "");
    setModalStartTime(toDateTimeLocal(exam.start_time));
    setModalEndTime(toDateTimeLocal(exam.end_time));
    setModalDuration(exam.duration_minutes);
    setModalTotalMarks(exam.total_marks);
    setModalPassingMarks(exam.passing_marks);
    setModalMaxAttempts(exam.max_attempts);
    setModalShuffleQuestions(exam.shuffle_questions);
    setModalShuffleOptions(exam.shuffle_options);
    setModalSections(
      exam.sections && exam.sections.length > 0
        ? exam.sections.map((section: any) => ({
            id: section.id,
            title: section.title,
            target_marks: section.target_marks,
            description: section.description || "",
          }))
        : [{ title: "Section 1", target_marks: exam.total_marks, description: "" }]
    );
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleAddSectionRow = () => {
    setModalSections((prev) => [
      ...prev,
      { title: `Section ${prev.length + 1}`, target_marks: 10, description: "" },
    ]);
  };

  const handleRemoveSectionRow = (idx: number) => {
    if (modalSections.length <= 1) return;
    setModalSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setModalError(null);

    if (!modalTitle.trim()) {
      setModalError("Please enter an exam title.");
      return;
    }

    if (!modalStartTime || !modalEndTime) {
      setModalError("Please select both start and end dates/times.");
      return;
    }

    const startDate = new Date(modalStartTime);
    const endDate = new Date(modalEndTime);
    if (endDate <= startDate) {
      setModalError("End time must be after the start time.");
      return;
    }

    const sectionSum = modalSections.reduce((acc, s) => acc + Number(s.target_marks || 0), 0);
    if (sectionSum !== Number(modalTotalMarks)) {
      setModalError(
        `The sum of section target marks (${sectionSum}) must equal the total exam marks (${modalTotalMarks}). Please adjust your section marks.`
      );
      return;
    }

    try {
      setActionLoading("saving");
      const payload = {
        title: modalTitle.trim(),
        description: modalDesc.trim() || undefined,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_minutes: Number(modalDuration),
        total_marks: Number(modalTotalMarks),
        passing_marks: Number(modalPassingMarks),
        max_attempts: Number(modalMaxAttempts),
        shuffle_questions: modalShuffleQuestions,
        shuffle_options: modalShuffleOptions,
        sections: modalSections.map((s, idx) => ({
          id: s.id,
          title: s.title.trim(),
          description: s.description?.trim() || undefined,
          order: idx + 1,
          target_marks: Number(s.target_marks),
        })),
      };

      const res = await fetch(editingExamId ? `/api/exams/${editingExamId}` : "/api/exams", {
        method: editingExamId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Failed to save examination.");
      }

      setFeedback({ type: "success", msg: editingExamId ? "Examination updated successfully!" : "Examination created successfully!" });
      setIsModalOpen(false);
      fetchExams();
    } catch (err: any) {
      setModalError(err.message || "Failed to save exam.");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishExam = async (examId: string) => {
    if (!confirm("Are you sure you want to publish this examination? Once published, candidate attempts will be accepted during the scheduled window.")) {
      return;
    }

    try {
      setActionLoading(examId);
      setFeedback(null);
      const res = await fetch(`/api/exams/${examId}/publish`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || "Publish validation failed.");
      }

      setFeedback({ type: "success", msg: data.message || "Exam successfully published!" });
      fetchExams();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseExam = async (examId: string) => {
    if (!confirm("Are you sure you want to close this examination? No new attempts will be accepted.")) {
      return;
    }

    try {
      setActionLoading(examId);
      const res = await fetch(`/api/exams/${examId}/close`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to close exam.");
      }

      setFeedback({ type: "success", msg: "Exam closed successfully." });
      fetchExams();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Are you sure you want to permanently delete this exam? This action cannot be undone.")) {
      return;
    }

    try {
      setActionLoading(examId);
      const res = await fetch(`/api/exams/${examId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to delete exam.");
      }

      setFeedback({ type: "success", msg: "Exam deleted successfully." });
      fetchExams();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  // KPI Calculations (Draft, Scheduled, Live, Closed)
  const draftExamsCount = exams.filter((e) => e.status === "DRAFT").length;
  const scheduledExamsCount = exams.filter((e) => e.status === "PUBLISHED" && e.is_upcoming).length;
  const liveExamsCount = exams.filter((e) => e.status === "PUBLISHED" && e.is_active).length;
  const closedExamsCount = exams.filter((e) => e.status === "CLOSED" || e.is_ended).length;

  const formatReadableDate = (isoString?: string) => {
    if (!isoString) return "—";
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

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <FileSpreadsheet className="h-4 w-4" />
            <span>{t("examiner.assessmentWorkspace", "Examiner Studio")}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            {t("examiner.examsTitle", "Examinations & Assessments")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t("examiner.examsSubtitle", "Create structured exams with subject sections, configure randomized delivery, and monitor real-time candidate leaderboards.")}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/25 transition-all self-start md:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{t("examiner.createNewExam", "Create New Exam")}</span>
        </button>
      </div>

      {/* Global Alerts */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            )}
            <span className="text-sm font-semibold">{feedback.msg}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Status Cards (Draft, Scheduled, Live, Closed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-1 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t("examiner.drafts", "Drafts")}</span>
            <FileText className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{draftExamsCount}</div>
          <div className="text-xs text-slate-600 dark:text-slate-500 font-medium">{t("examiner.draftsSubtitle", "In authoring / staging")}</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-1 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t("examiner.scheduled", "Scheduled")}</span>
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{scheduledExamsCount}</div>
          <div className="text-xs text-slate-600 dark:text-slate-500 font-medium">{t("examiner.scheduledSubtitle", "Upcoming test windows")}</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-1 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t("examiner.liveNow", "Live Now")}</span>
            <PlayCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{liveExamsCount}</div>
          <div className="text-xs text-slate-600 dark:text-slate-500 font-medium">{t("examiner.liveNowSubtitle", "Currently accepting attempts")}</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-1 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t("examiner.closedEnded", "Closed / Ended")}</span>
            <ShieldCheck className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-300">{closedExamsCount}</div>
          <div className="text-xs text-slate-600 dark:text-slate-500 font-medium">{t("examiner.closedEndedSubtitle", "Completed examinations")}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder={t("examiner.searchExamsPlaceholder", "Search exams by title or topic...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {[
            { id: "ALL", label: t("common.all", "ALL") },
            { id: "DRAFT", label: t("examiner.draft", "DRAFT") },
            { id: "PUBLISHED", label: t("examiner.published", "PUBLISHED") },
            { id: "CLOSED", label: t("examiner.closed", "CLOSED") },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              }`}
            >
              {st.label}
            </button>
          ))}
          <button
            onClick={fetchExams}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title={t("common.refresh", "Refresh")}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Exam Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-600 dark:text-slate-400 font-medium">{t("common.loading", "Loading examinations...")}</div>
      ) : exams.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4 bg-white dark:bg-slate-900 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("examiner.noExamsFound", "No Examinations Found")}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              {t("examiner.noExamsSubtitle", "Create your first examination to define subject sections, populate randomized question pools, and schedule assessments.")}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t("examiner.createNewExam", "Create Exam")}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {exams.map((exam) => {
            const isPublishable = exam.sections.every(
              (sec) => sec.total_pool_marks >= sec.target_marks
            );

            return (
              <div
                key={exam.id}
                className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 bg-white dark:bg-slate-900/70 transition-all space-y-6 relative overflow-hidden shadow-sm"
              >
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                          exam.status === "PUBLISHED"
                            ? exam.is_active
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : exam.is_upcoming
                              ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                              : "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30"
                            : exam.status === "DRAFT"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                            : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                        }`}
                      >
                        {exam.status === "PUBLISHED"
                          ? exam.is_active
                            ? `● ${t("examiner.liveActive", "LIVE ACTIVE")}`
                            : exam.is_upcoming
                            ? t("examiner.scheduled", "SCHEDULED")
                            : t("examiner.concluded", "ENDED")
                          : exam.status === "DRAFT"
                          ? t("examiner.draft", "DRAFT")
                          : t("examiner.closed", "CLOSED")}
                      </span>

                      <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                        {formatReadableDate(exam.created_at)}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {exam.title}
                    </h2>
                    {exam.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 max-w-3xl">
                        {exam.description}
                      </p>
                    )}
                  </div>

                  {/* Top Stats Badges */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-xs text-slate-600 dark:text-slate-500 font-bold uppercase">{t("examiner.duration", "Duration")}</div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>{exam.duration_minutes}m</span>
                      </div>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-xs text-slate-600 dark:text-slate-500 font-bold uppercase">{t("examiner.totalMarks", "Total Marks")}</div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                        <Award className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span>{exam.total_marks}</span>
                      </div>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-xs text-slate-600 dark:text-slate-500 font-bold uppercase">{t("examiner.submissions", "Submissions")}</div>
                      <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                        <Trophy className="h-3.5 w-3.5" />
                        <span>{exam.attempts_count}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subject Sections & Pool Breakdown */}
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-400">
                    <span>{t("examiner.configuredSections", "Configured Subject Sections")} ({exam.sections.length})</span>
                    <span>{t("examiner.questionPoolVsTarget", "Question Pool vs Target Marks")}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {exam.sections.map((sec) => {
                      const isReady = sec.total_pool_marks >= sec.target_marks;
                      const progressPct = Math.min(
                        100,
                        Math.round((sec.total_pool_marks / (sec.target_marks || 1)) * 100)
                      );

                      return (
                        <div
                          key={sec.id}
                          className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                            isReady
                              ? "bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800"
                              : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                            <span className="truncate pr-2">{sec.title}</span>
                            <span className="text-amber-600 dark:text-amber-400 font-extrabold">{sec.target_marks} {t("examiner.marks", "Marks")}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                              <span>{t("examiner.pool", "Pool")}: {sec.total_pool_questions} {t("examiner.poolQuestions", "questions")}</span>
                              <span className={isReady ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-rose-600 dark:text-rose-400 font-bold"}>
                                {sec.total_pool_marks} / {sec.target_marks} {t("examiner.marks", "marks")}
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isReady ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>

                          {!isReady && (
                            <div className="text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1 font-bold">
                              <span>⚠️ {t("examiner.needsQuestionsPool", "Needs questions to form target marks")}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Timing & Shuffling Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-400 pt-2 font-medium">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {t("examiner.starts", "Starts")}: {formatReadableDate(exam.start_time)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {t("examiner.ends", "Ends")}: {formatReadableDate(exam.end_time)}
                    </span>
                  </div>

                  <div>
                    {exam.shuffle_questions && (
                      <span className="mr-3 text-slate-700 dark:text-slate-400">✓ {t("examiner.shuffledQuestions", "Shuffled Questions")}</span>
                    )}
                    {exam.shuffle_options && (
                      <span className="text-slate-700 dark:text-slate-400">✓ {t("examiner.shuffledOptions", "Shuffled Options")}</span>
                    )}
                  </div>
                </div>

                {/* Primary Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/examiner/exams/${exam.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      <span>{t("examiner.assessmentWorkspace", "Open Workspace")}</span>
                    </Link>

                    <Link
                      href={`/examiner/exams/${exam.id}/manage`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all"
                    >
                      <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{t("examiner.questionPaperPools", "Manage Pools")} ({exam.total_questions})</span>
                    </Link>

                    <Link
                      href={`/examiner/exams/${exam.id}/candidates`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all"
                    >
                      <Users className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                      <span>{t("examiner.candidates", "Candidates")} ({exam.attempts_count})</span>
                    </Link>

                    <Link
                      href={`/examiner/exams/${exam.id}/evaluate`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all"
                    >
                      <PenTool className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                      <span>{t("examiner.gradingStudio", "Grading")}</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(exam)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{t("examiner.editExamDetails", "Edit settings")}</span>
                    </button>
                    {exam.status === "DRAFT" && (
                      <button
                        onClick={() => handlePublishExam(exam.id)}
                        disabled={actionLoading === exam.id || !isPublishable}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          isPublishable
                            ? "text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 cursor-pointer"
                            : "text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed"
                        }`}
                        title={
                          isPublishable
                            ? t("examiner.publishExam", "Publish Examination")
                            : t("examiner.cannotPublishTargetMarks", "Cannot publish — one or more sections do not meet the minimum target marks.")
                        }
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        <span>
                          {actionLoading === exam.id ? t("examiner.saving", "Publishing...") : t("examiner.publishExam", "Publish Exam")}
                        </span>
                      </button>
                    )}

                    {exam.status === "PUBLISHED" && (
                      <button
                        onClick={() => handleCloseExam(exam.id)}
                        disabled={actionLoading === exam.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                        <span>{t("examiner.closeExam", "Close Exam")}</span>
                      </button>
                    )}

                    {exam.can_delete && (
                      <button
                        onClick={() => handleDeleteExam(exam.id)}
                        disabled={actionLoading === exam.id}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
                        title={t("examiner.deleteExam", "Delete Exam")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 w-full max-w-3xl space-y-6 my-8 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingExamId ? t("examiner.modalEditExamTitle", "Edit Examination") : t("examiner.modalCreateExamTitle", "Create New Examination")}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {t("examiner.modalExamDesc", "Configure assessment timing, section weightage, and randomized delivery policies.")}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-2 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("examiner.examTitleLabel", "Exam Title")} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Midterm Assessment: Computer Architecture & OS"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("examiner.examDescLabel", "Description & Instructions")}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide exam instructions, guidelines, and reference formulas..."
                    value={modalDesc}
                    onChange={(e) => setModalDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Schedule Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("examiner.startTimeLabel", "Start Window (Date & Time)")} *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={modalStartTime}
                      onChange={(e) => setModalStartTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("examiner.endTimeLabel", "End Window (Date & Time)")} *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={modalEndTime}
                      onChange={(e) => setModalEndTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Marks and Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("examiner.durationMinutesLabel", "Duration (Mins)")} *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={modalDuration}
                      onChange={(e) => setModalDuration(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("examiner.totalMarksLabel", "Total Marks")} *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={modalTotalMarks}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setModalTotalMarks(val);
                        // Auto-adjust if only 1 section exists
                        if (modalSections.length === 1) {
                          setModalSections([{ ...modalSections[0], target_marks: val }]);
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("examiner.passingMarksLabel", "Passing Marks")} *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={modalTotalMarks}
                      value={modalPassingMarks}
                      onChange={(e) => setModalPassingMarks(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("examiner.maxAttemptsLabel", "Max Attempts")} *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={5}
                      value={modalMaxAttempts}
                      onChange={(e) => setModalMaxAttempts(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Shuffling Policies */}
                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-800 dark:text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={modalShuffleQuestions}
                      onChange={(e) => setModalShuffleQuestions(e.target.checked)}
                      className="h-4 w-4 rounded bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{t("examiner.shuffleQuestionsLabel", "Shuffle Questions Order")}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-800 dark:text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={modalShuffleOptions}
                      onChange={(e) => setModalShuffleOptions(e.target.checked)}
                      className="h-4 w-4 rounded bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{t("examiner.shuffleOptionsLabel", "Shuffle Option Choices")}</span>
                  </label>
                </div>

                {/* Subject Sections Builder */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t("examiner.sectionsHeader", "Subject Sections & Target Marks")}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {t("examiner.sectionsSubheader", "Define the subject hierarchy. Questions created under this exam will be mapped to these sections.")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSectionRow}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{t("examiner.addSection", "Add Section")}</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {modalSections.map((sec, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800"
                      >
                        <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Subject Title (e.g. Python, SQL)"
                          value={sec.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setModalSections((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, title: val } : s))
                            );
                          }}
                          className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                        <div className="flex items-center gap-1.5 w-36">
                          <input
                            type="number"
                            required
                            min={1}
                            placeholder="Marks"
                            value={sec.target_marks}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setModalSections((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, target_marks: val } : s))
                              );
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                          />
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t("examiner.marks", "Marks")}</span>
                        </div>
                        {modalSections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSectionRow(idx)}
                            className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-right font-bold text-slate-700 dark:text-slate-400">
                    {t("examiner.totalSectionMarks", "Total Section Marks")}:{" "}
                    <span
                      className={
                        modalSections.reduce((acc, s) => acc + Number(s.target_marks || 0), 0) ===
                        modalTotalMarks
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }
                    >
                      {modalSections.reduce((acc, s) => acc + Number(s.target_marks || 0), 0)} /{" "}
                      {modalTotalMarks} {t("examiner.marks", "Marks")}
                    </span>
                  </div>
                </div>

                {/* In-Modal Error Feedback Alert */}
                {modalError && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "saving"}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  {actionLoading === "saving" ? t("examiner.saving", "Saving...") : editingExamId ? t("examiner.saveExam", "Save Changes") : t("examiner.createNewExam", "Create Examination")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
