"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Terminal,
  Activity,
  Layers,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { InteractiveProctorSimulator } from "@/components/InteractiveProctorSimulator";
import { InteractiveRoleShowcase } from "@/components/InteractiveRoleShowcase";
import { InteractiveStatsSection } from "@/components/InteractiveStatsSection";
import { AnimatedTypewriterText } from "@/components/AnimatedTypewriterText";

interface LandingViewProps {
  session: {
    userId: string;
    email: string;
    role: string;
    fullName: string;
    institution?: string | null;
  } | null;
}

export function LandingView({ session }: LandingViewProps) {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-cyber-grid">
      {/* Dynamic Animated Ambient Glow Orbs */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[850px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-cyan-500/10 blur-[160px] rounded-full pointer-events-none animate-pulse-glow" />
      <div className="absolute top-[600px] -left-40 w-[600px] h-[450px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none animate-float" />
      <div className="absolute top-[900px] -right-40 w-[600px] h-[450px] bg-violet-600/15 blur-[140px] rounded-full pointer-events-none animate-float-reverse" />

      {/* Main Content */}
      <main className="flex-1 z-10">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto space-y-7">
              {/* Top Pill Badge with Glow */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-indigo-500/40 text-indigo-300 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg shadow-indigo-950/50 backdrop-blur-md animate-bounce-soft hover:border-indigo-400 transition-colors">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>{t("landing.pillBadge", "Next-Gen Online Exam Integrity Engine")}</span>
              </div>

              {/* Main Headline with Shimmer & Typewriter Animation */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
                <AnimatedTypewriterText
                  text={t("landing.heroTitle", "AI-Powered Exam Proctoring & Assessment Engine")}
                  speed={35}
                  className="text-gradient-shimmer"
                  cursorColor="text-indigo-400"
                />
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                {t(
                  "landing.heroSubtitle",
                  "Secure, automated proctoring with robust Role-Based Access Control engineered for Academic Institutions, Examiners, and Students."
                )}
              </p>

              {/* Primary Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                {session ? (
                  <Link
                    href={
                      session.role === "ADMIN"
                        ? "/admin"
                        : session.role === "EXAMINER"
                        ? "/examiner"
                        : "/student"
                    }
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/40 transition-all hover:scale-105 btn-shimmer group"
                  >
                    <span>
                      {session.role === "ADMIN"
                        ? t("landing.openAdminPortal", "Open Your Admin Portal")
                        : session.role === "EXAMINER"
                        ? t("landing.openExaminerPortal", "Open Your Examiner Portal")
                        : t("landing.openStudentPortal", "Open Your Student Portal")}
                    </span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register/student"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/40 transition-all hover:scale-105 btn-shimmer group"
                    >
                      <GraduationCap className="h-5 w-5" />
                      <span>{t("landing.studentRegistration", "Student Registration")}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/register/examiner"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-indigo-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all hover:border-indigo-500/50 hover:scale-105 shadow-lg"
                    >
                      <Briefcase className="h-5 w-5 text-indigo-400" />
                      <span>{t("landing.requestExaminerAccess", "Request Examiner Access")}</span>
                    </Link>
                    <Link
                      href="/login"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-slate-300 hover:text-white hover:bg-slate-900/80 border border-slate-800 transition-colors"
                    >
                      <span>{t("landing.signIn", "Sign In")}</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Interactive Live Proctoring Simulator Sandbox */}
            <div className="mt-16 sm:mt-20">
              <InteractiveProctorSimulator />
            </div>

            {/* Interactive Performance Benchmarks */}
            <div className="mt-20">
              <InteractiveStatsSection />
            </div>

            {/* Interactive 3-Role Architecture Chamber Switcher */}
            <div className="mt-16 sm:mt-24">
              <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-semibold uppercase">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Chamber Architecture</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Three Specialized Role Environments
                </h2>
                <p className="text-sm text-slate-400">
                  Select a chamber below to preview workflows, security controls, and feature capabilities.
                </p>
              </div>

              <InteractiveRoleShowcase />
            </div>

            {/* Live Interactive Code & Proctoring Highlights */}
            <div className="mt-24 max-w-6xl mx-auto">
              <div className="glass-card-interactive rounded-3xl p-8 sm:p-12 border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950/90 relative overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-6 space-y-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
                      <Terminal className="w-4 h-4" />
                      <span>BUILT-IN MONACO CODE RUNNER</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                      Real-Time Code Execution & Automatic Test Case Verification
                    </h3>

                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                      Evaluate candidates on Python and JavaScript algorithms with sandboxed execution, instant standard output analysis, and anti-paste protection.
                    </p>

                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Isolated sandbox runtime with memory & timeout constraints</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Hidden test cases for thorough algorithm validation</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Real-time anti-cheat clipboard & blur event recording</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-6">
                    {/* Mock Code Chamber Preview */}
                    <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
                      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="ml-2 text-slate-300">solution.py</span>
                        </div>
                        <span className="text-emerald-400">● 3/3 Tests Passed</span>
                      </div>
                      <div className="p-4 font-mono text-xs text-slate-300 space-y-1 bg-slate-950 leading-relaxed overflow-x-auto">
                        <p><span className="text-purple-400">def</span> <span className="text-indigo-300">max_subarray_sum</span>(nums):</p>
                        <p className="pl-4 text-slate-500"># Kadane&apos;s Algorithm O(N)</p>
                        <p className="pl-4">max_so_far = max_ending = nums[<span className="text-amber-300">0</span>]</p>
                        <p className="pl-4"><span className="text-purple-400">for</span> x <span className="text-purple-400">in</span> nums[<span className="text-amber-300">1</span>:]:</p>
                        <p className="pl-8">max_ending = max(x, max_ending + x)</p>
                        <p className="pl-8">max_so_far = max(max_so_far, max_ending)</p>
                        <p className="pl-4"><span className="text-purple-400">return</span> max_so_far</p>
                      </div>
                      <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
                        <span>[OUTPUT] Result: 6 (Matches Expected)</span>
                        <span className="text-slate-400">Execution: 12ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl py-12 text-center text-sm text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-white">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <span>Proctor<span className="text-indigo-400">AI</span></span>
          </div>

          <p className="text-xs text-slate-400">
            {t(
              "landing.footerText",
              "AI Exam Proctoring System © 2026. Built with Next.js, SQLite / PostgreSQL, and JWT RBAC."
            )}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Systems Nominal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
