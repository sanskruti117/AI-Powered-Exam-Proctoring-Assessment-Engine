"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, RefreshCw, AlertCircle } from "lucide-react";
import { QuestionForm, QuestionFormInitialData } from "@/components/QuestionForm";

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [question, setQuestion] = useState<QuestionFormInitialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchQuestion = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/questions/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "Question not found");
        }

        setQuestion(data);
      } catch (err: any) {
        console.error("Error fetching question:", err);
        setError(err.message || "Failed to load question details.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <Link
            href="/examiner/questions"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Question Bank</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Edit Question
          </h1>
          <p className="text-sm text-slate-400">
            Modify question prompt, answer choices, scoring rubric, or diagram attachment.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="glass-card rounded-3xl p-16 border border-slate-800 text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-400" />
          <p className="text-sm font-medium text-slate-300">
            Loading question information...
          </p>
        </div>
      ) : error ? (
        <div className="glass-card rounded-3xl p-12 border border-rose-500/30 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Error Loading Question</h3>
            <p className="text-sm text-slate-400">{error}</p>
          </div>
          <Link
            href="/examiner/questions"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
          >
            Return to Question Bank
          </Link>
        </div>
      ) : question ? (
        <QuestionForm initialData={question} isEditMode={true} />
      ) : null}
    </div>
  );
}
