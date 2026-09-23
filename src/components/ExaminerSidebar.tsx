"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, ClipboardList, FilePlus2, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ExaminerSidebarProps {
  user?: { fullName?: string; email?: string; institution?: string | null; role?: string } | null;
}

export function ExaminerSidebar({ user }: ExaminerSidebarProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loggingOut, setLoggingOut] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  const navigation = [
    { key: "examiner.overview", label: t("examiner.overview", "Overview"), href: "/examiner", icon: LayoutDashboard, exact: true },
    { key: "examiner.questionBank", label: t("examiner.questionBank", "Question Bank"), href: "/examiner/questions", icon: BookOpen },
    { key: "examiner.createAssessment", label: t("examiner.createAssessment", "Create Assessment"), href: "/examiner/exams?create=1", icon: FilePlus2 },
    { key: "examiner.manageAssessments", label: t("examiner.manageAssessments", "Manage Assessments"), href: "/examiner/exams", icon: ClipboardList },
  ];

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const isActive = (item: (typeof navigation)[number]) => {
    if (item.href.includes("?create=1")) return searchParams.get("create") === "1";
    if (item.key === "examiner.manageAssessments") {
      return pathname.startsWith("/examiner/exams") && searchParams.get("create") !== "1";
    }
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  };

  return (
    <aside className="flex w-full flex-col overflow-y-auto rounded-2xl bg-[#10192c] px-5 py-6 ring-1 ring-inset ring-slate-700/60 lg:sticky lg:top-[98px] lg:h-[calc(100vh-122px)] lg:w-[304px] lg:shrink-0 lg:px-[22px] lg:py-5">
      {isAdmin && (
        <Link
          href="/admin"
          className="mb-4 flex items-center justify-between rounded-xl bg-rose-500/15 p-3 text-xs font-bold text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-all shadow-sm"
        >
          <span>← {t("examiner.masterAdminConsole", "Master Admin Console")}</span>
          <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded">ADMIN</span>
        </Link>
      )}

      <div className="border-b border-slate-700/70 pb-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
          {isAdmin ? t("examiner.adminOversight", "Admin Oversight Mode") : t("examiner.examinerPortal", "Examiner portal")}
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-white">{user?.fullName || (isAdmin ? "Super Administrator" : "Examiner")}</h2>
        <p className="mt-0.5 truncate text-sm text-slate-400">{user?.institution || user?.email || "Academic Institution"}</p>
      </div>

      <nav aria-label="Examiner navigation" className="mt-5 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link key={item.key} href={item.href} className={`flex min-h-14 items-center gap-4 rounded-2xl px-4 text-[15px] font-semibold transition-colors ${active ? "bg-[#665cf0] text-white shadow-lg shadow-indigo-950/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"}`}>
              <Icon className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-slate-400"}`} strokeWidth={2.2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-7 rounded-2xl border border-slate-700/60 bg-slate-900/35 p-4 text-sm leading-5 text-slate-400">
        <p className="font-semibold text-slate-300">{t("examiner.assessmentWorkspace", "Assessment workspace")}</p>
        <p className="mt-1.5">{t("examiner.workspaceSubtitle", "Open any assessment to access candidates, grading, leaderboard, and analytics.")}</p>
      </div>

      <div className="mt-auto border-t border-slate-700/70 pt-4">
        <Link href="/examiner/profile" className="flex min-h-12 items-center gap-4 rounded-xl px-4 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-100">
          <Settings className="h-5 w-5" />
          {t("examiner.profileSettings", "Profile & settings")}
        </Link>
        <button onClick={handleLogout} disabled={loggingOut} className="mt-1 flex min-h-12 w-full items-center gap-4 rounded-xl px-4 text-left text-sm font-semibold text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-60">
          <LogOut className="h-5 w-5" />
          {loggingOut ? t("common.signingOut", "Signing out…") : t("common.signOut", "Sign out")}
        </button>
      </div>
    </aside>
  );
}

