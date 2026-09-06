import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { getCurrentUser } from "@/lib/session";
import {
  Shield,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  UserCheck,
  GraduationCap,
  Briefcase,
} from "lucide-react";

export default async function HomePage() {
  const session = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar user={session} />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-36">
          {/* Subtle Background Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-indigo-600/15 blur-[150px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-[450px] h-[300px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto space-y-8">
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-sm font-bold uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>Next-Gen Online Exam Integrity Engine</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
                AI-Powered Exam Proctoring & Assessment Engine
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Secure, automated proctoring with robust Role-Based Access Control engineered for Academic Institutions, Examiners, and Students.
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
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
                  >
                    <span>Open Your {session.role.toLowerCase()} Portal</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register/student"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
                    >
                      <GraduationCap className="h-5 w-5" />
                      <span>Student Registration</span>
                    </Link>
                    <Link
                      href="/register/examiner"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-indigo-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
                    >
                      <Briefcase className="h-5 w-5" />
                      <span>Request Examiner Access</span>
                    </Link>
                    <Link
                      href="/login"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800/80 transition-colors"
                    >
                      <span>Sign In</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* 3-Role Architecture Showcase Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto">
              {/* Card 1: Administrator */}
              <div className="glass-card rounded-3xl p-8 border border-slate-800 relative group hover:border-rose-500/40 transition-all shadow-xl">
                <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-6">
                  <Shield className="h-7 w-7" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">1. Administrator</h3>
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    Single Admin
                  </span>
                </div>
                <p className="text-base text-slate-400 mt-3 leading-relaxed">
                  Strictly one super admin system authority. Reviews incoming examiner credentials, approves/rejects with audit remarks, and controls system health.
                </p>
                <div className="mt-6 pt-5 border-t border-slate-800 flex items-center gap-2 text-sm text-rose-300 font-semibold">
                  <Lock className="h-4 w-4" />
                  <span>Enforced at database engine level</span>
                </div>
              </div>

              {/* Card 2: Examiner */}
              <div className="glass-card rounded-3xl p-8 border border-slate-800 relative group hover:border-indigo-500/40 transition-all shadow-xl">
                <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-6">
                  <UserCheck className="h-7 w-7" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">2. Examiner</h3>
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Admin Approval
                  </span>
                </div>
                <p className="text-base text-slate-400 mt-3 leading-relaxed">
                  Submits institutional credentials and awaits verification. Once approved by the administrator, gains exam creation and live proctoring management tools.
                </p>
                <div className="mt-6 pt-5 border-t border-slate-800 flex items-center gap-2 text-sm text-indigo-300 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Protected by verification lifecycle</span>
                </div>
              </div>

              {/* Card 3: Student */}
              <div className="glass-card rounded-3xl p-8 border border-slate-800 relative group hover:border-emerald-500/40 transition-all shadow-xl">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-6">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">3. Student</h3>
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Instant Access
                  </span>
                </div>
                <p className="text-base text-slate-400 mt-3 leading-relaxed">
                  Direct student registration and instant login with zero friction. Enters authorized exam sessions with automated AI integrity safeguards.
                </p>
                <div className="mt-6 pt-5 border-t border-slate-800 flex items-center gap-2 text-sm text-emerald-300 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Instant active account status</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 text-center text-sm text-slate-400">
        <p>AI Exam Proctoring System &copy; 2026. Built with Next.js, SQLite / PostgreSQL, and JWT RBAC.</p>
      </footer>
    </div>
  );
}
