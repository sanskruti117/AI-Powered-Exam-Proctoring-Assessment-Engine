"use client";

import React, { useState } from "react";
import {
  Shield,
  UserCheck,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type RoleType = "admin" | "examiner" | "student";

export function InteractiveRoleShowcase() {
  const [selectedRole, setSelectedRole] = useState<RoleType>("examiner");
  const { t } = useLanguage();

  const roleDetails = {
    admin: {
      title: t("landing.adminTitle", "Administrator"),
      badge: t("landing.adminBadge", "Single Super Authority"),
      color: "rose",
      icon: Shield,
      accentBorder: "border-rose-500/40",
      accentBg: "bg-rose-500/10",
      accentText: "text-rose-600 dark:text-rose-400",
      tagline: "System Authority, Examiner Vetting & Infrastructure Oversight",
      description:
        "Maintains complete supervisory control over institutional access. Every incoming examiner undergoes cryptographic vetting and administrative approval.",
      capabilities: [
        "Single super-admin authority enforced at database engine level",
        "Comprehensive Examiner Approval & Rejection lifecycle with audit logs",
        "Platform telemetry monitoring and cross-chamber security enforcement",
        "Role-Based Access Control (RBAC) strict boundary execution",
      ],
      previewHeadline: "Super Admin Command Center",
      previewStats: [
        { label: "Pending Examiners", value: "3 Pending" },
        { label: "Active Institutions", value: "24 Verified" },
        { label: "Audit Integrity", value: "100.0%" },
      ],
      primaryLink: "/admin",
      primaryText: "Explore Admin Portal",
    },
    examiner: {
      title: t("landing.examinerTitle", "Examiner"),
      badge: t("landing.examinerBadge", "Admin Verified"),
      color: "indigo",
      icon: UserCheck,
      accentBorder: "border-indigo-500/40",
      accentBg: "bg-indigo-500/10",
      accentText: "text-indigo-600 dark:text-indigo-400",
      tagline: "Exam Architecture, Question Banks & AI-Powered Auto Evaluation",
      description:
        "Build rich multi-format exams (Coding, MCQs, Subjective), monitor candidate telemetry with live incident tracking, and publish AI evaluated results.",
      capabilities: [
        "Rich Monaco Code Editor questions with automated Python & Node test runner",
        "Multilingual question bank auto-translations into 6 regional languages",
        "Live proctoring incident stream with time-indexed candidate violations",
        "Automated grading and candidate performance analytics dashboard",
      ],
      previewHeadline: "Examiner Assessment Chamber",
      previewStats: [
        { label: "Exams Created", value: "12 Active" },
        { label: "Submissions Graded", value: "1,450" },
        { label: "AI Proctor Flags", value: "99.2% Accuracy" },
      ],
      primaryLink: "/register/examiner",
      primaryText: "Request Examiner Access",
    },
    student: {
      title: t("landing.studentTitle", "Student"),
      badge: t("landing.studentBadge", "Instant Frictionless Access"),
      color: "emerald",
      icon: GraduationCap,
      accentBorder: "border-emerald-500/40",
      accentBg: "bg-emerald-500/10",
      accentText: "text-emerald-600 dark:text-emerald-400",
      tagline: "Distraction-Free Exam Portal with Automated Proctor Guard",
      description:
        "Instant one-click registration. Experience seamless, high-performance exam environments with full regional language support and instant results.",
      capabilities: [
        "Instant sign-up and passwordless or credentialed test entry",
        "Built-in IDE for coding challenges with live syntax error feedback",
        "Non-intrusive AI vision & audio integrity monitoring with grace pauses",
        "Instant performance leaderboard and downloadable result certificates",
      ],
      previewHeadline: "Student Examination Chamber",
      previewStats: [
        { label: "Active Sessions", value: "Live Synced" },
        { label: "Local Caching", value: "PWA Offline Ready" },
        { label: "Language Support", value: "6 Languages" },
      ],
      primaryLink: "/register/student",
      primaryText: "Student Registration",
    },
  };

  const current = roleDetails[selectedRole];
  const IconComponent = current.icon;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Interactive Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {(["admin", "examiner", "student"] as RoleType[]).map((role) => {
          const item = roleDetails[role];
          const TabIcon = item.icon;
          const isSelected = selectedRole === role;

          return (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 border ${
                isSelected
                  ? role === "admin"
                    ? "bg-rose-600 text-white border-rose-400 shadow-xl shadow-rose-600/30 scale-105"
                    : role === "examiner"
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-xl shadow-indigo-600/30 scale-105"
                    : "bg-emerald-600 text-white border-emerald-400 shadow-xl shadow-emerald-600/30 scale-105"
                  : "bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <TabIcon className={`w-4 h-4 ${isSelected ? "text-white" : item.accentText}`} />
              <span>{item.title}</span>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {item.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Role Deep-Dive Card */}
      <div className="glass-card rounded-3xl p-8 sm:p-10 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden transition-all duration-500 shadow-2xl">
        {/* Glow backdrop */}
        <div
          className={`absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[120px] pointer-events-none transition-all duration-500 ${
            selectedRole === "admin"
              ? "bg-rose-600/15"
              : selectedRole === "examiner"
              ? "bg-indigo-600/15"
              : "bg-emerald-600/15"
          }`}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-center">
          {/* Left Description Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl ${current.accentBg} ${current.accentBorder} ${current.accentText}`}
              >
                <IconComponent className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <span>{current.title}</span>
                  <Sparkles className={`w-5 h-5 ${current.accentText}`} />
                </h3>
                <p className={`text-xs font-semibold uppercase tracking-wider ${current.accentText}`}>
                  {current.tagline}
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {current.description}
            </p>

            {/* Feature List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {current.capabilities.map((cap, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200"
                >
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${current.accentText}`} />
                  <span className="leading-snug">{cap}</span>
                </div>
              ))}
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <Link
                href={current.primaryLink}
                className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-white shadow-xl transition-all hover:scale-105 ${
                  selectedRole === "admin"
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/25"
                    : selectedRole === "examiner"
                    ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25"
                }`}
              >
                <span>{current.primaryText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Live Chamber Mock Preview */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {current.previewHeadline}
                </span>
              </div>

              {/* Stats Showcase in Mock */}
              <div className="grid grid-cols-3 gap-2">
                {current.previewStats.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-center"
                  >
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{st.label}</div>
                    <div className={`text-sm font-bold font-mono mt-1 ${current.accentText}`}>
                      {st.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Visualization inside Mock */}
              <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span>Role Access Guard</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">100% Enforced</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      selectedRole === "admin"
                        ? "w-[98%] bg-rose-500"
                        : selectedRole === "examiner"
                        ? "w-[94%] bg-indigo-500"
                        : "w-[100%] bg-emerald-500"
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-1">
                  <span>JWT Cookie State</span>
                  <span className="text-indigo-600 dark:text-indigo-300">HttpOnly Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
