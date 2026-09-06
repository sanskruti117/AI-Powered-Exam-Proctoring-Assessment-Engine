"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PlusCircle, ArrowLeft, FolderKanban } from "lucide-react";
import { QuestionForm } from "@/components/QuestionForm";

export default function CreateQuestionPage() {
  const searchParams = useSearchParams();
  const examId = searchParams?.get("exam_id") || undefined;
  const sectionId = searchParams?.get("section_id") || undefined;
  const initialSubject = searchParams?.get("subject") || "";

  return (
    <div className="space-y-8 pb-12">
      {/* Top Breadcrumb / Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <Link
            href={examId ? `/examiner/exams/${examId}/manage` : "/examiner/questions"}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{examId ? "Back to Exam Sections" : "Back to Question Bank"}</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Author New Question
          </h1>
          <p className="text-sm text-slate-400">
            Create an assessment item supporting Single Choice, Multi Select, Short/Long responses, or Diagram analysis.
          </p>
        </div>

        <Link
          href="/examiner/questions"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors"
        >
          <FolderKanban className="h-4 w-4" />
          <span>View Bank</span>
        </Link>
      </div>

      {/* Main Creation Form */}
      <QuestionForm
        isEditMode={false}
        examId={examId}
        sectionId={sectionId}
        initialData={
          initialSubject
            ? {
                question_text: "",
                subject: initialSubject,
                difficulty: "MEDIUM",
                question_type: "MCQ",
                marks: 2,
              }
            : undefined
        }
      />
    </div>
  );
}

