"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Briefcase, Building, CheckCircle2, FileText, FolderKanban, PlusCircle, Users } from "lucide-react";
import { StatCard } from "@/components/StatCard";

interface CurrentUser { fullName?: string; institution?: string | null; department?: string | null; }
interface ExamItem { status: string; is_active: boolean; attempts_count: number; }
interface DashboardMetrics { questions: number; activeExams: number; publishedExams: number; candidateAttempts: number; }

const emptyMetrics: DashboardMetrics = { questions: 0, activeExams: 0, publishedExams: 0, candidateAttempts: 0 };

export default function ExaminerDashboardPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [userResponse, examsResponse, questionsResponse] = await Promise.all([
          fetch("/api/auth/me"), fetch("/api/exams"), fetch("/api/questions?page_size=1"),
        ]);
        const [userData, examsData, questionsData] = await Promise.all([
          userResponse.json(), examsResponse.json(), questionsResponse.json(),
        ]);

        if (userData.authenticated) setUser(userData.user);
        const exams: ExamItem[] = examsData.success ? examsData.exams || [] : [];
        setMetrics({
          questions: questionsData.success ? questionsData.total || 0 : 0,
          activeExams: exams.filter((exam) => exam.is_active).length,
          publishedExams: exams.filter((exam) => exam.status === "PUBLISHED").length,
          candidateAttempts: exams.reduce((total, exam) => total + (exam.attempts_count || 0), 0),
        });
      } catch (error) {
        console.error("Unable to load examiner dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const metricValue = (value: number) => (loading ? "—" : value.toLocaleString());

  return (
    <div className="space-y-8 pb-12">
      <section className="glass-card relative overflow-hidden rounded-3xl border border-slate-800 p-8 shadow-2xl sm:p-10">
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-[110px]" />
        <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300"><CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-400" />Verified academic examiner</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Welcome back, {user?.fullName || "Examiner"}!</h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-sm text-slate-300">
              <span className="flex items-center gap-2"><Building className="h-4 w-4 text-indigo-400" />{user?.institution || "Academic Institution"}</span>
              {user?.department && <span className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-violet-400" />{user.department}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/examiner/questions/create" className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] hover:bg-indigo-500"><PlusCircle className="h-5 w-5" />Create Question</Link>
            <Link href="/examiner/exams?create=1" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"><FileText className="h-4 w-4" />Create Assessment</Link>
          </div>
        </div>
      </section>

      <section aria-label="Live assessment metrics" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Question Bank" value={metricValue(metrics.questions)} subtitle="Questions you have created" icon={BookOpen} color="indigo" />
        <StatCard title="Active Assessments" value={metricValue(metrics.activeExams)} subtitle="Currently accepting attempts" icon={FileText} color="indigo" />
        <StatCard title="Published Assessments" value={metricValue(metrics.publishedExams)} subtitle="Available or scheduled" icon={FolderKanban} color="cyan" />
        <StatCard title="Candidate Attempts" value={metricValue(metrics.candidateAttempts)} subtitle="Recorded across your assessments" icon={Users} color="emerald" />
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="glass-card group flex flex-col justify-between rounded-3xl border border-slate-800 p-7 shadow-xl transition-all hover:border-indigo-500/40">
          <div className="space-y-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-600/20 text-indigo-400 transition-transform group-hover:scale-110"><PlusCircle className="h-6 w-6" /></div><h2 className="text-xl font-bold text-white">Create assessment content</h2><p className="text-sm leading-relaxed text-slate-400">Create questions, then build an assessment with sections, timing, and marking rules.</p></div>
          <div className="pt-6"><Link href="/examiner/questions/create" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300">Create a question<ArrowRight className="h-4 w-4" /></Link></div>
        </div>
        <div className="glass-card group flex flex-col justify-between rounded-3xl border border-slate-800 p-7 shadow-xl transition-all hover:border-violet-500/40">
          <div className="space-y-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-600/20 text-violet-400 transition-transform group-hover:scale-110"><FolderKanban className="h-6 w-6" /></div><h2 className="text-xl font-bold text-white">Manage assessments</h2><p className="text-sm leading-relaxed text-slate-400">Open an assessment to manage questions, review attempts, grade answers, and view analytics.</p></div>
          <div className="pt-6"><Link href="/examiner/exams" className="inline-flex items-center gap-2 text-sm font-bold text-violet-400 hover:text-violet-300">Open assessments<ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>
    </div>
  );
}
