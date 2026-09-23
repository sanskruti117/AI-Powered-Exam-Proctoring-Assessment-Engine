"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Users,
  PenTool,
  Trophy,
  BarChart3,
  Settings,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ExamContextNavProps {
  examId: string;
  examTitle: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  totalQuestions?: number;
  totalMarks?: number;
}

export function ExamContextNav({
  examId,
  examTitle,
  status,
  totalQuestions = 0,
  totalMarks = 0,
}: ExamContextNavProps) {
  const { t } = useLanguage();
  const pathname = usePathname();

  const tabs = [
    {
      key: "examiner.overview",
      label: t("examiner.overview", "Overview"),
      href: `/examiner/exams/${examId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      key: "examiner.questionPaperPools",
      label: t("examiner.questionPaperPools", "Question Paper & Pools"),
      href: `/examiner/exams/${examId}/manage`,
      icon: Layers,
      count: totalQuestions,
    },
    {
      key: "examiner.candidates",
      label: t("examiner.candidates", "Candidates"),
      href: `/examiner/exams/${examId}/candidates`,
      icon: Users,
    },
    {
      key: "examiner.gradingStudio",
      label: t("examiner.gradingStudio", "Grading Studio"),
      href: `/examiner/exams/${examId}/evaluate`,
      icon: PenTool,
    },
    {
      key: "examiner.leaderboard",
      label: t("examiner.leaderboard", "Leaderboard"),
      href: `/examiner/exams/${examId}/leaderboard`,
      icon: Trophy,
    },
    {
      key: "examiner.analytics",
      label: t("examiner.analytics", "Analytics"),
      href: `/examiner/exams/${examId}/analytics`,
      icon: BarChart3,
    },
  ];

  const isTabActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const getStatusLabel = (s: string) => {
    if (s === "PUBLISHED") return t("examiner.published", "PUBLISHED");
    if (s === "DRAFT") return t("examiner.draft", "DRAFT");
    return t("examiner.closed", "CLOSED");
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link
              href="/examiner/exams"
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t("examiner.examinations", "Examinations")}</span>
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <span className="text-white font-bold truncate max-w-md">{examTitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>{examTitle}</span>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                status === "PUBLISHED"
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : status === "DRAFT"
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                  : "bg-rose-500/15 text-rose-300 border-rose-500/30"
              }`}
            >
              {getStatusLabel(status)}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-bold text-slate-300">
            {totalMarks} {t("examiner.marks", "Marks")}
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-bold text-indigo-400">
            {totalQuestions} {t("examiner.questionsInPool", "Questions in Pool")}
          </div>
        </div>
      </div>

      {/* Contextual Sub-navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/80">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(tab.href, tab.exact);

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                active
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent hover:border-slate-800"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                    active ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

