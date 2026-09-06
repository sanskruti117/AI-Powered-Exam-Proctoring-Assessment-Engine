"use client";

import React from "react";
import {
  X,
  BookOpen,
  Award,
  Calendar,
  Layers,
  CheckCircle,
  HelpCircle,
  ImageIcon,
  FileText,
  Edit,
} from "lucide-react";
import Link from "next/link";

export interface OptionData {
  id: string;
  option_text: string;
  is_correct: boolean;
  order: number;
}

export interface QuestionData {
  id: string;
  question_text: string;
  subject: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  question_type: "MCQ" | "MULTI_SELECT" | "SHORT_ANSWER" | "LONG_ANSWER" | "IMAGE";
  marks: number;
  expected_answer?: string | null;
  image_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  options?: OptionData[];
}

interface QuestionDetailModalProps {
  question: QuestionData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuestionDetailModal({
  question,
  isOpen,
  onClose,
}: QuestionDetailModalProps) {
  if (!isOpen || !question) return null;

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty.toUpperCase()) {
      case "EASY":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Easy
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Medium
          </span>
        );
      case "HARD":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
            Hard
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      MCQ: "Single Choice (MCQ)",
      MULTI_SELECT: "Multiple Select",
      SHORT_ANSWER: "Short Answer",
      LONG_ANSWER: "Long Answer / Essay",
      IMAGE: "Image-Based Question",
    };
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
        {labels[type] || type}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-card w-full max-w-3xl rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Question Details</h2>
              <p className="text-xs text-slate-400">ID: {question.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {getTypeBadge(question.question_type)}
            {getDifficultyBadge(question.difficulty)}
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
              <Award className="h-3.5 w-3.5 text-indigo-400" />
              {question.marks} {question.marks === 1 ? "Mark" : "Marks"}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/80">
              <BookOpen className="h-3.5 w-3.5 text-violet-400" />
              {question.subject}
            </span>
            {question.created_at && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 ml-auto">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(question.created_at).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Question Text */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Question Statement
            </h3>
            <p className="text-base sm:text-lg font-semibold text-white whitespace-pre-wrap leading-relaxed">
              {question.question_text}
            </p>
          </div>

          {/* Image Preview if applicable */}
          {question.image_url && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-400" />
                Attached Diagram / Image
              </h3>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2 overflow-hidden flex items-center justify-center max-h-72">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={question.image_url}
                  alt="Question Attachment"
                  className="rounded-xl object-contain max-h-64 max-w-full shadow-lg"
                />
              </div>
            </div>
          )}

          {/* Options for MCQ / MULTI_SELECT / IMAGE */}
          {question.options && question.options.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                Answer Options ({question.options.length})
              </h3>
              <div className="space-y-2.5">
                {question.options.map((opt, index) => (
                  <div
                    key={opt.id || index}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                      opt.is_correct
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                        : "bg-slate-900/70 border-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          opt.is_correct
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-sm font-medium pt-0.5">{opt.option_text}</span>
                    </div>

                    {opt.is_correct && (
                      <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30 shrink-0">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Correct Answer
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expected Answer / Rubric for Short / Long questions */}
          {question.expected_answer && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-400" />
                Expected Answer / Scoring Rubric
              </h3>
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 text-sm text-indigo-200 whitespace-pre-wrap leading-relaxed">
                {question.expected_answer}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between bg-slate-900/40">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>

          <Link
            href={`/examiner/questions/${question.id}/edit`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer hover:scale-105"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Question</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
