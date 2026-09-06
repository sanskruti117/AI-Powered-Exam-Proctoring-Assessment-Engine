"use client";

import React, { useState, useEffect } from "react";
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
    { title: string; target_marks: number; description: string }[]
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
      if (search) params.append("search", search);

      const res = await fetch(`/api/exams?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setExams(data.exams || []);
      }
    } catch (err) {
      console.error("Failed to fetch exams:", err);
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
    setModalSections(exam.sections.map((section) => ({
      title: section.title,
      target_marks: section.target_marks,
      description: section.description || "",
    })));
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

    // Sections are configured while creating an assessment. Edit them from the
    // assessment workspace so existing question mappings stay intact.
    const sectionSum = modalSections.reduce((acc, s) => acc + Number(s.target_marks || 0), 0);
    if (!editingExamId && sectionSum !== Number(modalTotalMarks)) {
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
          title: s.title.trim(),
          description: s.description.trim() || undefined,
          order: idx + 1,
          target_marks: Number(s.target_marks),
        })),
      };

      const { sections, ...examPayload } = payload;
      const res = await fetch(editingExamId ? `/api/exams/${editingExamId}` : "/api/exams", {
        method: editingExamId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingExamId ? examPayload : payload),
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Examiner Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Examinations & Assessments
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create structured exams with subject sections, configure randomized delivery, and monitor real-time candidate leaderboards.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/25 transition-all self-start md:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Exam</span>
        </button>
      </div>

      {/* Global Alerts */}
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
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.msg}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Status Cards (Draft, Scheduled, Live, Closed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Drafts</span>
            <FileText className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{draftExamsCount}</div>
          <div className="text-xs text-slate-500">In authoring / staging</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Scheduled</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-400">{scheduledExamsCount}</div>
          <div className="text-xs text-slate-500">Upcoming test windows</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Live Now</span>
            <PlayCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{liveExamsCount}</div>
          <div className="text-xs text-slate-500">Currently accepting attempts</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Closed / Ended</span>
            <ShieldCheck className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-300">{closedExamsCount}</div>
          <div className="text-xs text-slate-500">Completed examinations</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search exams by title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["ALL", "DRAFT", "PUBLISHED", "CLOSED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {st}
            </button>
          ))}
          <button
            onClick={fetchExams}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Exam Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading examinations...</div>
      ) : exams.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Examinations Found</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Create your first examination to define subject sections, populate randomized question pools, and schedule assessments.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Create Exam</span>
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
                className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 hover:border-slate-700/80 transition-all space-y-6 relative overflow-hidden"
              >
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                          exam.status === "PUBLISHED"
                            ? exam.is_active
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : exam.is_upcoming
                              ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                              : "bg-slate-500/15 text-slate-300 border-slate-500/30"
                            : exam.status === "DRAFT"
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        {exam.status === "PUBLISHED"
                          ? exam.is_active
                            ? "● LIVE ACTIVE"
                            : exam.is_upcoming
                            ? "SCHEDULED"
                            : "ENDED"
                          : exam.status}
                      </span>

                      <span className="text-xs text-slate-400 font-medium">
                        Created {formatReadableDate(exam.created_at)}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {exam.title}
                    </h2>
                    {exam.description && (
                      <p className="text-sm text-slate-400 line-clamp-2 max-w-3xl">
                        {exam.description}
                      </p>
                    )}
                  </div>

                  {/* Top Stats Badges */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                      <div className="text-xs text-slate-500 font-bold uppercase">Duration</div>
                      <div className="text-sm font-extrabold text-white flex items-center justify-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-indigo-400" />
                        <span>{exam.duration_minutes}m</span>
                      </div>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                      <div className="text-xs text-slate-500 font-bold uppercase">Total Marks</div>
                      <div className="text-sm font-extrabold text-white flex items-center justify-center gap-1">
                        <Award className="h-3.5 w-3.5 text-amber-400" />
                        <span>{exam.total_marks}</span>
                      </div>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                      <div className="text-xs text-slate-500 font-bold uppercase">Submissions</div>
                      <div className="text-sm font-extrabold text-emerald-400 flex items-center justify-center gap-1">
                        <Trophy className="h-3.5 w-3.5" />
                        <span>{exam.attempts_count}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subject Sections & Pool Breakdown */}
                <div className="space-y-3 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>Configured Subject Sections ({exam.sections.length})</span>
                    <span>Question Pool vs Target Marks</span>
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
                              ? "bg-slate-900/70 border-slate-800"
                              : "bg-rose-950/20 border-rose-500/30"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-white">
                            <span className="truncate pr-2">{sec.title}</span>
                            <span className="text-amber-400">{sec.target_marks} Marks</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>Pool: {sec.total_pool_questions} questions</span>
                              <span className={isReady ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                                {sec.total_pool_marks} / {sec.target_marks} marks
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isReady ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>

                          {!isReady && (
                            <div className="text-[11px] text-rose-300 flex items-center gap-1 font-medium">
                              <span>⚠️ Needs questions to form exactly {sec.target_marks} marks</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Timing & Shuffling Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      Starts: {formatReadableDate(exam.start_time)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      Ends: {formatReadableDate(exam.end_time)}
                    </span>
                  </div>

                  <div>
                    {exam.shuffle_questions && (
                      <span className="mr-3 text-slate-400">✓ Shuffled Questions</span>
                    )}
                    {exam.shuffle_options && (
                      <span className="text-slate-400">✓ Shuffled Options</span>
                    )}
                  </div>
                </div>

                {/* Primary Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/examiner/exams/${exam.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      <span>Open Workspace</span>
                    </Link>

                    <Link
                      href={`/examiner/exams/${exam.id}/manage`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                    >
                      <Layers className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Manage Pools ({exam.total_questions})</span>
                    </Link>

                    <Link
                      href={`/examiner/exams/${exam.id}/candidates`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                    >
                      <Users className="h-3.5 w-3.5 text-violet-400" />
                      <span>Candidates ({exam.attempts_count})</span>
                    </Link>

                    <Link
                      href={`/examiner/exams/${exam.id}/evaluate`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                    >
                      <PenTool className="h-3.5 w-3.5 text-violet-400" />
                      <span>Grading</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(exam)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Edit settings</span>
                    </button>
                    {exam.status === "DRAFT" && (
                      <button
                        onClick={() => handlePublishExam(exam.id)}
                        disabled={actionLoading === exam.id || !isPublishable}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          isPublishable
                            ? "text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 cursor-pointer"
                            : "text-slate-500 bg-slate-900 border border-slate-800 opacity-60 cursor-not-allowed"
                        }`}
                        title={
                          isPublishable
                            ? "Publish Examination"
                            : "Cannot publish — one or more sections do not meet the minimum target marks."
                        }
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        <span>
                          {actionLoading === exam.id ? "Publishing..." : "Publish Exam"}
                        </span>
                      </button>
                    )}

                    {exam.status === "PUBLISHED" && (
                      <button
                        onClick={() => handleCloseExam(exam.id)}
                        disabled={actionLoading === exam.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5 text-rose-400" />
                        <span>Close Exam</span>
                      </button>
                    )}

                    {exam.can_delete && (
                      <button
                        onClick={() => handleDeleteExam(exam.id)}
                        disabled={actionLoading === exam.id}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 bg-slate-900/60 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
                        title="Delete Exam"
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
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 w-full max-w-3xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {editingExamId ? "Edit Examination" : "Create New Examination"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure assessment timing, section weightage, and randomized delivery policies.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Midterm Assessment: Computer Architecture & OS"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Description & Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide exam instructions, guidelines, and reference formulas..."
                    value={modalDesc}
                    onChange={(e) => setModalDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Schedule Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Start Window (Date & Time) *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={modalStartTime}
                      onChange={(e) => setModalStartTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      End Window (Date & Time) *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={modalEndTime}
                      onChange={(e) => setModalEndTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Marks and Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Duration (Mins) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={modalDuration}
                      onChange={(e) => setModalDuration(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Total Marks *
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
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Passing Marks *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={modalTotalMarks}
                      value={modalPassingMarks}
                      onChange={(e) => setModalPassingMarks(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Max Attempts *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={5}
                      value={modalMaxAttempts}
                      onChange={(e) => setModalMaxAttempts(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Shuffling Policies */}
                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={modalShuffleQuestions}
                      onChange={(e) => setModalShuffleQuestions(e.target.checked)}
                      className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Shuffle Questions Order</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={modalShuffleOptions}
                      onChange={(e) => setModalShuffleOptions(e.target.checked)}
                      className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Shuffle Option Choices</span>
                  </label>
                </div>

                {/* Subject Sections Builder */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Subject Sections & Target Marks</h4>
                      <p className="text-xs text-slate-400">
                        Define the subject hierarchy. Questions created under this exam will be mapped to these sections.
                      </p>
                    </div>
                    {!editingExamId && <button
                      type="button"
                      onClick={handleAddSectionRow}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Section</span>
                    </button>}
                  </div>

                  <div className="space-y-2.5">
                    {modalSections.map((sec, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800"
                      >
                        <div className="h-6 w-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
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
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                          <span className="text-xs text-slate-400">Marks</span>
                        </div>
                        {modalSections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSectionRow(idx)}
                            className="p-2 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-right font-bold text-slate-400">
                    Total Section Marks:{" "}
                    <span
                      className={
                        modalSections.reduce((acc, s) => acc + Number(s.target_marks || 0), 0) ===
                        modalTotalMarks
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }
                    >
                      {modalSections.reduce((acc, s) => acc + Number(s.target_marks || 0), 0)} /{" "}
                      {modalTotalMarks} Marks
                    </span>
                  </div>
                </div>

                {/* In-Modal Error Feedback Alert */}
                {modalError && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "saving"}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
                >
                  {actionLoading === "saving" ? "Saving..." : editingExamId ? "Save Changes" : "Create Examination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
