"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  FolderKanban,
  PlusCircle,
  Search,
  Filter,
  Layers,
  BookOpen,
  Award,
  Calendar,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ImageIcon,
  FileText,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { ExaminerLayoutWrapper } from "@/components/ExaminerLayoutWrapper";
import {
  QuestionDetailModal,
  QuestionData,
} from "@/components/QuestionDetailModal";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";

interface AssessmentSection { id: string; title: string; }
interface Assessment { id: string; title: string; sections: AssessmentSection[]; }

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [targetAssessmentId, setTargetAssessmentId] = useState("");
  const [targetSectionId, setTargetSectionId] = useState("");
  const [movingQuestions, setMovingQuestions] = useState(false);
  const batchImportRef = useRef<HTMLInputElement>(null);
  const [batchImporting, setBatchImporting] = useState(false);

  // Modals state
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [questionToDelete, setQuestionToDelete] = useState<QuestionData | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fetch questions from API
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSubject !== "ALL") params.append("subject", selectedSubject);
      if (selectedDifficulty !== "ALL") params.append("difficulty", selectedDifficulty);
      if (selectedType !== "ALL") params.append("question_type", selectedType);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setQuestions(data.questions || []);
        if (data.subjects) {
          setSubjects(data.subjects);
        }
      } else {
        throw new Error(data.detail || "Failed to load questions");
      }
    } catch (err: any) {
      console.error("Error loading questions:", err);
      setNotification({
        type: "error",
        message: err.message || "Failed to load question bank data.",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, selectedDifficulty, selectedType, searchTerm]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    fetch("/api/exams")
      .then((response) => response.json())
      .then((data) => { if (data.success) setAssessments(data.exams || []); })
      .catch(() => setAssessments([]));
  }, []);

  const addQuestionsToAssessment = async () => {
    if (!selectedQuestionIds.length || !targetAssessmentId || !targetSectionId) return;
    const assessment = assessments.find((item) => item.id === targetAssessmentId);
    const section = assessment?.sections.find((item) => item.id === targetSectionId);
    try {
      setMovingQuestions(true);
      const responses = await Promise.all(selectedQuestionIds.map((id) => fetch(`/api/questions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exam_id: targetAssessmentId, section_id: targetSectionId }) })));
      if (responses.some((response) => !response.ok)) throw new Error("Unable to update one or more questions.");
      setNotification({ type: "success", message: `${selectedQuestionIds.length} question${selectedQuestionIds.length === 1 ? "" : "s"} added to ${assessment?.title || "assessment"} → ${section?.title || "section"}.` });
      setSelectedQuestionIds([]);
      setTargetAssessmentId("");
      setTargetSectionId("");
      fetchQuestions();
    } catch (error: any) {
      setNotification({ type: "error", message: error.message || "Unable to move the question." });
    } finally {
      setMovingQuestions(false);
    }
  };

  const handleBatchPdfImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const subject = window.prompt("Which question bank should these questions be added to? (Example: DBMS or DSA)");
    if (!subject?.trim()) return;
    try {
      setBatchImporting(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subject", subject.trim());
      const response = await fetch("/api/questions/import-batch", { method: "POST", body: formData });
      const rawResponse = await response.text();
      let data: { detail?: string; created?: number; skipped?: number } = {};
      try {
        data = JSON.parse(rawResponse);
      } catch {
        throw new Error(`Import service error (${response.status}). Check the backend terminal for details.`);
      }
      if (!response.ok) throw new Error(data.detail || "Could not import this question paper.");
      setNotification({ type: "success", message: `${data.created || 0} questions were added to ${subject.trim()}${data.skipped ? `; ${data.skipped} incomplete questions were skipped.` : ""}` });
      fetchQuestions();
    } catch (error: any) {
      setNotification({ type: "error", message: error.message || "Could not import this question paper." });
    } finally {
      setBatchImporting(false);
      event.target.value = "";
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!questionToDelete) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/questions/${questionToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to delete question.");
      }

      setNotification({
        type: "success",
        message: "Question deleted successfully from Question Bank.",
      });

      setIsDeleteModalOpen(false);
      setQuestionToDelete(null);
      fetchQuestions();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to delete question.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty.toUpperCase()) {
      case "EASY":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Easy
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Medium
          </span>
        );
      case "HARD":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
            Hard
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      MCQ: "MCQ",
      MULTI_SELECT: "Multi Select",
      SHORT_ANSWER: "Short Answer",
      LONG_ANSWER: "Essay",
      IMAGE: "Image Diagram",
    };
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
        {labels[type] || type}
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <FolderKanban className="h-4 w-4" />
            <span>Repository & Curriculum</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Examiner Question Bank
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Author, organize, filter, and maintain your repository of assessment questions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => batchImportRef.current?.click()}
            disabled={batchImporting}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            <span>{batchImporting ? "Extracting PDF…" : "Import Question PDF"}</span>
          </button>
          <input ref={batchImportRef} type="file" accept="application/pdf,.pdf" onChange={handleBatchPdfImport} className="hidden" />
          <button
            onClick={() => fetchQuestions()}
            disabled={loading}
            className="p-3 rounded-2xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Questions"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          </button>

          <Link
            href="/examiner/questions/create"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/25 transition-all cursor-pointer hover:scale-105"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Question</span>
          </Link>
        </div>
      </div>

      {/* Action Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-sm flex items-center justify-between animate-fadeIn ${
            notification.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/25 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5 font-medium">
            {notification.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold uppercase tracking-wider opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search question statement, subject, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
            <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Table View"
              >
                <TableIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider">
            <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400" />
            <span>Filters:</span>
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Formats</option>
            <option value="MCQ">Single Choice (MCQ)</option>
            <option value="MULTI_SELECT">Multiple Select</option>
            <option value="SHORT_ANSWER">Short Answer</option>
            <option value="LONG_ANSWER">Long Essay</option>
            <option value="IMAGE">Image / Diagram</option>
          </select>

          {(selectedSubject !== "ALL" ||
            selectedDifficulty !== "ALL" ||
            selectedType !== "ALL" ||
            searchTerm) && (
            <button
              onClick={() => {
                setSelectedSubject("ALL");
                setSelectedDifficulty("ALL");
                setSelectedType("ALL");
                setSearchTerm("");
              }}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {selectedQuestionIds.length > 0 && (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
          <span className="text-sm font-bold text-white">{selectedQuestionIds.length} selected</span>
          <select value={targetAssessmentId} onChange={(event) => { setTargetAssessmentId(event.target.value); setTargetSectionId(""); }} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white">
            <option value="">Choose assessment…</option>{assessments.map((assessment) => <option key={assessment.id} value={assessment.id}>{assessment.title}</option>)}
          </select>
          <select value={targetSectionId} onChange={(event) => setTargetSectionId(event.target.value)} disabled={!targetAssessmentId} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white disabled:opacity-50">
            <option value="">Choose section…</option>{assessments.find((assessment) => assessment.id === targetAssessmentId)?.sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
          </select>
          <button onClick={addQuestionsToAssessment} disabled={!targetAssessmentId || !targetSectionId || movingQuestions} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{movingQuestions ? "Adding…" : "Add to assessment"}</button>
          <button onClick={() => setSelectedQuestionIds([])} className="text-xs font-bold text-slate-400 hover:text-white">Clear selection</button>
        </section>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="glass-card rounded-3xl p-16 border border-slate-800 text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-400" />
          <p className="text-sm font-medium text-slate-300">
            Loading Question Bank repository...
          </p>
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 border border-slate-800 text-center space-y-4 shadow-xl">
          <div className="h-16 w-16 rounded-3xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
            <HelpCircle className="h-8 w-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">No Questions Found</h3>
            <p className="text-sm text-slate-400">
              {searchTerm || selectedSubject !== "ALL" || selectedDifficulty !== "ALL" || selectedType !== "ALL"
                ? "No questions match your current search and filter combination."
                : "Your Question Bank is currently empty. Start building questions for your examinations."}
            </p>
          </div>
          <Link
            href="/examiner/questions/create"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create First Question</span>
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID / CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {questions.map((question) => (
            <div
              key={question.id}
              className="glass-card rounded-3xl border border-slate-800 p-6 shadow-xl transition-all hover:border-indigo-500/60 flex flex-col justify-between group space-y-5"
            >
              <div className="space-y-3.5">
                {/* Header Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedQuestionIds.includes(question.id)} onChange={(event) => setSelectedQuestionIds((current) => event.target.checked ? [...current, question.id] : current.filter((id) => id !== question.id))} className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-600" aria-label={`Select ${question.question_text}`} />
                    {getTypeBadge(question.question_type)}
                    {getDifficultyBadge(question.difficulty)}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/80">
                    <Award className="h-3.5 w-3.5 text-indigo-400" />
                    {question.marks} {question.marks === 1 ? "Mark" : "Marks"}
                  </span>
                </div>

                {/* Question Text */}
                <h3 className="text-base font-semibold text-white line-clamp-3 leading-relaxed">
                  {question.question_text}
                </h3>

                {/* Subject and Media Tags */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5 text-indigo-300 font-medium bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-900/40">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                    {question.subject}
                  </span>

                  {question.image_url && (
                    <span className="flex items-center gap-1 text-violet-300 bg-violet-950/40 px-2.5 py-1 rounded-lg border border-violet-900/40">
                      <ImageIcon className="h-3.5 w-3.5 text-violet-400" />
                      Has Diagram
                    </span>
                  )}

                  {question.options && question.options.length > 0 && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Layers className="h-3.5 w-3.5" />
                      {question.options.length} Options
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {question.created_at
                    ? new Date(question.created_at).toLocaleDateString()
                    : "Recent"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedQuestion(question);
                      setIsDetailModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <Link
                    href={`/examiner/questions/${question.id}/edit`}
                    className="p-2 rounded-xl text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 border border-indigo-500/20 transition-colors cursor-pointer"
                    title="Edit Question"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>

                  <button
                    onClick={() => {
                      setQuestionToDelete(question);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer"
                    title="Delete Question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Question Statement</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Format</th>
                  <th className="px-6 py-4">Difficulty</th>
                  <th className="px-6 py-4">Marks</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {questions.map((question) => (
                  <tr key={question.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 max-w-md">
                      <div className="font-semibold text-white line-clamp-2">
                        {question.question_text}
                      </div>
                      {question.image_url && (
                        <div className="flex items-center gap-1 text-xs text-indigo-400 mt-1">
                          <ImageIcon className="h-3.5 w-3.5" />
                          <span>Attached image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-300">
                      {question.subject}
                    </td>
                    <td className="px-6 py-4">{getTypeBadge(question.question_type)}</td>
                    <td className="px-6 py-4">{getDifficultyBadge(question.difficulty)}</td>
                    <td className="px-6 py-4 font-bold text-white">
                      {question.marks}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {question.created_at
                        ? new Date(question.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedQuestion(question);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <Link
                          href={`/examiner/questions/${question.id}/edit`}
                          className="p-2 rounded-xl text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 border border-indigo-500/20 transition-colors cursor-pointer"
                          title="Edit Question"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>

                        <button
                          onClick={() => {
                            setQuestionToDelete(question);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <QuestionDetailModal
        question={selectedQuestion}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedQuestion(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        itemName={questionToDelete?.question_text}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setQuestionToDelete(null);
        }}
      />
    </div>
  );
}
