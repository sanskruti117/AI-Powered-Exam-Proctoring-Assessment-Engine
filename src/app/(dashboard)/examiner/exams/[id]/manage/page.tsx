"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  Plus,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  BookOpen,
  Edit3,
  Trash2,
  FileText,
  ImageIcon,
  Sparkles,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { QuestionForm, QuestionFormInitialData } from "@/components/QuestionForm";
import { ExamContextNav } from "@/components/ExamContextNav";

interface ExamSection {
  id: string;
  exam_id: string;
  title: string;
  description?: string;
  order: number;
  target_marks: number;
  total_pool_questions: number;
  total_pool_marks: number;
}

interface ExamDetail {
  id: string;
  title: string;
  description?: string;
  total_marks: number;
  passing_marks: number;
  duration_minutes: number;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  sections: ExamSection[];
  total_questions: number;
  total_pool_marks: number;
}

interface QuestionItem {
  id: string;
  exam_id?: string;
  section_id?: string;
  question_text: string;
  subject: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  question_type: "MCQ" | "MULTI_SELECT" | "SHORT_ANSWER" | "LONG_ANSWER" | "IMAGE";
  marks: number;
  expected_answer?: string;
  image_url?: string;
  options: {
    id: string;
    option_text: string;
    is_correct: boolean;
    order: number;
  }[];
}

export default function ExamSectionManagePage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Question Form Modal
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionFormInitialData | undefined>(undefined);
  const [targetSectionForNewQ, setTargetSectionForNewQ] = useState<string>("");

  useEffect(() => {
    if (examId) {
      fetchExamAndQuestions();
    }
  }, [examId, selectedSectionId, difficultyFilter, typeFilter]);

  const fetchExamAndQuestions = async () => {
    try {
      setLoading(true);
      // 1. Fetch Exam details
      const examRes = await fetch(`/api/exams/${examId}`);
      if (!examRes.ok) throw new Error("Failed to load exam details.");
      const examData = await examRes.json();
      setExam(examData);

      // 2. Fetch Questions
      const qParams = new URLSearchParams();
      qParams.append("exam_id", examId);
      if (selectedSectionId !== "ALL") qParams.append("section_id", selectedSectionId);
      if (difficultyFilter !== "ALL") qParams.append("difficulty", difficultyFilter);
      if (typeFilter !== "ALL") qParams.append("question_type", typeFilter);
      if (search) qParams.append("search", search);

      const qRes = await fetch(`/api/questions?${qParams.toString()}`);
      const qData = await qRes.json();
      if (qData.success) {
        setQuestions(qData.questions || []);
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateQuestion = (sectionId?: string) => {
    const sec = sectionId || (selectedSectionId !== "ALL" ? selectedSectionId : exam?.sections[0]?.id || "");
    setTargetSectionForNewQ(sec);
    const secObj = exam?.sections.find((s) => s.id === sec);
    setEditingQuestion({
      question_text: "",
      subject: secObj?.title || exam?.title || "General",
      difficulty: "MEDIUM",
      question_type: "MCQ",
      marks: 2,
      options: [
        { option_text: "", is_correct: true, order: 0 },
        { option_text: "", is_correct: false, order: 1 },
        { option_text: "", is_correct: false, order: 2 },
        { option_text: "", is_correct: false, order: 3 },
      ],
    });
    setIsQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q: QuestionItem) => {
    setTargetSectionForNewQ(q.section_id || "");
    setEditingQuestion({
      id: q.id,
      question_text: q.question_text,
      subject: q.subject,
      difficulty: q.difficulty,
      question_type: q.question_type,
      marks: q.marks,
      expected_answer: q.expected_answer,
      image_url: q.image_url,
      options: q.options.map((o) => ({
        id: o.id,
        option_text: o.option_text,
        is_correct: o.is_correct,
        order: o.order,
      })),
    });
    setIsQuestionModalOpen(true);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("Are you sure you want to delete this question from the exam pool?")) return;
    try {
      const res = await fetch(`/api/questions/${qId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to delete question.");
      setFeedback({ type: "success", msg: "Question deleted successfully." });
      fetchExamAndQuestions();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    }
  };

  if (!exam && loading) {
    return <div className="p-12 text-center text-slate-400">Loading exam pool manager...</div>;
  }

  if (!exam) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="text-rose-400 font-bold">Exam not found or access denied.</div>
        <Link href="/examiner/exams" className="text-xs text-indigo-400 underline">
          Return to Examinations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Contextual Header & Sub-Navigation */}
      <ExamContextNav
        examId={exam.id}
        examTitle={exam.title}
        status={exam.status}
        totalQuestions={exam.total_questions}
        totalMarks={exam.total_marks}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            <span>Question Paper & Subject Pools</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Questions added here belong to this examination's section pool. Candidate attempts will be dynamically sampled to reach exact target marks.
          </p>
        </div>

        <button
          onClick={() => handleOpenCreateQuestion()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Question to Pool</span>
        </button>
      </div>

      {/* Feedback Alerts */}
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
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400" />
            )}
            <span className="text-sm font-medium">{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold opacity-70">
            Dismiss
          </button>
        </div>
      )}

      {/* Section Pool Readiness Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exam.sections.map((sec) => {
          const isReady = sec.total_pool_marks >= sec.target_marks;
          const isSelected = selectedSectionId === sec.id;

          return (
            <div
              key={sec.id}
              onClick={() => setSelectedSectionId(sec.id)}
              className={`glass-card rounded-2xl p-5 border cursor-pointer transition-all relative overflow-hidden ${
                isSelected
                  ? "border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white truncate pr-2">
                  {sec.title}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    isReady
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {isReady ? "READY" : "NEEDS QUESTIONS"}
                </span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xl font-extrabold text-white">
                    {sec.total_pool_marks}{" "}
                    <span className="text-xs font-normal text-slate-400">/ {sec.target_marks} marks</span>
                  </div>
                  <div className="text-xs text-slate-500">{sec.total_pool_questions} questions in pool</div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCreateQuestion(sec.id);
                  }}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 hover:text-white"
                  title="Add Question to this section"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Section Selector Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedSectionId("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedSectionId === "ALL"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            All Sections ({exam.total_questions})
          </button>
          {exam.sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSectionId(s.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedSectionId === s.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {s.title} ({s.total_pool_questions})
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions by text or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchExamAndQuestions()}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="MCQ">Single Choice (MCQ)</option>
              <option value="MULTI_SELECT">Multi-Select</option>
              <option value="SHORT_ANSWER">Short Answer</option>
              <option value="LONG_ANSWER">Long Essay</option>
              <option value="IMAGE">Image Based</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading section questions...</div>
      ) : questions.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <Layers className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Questions in this Section Pool</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Add questions to fulfill the section target marks. Candidates will receive a randomized subset during their exam session.
            </p>
          </div>
          <button
            onClick={() => handleOpenCreateQuestion()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            <span>Create Question</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const secObj = exam.sections.find((s) => s.id === q.section_id);

            return (
              <div
                key={q.id}
                className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-500">Q{idx + 1}.</span>
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-900 border border-slate-800 text-indigo-300">
                      {secObj ? secObj.title : q.subject}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase border ${
                        q.difficulty === "EASY"
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : q.difficulty === "MEDIUM"
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300">
                      {q.question_type.replace("_", " ")}
                    </span>
                    <span className="text-xs font-extrabold text-amber-400">{q.marks} Marks</span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleOpenEditQuestion(q)}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      title="Edit Question"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400"
                      title="Delete Question"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-white whitespace-pre-wrap">{q.question_text}</p>

                  {q.image_url && (
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 max-w-sm">
                      <img
                        src={q.image_url}
                        alt="Question Reference"
                        className="rounded-lg object-contain max-h-48 w-auto mx-auto"
                      />
                    </div>
                  )}

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={opt.id || oIdx}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                            opt.is_correct
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold"
                              : "bg-slate-900/60 border-slate-800 text-slate-300"
                          }`}
                        >
                          <span className="truncate pr-2">{opt.option_text}</span>
                          {opt.is_correct && <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.expected_answer && (
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
                      <span className="font-bold text-slate-300 block mb-0.5">Evaluation Rubric / Key:</span>
                      <span className="line-clamp-2">{q.expected_answer}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Question Form Modal */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 w-full max-w-4xl max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl relative bg-slate-950">
            <div className="sticky -top-6 sm:-top-8 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 p-6 sm:p-8 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {editingQuestion?.id ? "Edit Question" : "Create New Question in Section"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assigned to Exam: <span className="text-white font-semibold">{exam.title}</span>
                </p>
              </div>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <QuestionForm
              initialData={editingQuestion}
              isEditMode={!!editingQuestion?.id}
              examId={exam.id}
              sectionId={targetSectionForNewQ}
              onSuccess={() => {
                setIsQuestionModalOpen(false);
                fetchExamAndQuestions();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
