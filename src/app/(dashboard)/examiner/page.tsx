"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Briefcase, Building, CheckCircle2, FileText, FolderKanban, PlusCircle, Users } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AnimatedTypewriterText } from "@/components/AnimatedTypewriterText";
import { AmbientAuroraBackground } from "@/components/AmbientAuroraBackground";
import { SpotlightCard } from "@/components/SpotlightCard";

interface CurrentUser { fullName?: string; institution?: string | null; department?: string | null; }
interface ExamItem { status: string; is_active: boolean; attempts_count: number; }
interface DashboardMetrics { questions: number; activeExams: number; publishedExams: number; candidateAttempts: number; }

const emptyMetrics: DashboardMetrics = { questions: 0, activeExams: 0, publishedExams: 0, candidateAttempts: 0 };

export default function ExaminerDashboardPage() {
  const { t } = useLanguage();
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
  const welcomeText = `${t("examiner.welcomeBack", "Welcome back")}, ${user?.fullName || t("common.examiner", "Examiner")}!`;

  return (
    <div className="space-y-8 pb-12 relative">
      <AmbientAuroraBackground variant="indigo-cyan" intensity="subtle" />

      {/* Welcome Banner with Living Mesh Glow */}
      <section className="glass-card relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xl dark:shadow-2xl sm:p-10 transition-all duration-300 hover:border-indigo-500/30 animate-fade-in-up">
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-[120px] animate-pulse-glow" />
        <div className="pointer-events-none absolute left-1/3 bottom-0 h-64 w-64 rounded-full bg-purple-500/10 blur-[100px] animate-float" />

        <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 shadow-xs">
              <span className="flex h-2 w-2 relative mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              {t("examiner.verifiedExaminer", "Verified Academic Examiner")}
            </span>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl min-h-[44px]">
              <AnimatedTypewriterText
                text={welcomeText}
                speed={40}
                cursorColor="text-indigo-600 dark:text-indigo-400"
              />
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2 group">
                <Building className="h-4 w-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                {user?.institution || t("examiner.academicInstitution", "Academic Institution")}
              </span>
              {user?.department && (
                <span className="flex items-center gap-2 group">
                  <Briefcase className="h-4 w-4 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform" />
                  {user.department}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/examiner/questions/create"
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 hover:bg-indigo-500 btn-shimmer group"
            >
              <PlusCircle className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              {t("examiner.createQuestion", "Create Question")}
            </Link>
            <Link
              href="/examiner/exams?create=1"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 hover:scale-105 shadow-sm group"
            >
              <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              {t("examiner.createAssessment", "Create Assessment")}
            </Link>
          </div>
        </div>
      </section>

      {/* Stat Cards Grid */}
      <section aria-label="Live assessment metrics" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 animate-fade-in-up stagger-1">
        <StatCard
          title={t("examiner.questionBank", "Question Bank")}
          value={metricValue(metrics.questions)}
          subtitle={t("examiner.questionsCreatedSubtitle", "Questions you have created")}
          icon={BookOpen}
          color="indigo"
          cyberCorners={true}
        />
        <StatCard
          title={t("examiner.liveAssessments", "Active Assessments")}
          value={metricValue(metrics.activeExams)}
          subtitle={t("examiner.acceptingAttemptsSubtitle", "Currently accepting attempts")}
          icon={FileText}
          color="indigo"
          cyberCorners={true}
        />
        <StatCard
          title={t("examiner.publishedAssessments", "Published Assessments")}
          value={metricValue(metrics.publishedExams)}
          subtitle={t("examiner.availableOrScheduledSubtitle", "Available or scheduled")}
          icon={FolderKanban}
          color="cyan"
          cyberCorners={true}
        />
        <StatCard
          title={t("examiner.candidateAttempts", "Candidate Attempts")}
          value={metricValue(metrics.candidateAttempts)}
          subtitle={t("examiner.recordedAttemptsSubtitle", "Recorded across your assessments")}
          icon={Users}
          color="emerald"
          cyberCorners={true}
        />
      </section>

      {/* Quick Action Navigation Cards */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 animate-fade-in-up stagger-2">
        <SpotlightCard
          glowColor="rgba(99, 102, 241, 0.2)"
          cyberCorners={true}
          className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 dark:border-slate-800 p-7 shadow-lg dark:shadow-xl hover:-translate-y-1.5 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-950/10 dark:hover:shadow-indigo-950/40"
        >
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white shadow-md">
              <PlusCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors">
              {t("examiner.createAssessmentContent", "Create assessment content")}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t("examiner.createAssessmentDesc", "Create questions, then build an assessment with sections, timing, and marking rules.")}
            </p>
          </div>
          <div className="pt-6">
            <Link
              href="/examiner/questions/create"
              className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 group-hover:translate-x-1 transition-transform"
            >
              {t("examiner.createQuestionLink", "Create a question")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </SpotlightCard>

        <SpotlightCard
          glowColor="rgba(168, 85, 247, 0.2)"
          cyberCorners={true}
          className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 dark:border-slate-800 p-7 shadow-lg dark:shadow-xl hover:-translate-y-1.5 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-950/10 dark:hover:shadow-violet-950/40"
        >
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-600/20 text-violet-600 dark:text-violet-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white shadow-md">
              <FolderKanban className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-200 transition-colors">
              {t("examiner.manageAssessments", "Manage assessments")}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t("examiner.manageAssessmentsDesc", "Open an assessment to manage questions, review attempts, grade answers, and view analytics.")}
            </p>
          </div>
          <div className="pt-6">
            <Link
              href="/examiner/exams"
              className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 group-hover:translate-x-1 transition-transform"
            >
              {t("examiner.openAssessmentsLink", "Open assessments")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </SpotlightCard>
      </section>
    </div>
  );
}
