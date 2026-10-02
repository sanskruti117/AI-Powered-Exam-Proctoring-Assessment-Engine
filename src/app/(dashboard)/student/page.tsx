"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Camera,
  Mic,
  Monitor,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Award,
  Clock,
  PlayCircle,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AnimatedTypewriterText } from "@/components/AnimatedTypewriterText";
import { AmbientAuroraBackground } from "@/components/AmbientAuroraBackground";
import { SpotlightCard } from "@/components/SpotlightCard";
import { Skeleton } from "@/components/SkeletonLoader";

interface ExamItem {
  id: string;
  examiner_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  max_attempts: number;
  status: string;
  results_published?: boolean;
  total_questions: number;
  is_active: boolean;
  is_upcoming: boolean;
  is_ended: boolean;
  student_attempts_count?: number;
  student_can_attempt?: boolean;
  student_has_submitted?: boolean;
  student_has_in_progress?: boolean;
  student_latest_status?: string;
  student_latest_score?: number;
  examiner?: {
    full_name: string;
    email: string;
  };
}

export default function StudentDashboardPage() {
  const { t } = useLanguage();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ fullName: string; email: string; userId: string } | null>(null);

  useEffect(() => {
    fetchSessionAndExams();
  }, []);

  const fetchSessionAndExams = async () => {
    try {
      setLoading(true);
      // Fetch session
      const sessRes = await fetch("/api/auth/me");
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        if (sessData.success) {
          setUser(sessData.user);
        }
      }

      // Fetch exams
      const examsRes = await fetch("/api/exams");
      if (examsRes.ok) {
        const examsData = await examsRes.json();
        if (examsData.success) {
          setExams(examsData.exams || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const liveExams = exams.filter((e) => e.is_active);
  const upcomingExams = exams.filter((e) => e.is_upcoming);
  const welcomeText = `${t("student.welcome", "Welcome")}${user?.fullName ? `, ${user.fullName}` : ""}!`;

  return (
    <div className="space-y-10 pb-16 relative">
      <AmbientAuroraBackground variant="emerald-indigo" intensity="subtle" />

      {/* Welcome Banner with Living Emerald Glow */}
      <div className="glass-card rounded-3xl p-8 sm:p-10 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden shadow-xl dark:shadow-2xl transition-all duration-300 hover:border-emerald-500/30 animate-fade-in-up">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none animate-float" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
                <span className="flex h-2 w-2 relative mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                {t("student.activeCandidate", "Active Student Candidate")}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight min-h-[44px]">
              <AnimatedTypewriterText
                text={welcomeText}
                speed={40}
                cursorColor="text-emerald-600 dark:text-emerald-400"
              />
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t("student.candidateEmail", "Candidate Email")}:{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{user?.email || "candidate"}</span> &bull;{" "}
              {t("student.candidateId", "Candidate ID")}:{" "}
              <span className="font-semibold text-emerald-700 dark:text-emerald-300 font-mono">
                {user?.userId?.slice(0, 8) || "..."}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t("student.systemIntegrityReady", "System Integrity Ready")}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                {t("student.aiProctoringVerified", "AI Proctoring Compatibility Verified")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in-up stagger-1">
        <StatCard
          title={t("student.liveAssessments", "Live Assessments")}
          value={loading ? "..." : liveExams.length.toString()}
          subtitle={t("student.openForAttempt", "Open for attempt right now")}
          icon={PlayCircle}
          color="emerald"
          cyberCorners={true}
        />
        <StatCard
          title={t("student.scheduledTests", "Scheduled Tests")}
          value={loading ? "..." : upcomingExams.length.toString()}
          subtitle={t("student.upcomingSchedule", "Upcoming examination windows")}
          icon={Calendar}
          color="indigo"
          cyberCorners={true}
        />
        <StatCard
          title={t("student.integrityRating", "Integrity Rating")}
          value="100%"
          subtitle={t("student.complianceSubtitle", "Proctored session compliance")}
          icon={ShieldCheck}
          color="cyan"
          cyberCorners={true}
        />
      </div>

      {/* Hardware Readiness Checklist with Hover Elevation */}
      <SpotlightCard
        glowColor="rgba(16, 185, 129, 0.18)"
        cyberCorners={true}
        className="rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-lg dark:shadow-xl space-y-4 animate-fade-in-up stagger-2"
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Camera className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          {t("student.hardwareChecklist", "Proctoring Hardware Readiness Checklist")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 hover:border-emerald-500/40 hover:-translate-y-1 transition-all group">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">{t("student.webcamCheck", "Webcam Check")}</div>
              <div className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                <span>{t("student.faceTrackingReady", "Face Tracking Ready")}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 hover:border-emerald-500/40 hover:-translate-y-1 transition-all group">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">{t("student.microphoneCheck", "Microphone Check")}</div>
              <div className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                <span>{t("student.audioStreamReady", "VAD Audio Stream Ready")}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 hover:border-emerald-500/40 hover:-translate-y-1 transition-all group">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">{t("student.browserGuard", "Browser Guard")}</div>
              <div className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                <span>{t("student.fullscreenTabGuard", "Fullscreen & Tab Guard Active")}</span>
              </div>
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* Available Examinations List */}
      <SpotlightCard
        glowColor="rgba(99, 102, 241, 0.15)"
        cyberCorners={true}
        className="rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl dark:shadow-2xl space-y-0 animate-fade-in-up stagger-3"
      >
        <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              {t("student.enrolledExams", "Your Enrolled Examinations")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("student.enrolledExamsSubtitle", "Join active proctored sessions or view your score reports")}
            </p>
          </div>

          <button
            onClick={fetchSessionAndExams}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            <Skeleton variant="table-row" />
            <Skeleton variant="table-row" />
            <Skeleton variant="table-row" />
          </div>
        ) : exams.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileSpreadsheet className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto" />
            <div className="text-base font-bold text-slate-900 dark:text-white">{t("student.noExams", "No Examinations Published Yet")}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t("student.noExamsSubtitle", "When instructors publish scheduled assessments, they will appear here automatically.")}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {exams.map((exam) => {
              const rawAttemptsCount = exam.student_attempts_count || 0;
              const maxAttempts = exam.max_attempts || 1;
              const attemptsCount = Math.min(rawAttemptsCount, maxAttempts);
              const hasExhaustedAttempts = rawAttemptsCount >= maxAttempts;
              const hasActiveInProgress = Boolean(exam.student_has_in_progress && !hasExhaustedAttempts);
              const canAttempt = (Boolean(exam.student_can_attempt) && !hasExhaustedAttempts) || hasActiveInProgress;

              return (
                <div
                  key={exam.id}
                  className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-all duration-200 group/row"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-lg font-bold text-slate-900 dark:text-white group-hover/row:text-indigo-600 dark:group-hover/row:text-indigo-300 transition-colors">
                        {exam.title}
                      </span>
                      
                      {/* Status Tag */}
                      {hasExhaustedAttempts ? (
                        exam.results_published ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30">
                            {t("student.completedTag", "Completed")} ({attemptsCount}/{maxAttempts} {t("student.attemptsUsed", "Attempts Used")})
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30">
                            {t("student.attemptSubmittedPending", "Attempt Submitted • Scores Pending")}
                          </span>
                        )
                      ) : hasActiveInProgress ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 animate-pulse">
                          {t("student.inProgressResume", "In Progress (Resume Available)")}
                        </span>
                      ) : exam.is_active ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 shadow-xs">
                          ● {t("student.openForAttempt", "Open for Attempt")} ({t("student.attempt", "Attempt")} {attemptsCount + 1} {t("student.of", "of")} {maxAttempts})
                        </span>
                      ) : exam.is_upcoming ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30">
                          {t("student.upcomingSchedule", "Upcoming Schedule")}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-slate-100 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/30">
                          {t("student.closedEnded", "Closed / Ended")}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {t("student.instructor", "Instructor")}:{" "}
                      <span className="text-slate-900 dark:text-white font-semibold">
                        {exam.examiner?.full_name || "Academic Examiner"}
                      </span>{" "}
                      &bull; {t("common.duration", "Duration")}: {exam.duration_minutes} {t("common.minutes", "Mins")} &bull; {t("common.totalMarks", "Total Marks")}: {exam.total_marks}{" "}
                      &bull; {t("student.passingMarks", "Passing Marks")}: {exam.passing_marks} &bull; {t("student.maxAttempts", "Max Attempts")}: {maxAttempts}
                    </p>

                    <div className="text-xs text-slate-500 flex items-center gap-4 flex-wrap">
                      <span>{t("student.starts", "Starts")}: {new Date(exam.start_time).toLocaleString()}</span>
                      <span>{t("student.ends", "Ends")}: {new Date(exam.end_time).toLocaleString()}</span>
                      {exam.student_has_submitted && (
                        exam.results_published && exam.student_latest_score !== undefined && exam.student_latest_score !== null ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {t("student.latestScore", "Latest Score")}: {exam.student_latest_score} / {exam.total_marks}
                          </span>
                        ) : (
                          <span className="text-indigo-600 dark:text-indigo-300 font-semibold flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                            {t("student.attemptRecordedPending", "Attempt Recorded • Scores Pending Release")}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    {/* If student has exhausted all allowed attempts or has completed: Strictly show View Result Report */}
                    {hasExhaustedAttempts ? (
                      <Link
                        href={`/student/exam/${exam.id}/result`}
                        className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-105 ${
                          exam.results_published
                            ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/25 btn-shimmer"
                            : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-xs"
                        }`}
                      >
                        {exam.results_published ? <Award className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                        <span>{exam.results_published ? t("student.viewScoreReport", "View Score Report") : t("student.viewAttemptStatus", "View Attempt Status")}</span>
                      </Link>
                    ) : hasActiveInProgress ? (
                      <Link
                        href={`/student/exam/${exam.id}`}
                        className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-500 shadow-xl shadow-amber-600/30 transition-all hover:scale-105 btn-shimmer group"
                      >
                        <span>{t("student.resumeAttempt", "Resume Attempt")}</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : canAttempt ? (
                      <div className="flex items-center gap-3">
                        {exam.student_has_submitted && (
                          <Link
                            href={`/student/exam/${exam.id}/result`}
                            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:scale-105 transition-all"
                          >
                            <Award className="h-4 w-4" />
                            <span>{exam.results_published ? t("student.previousScore", "Previous Score") : t("student.previousAttempt", "Previous Attempt")}</span>
                          </Link>
                        )}
                        <Link
                          href={`/student/exam/${exam.id}`}
                          className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/30 transition-all hover:scale-105 btn-shimmer group"
                        >
                          <span>{t("student.enterExamChamber", "Enter Exam Chamber")}</span>
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    ) : exam.is_upcoming ? (
                      <div className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {t("student.scheduledNotStarted", "Scheduled Window Not Started")}
                      </div>
                    ) : exam.student_has_submitted ? (
                      <Link
                        href={`/student/exam/${exam.id}/result`}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
                      >
                        <Award className="h-4 w-4" />
                        <span>{exam.results_published ? t("student.viewScoreReport", "View Score Report") : t("student.viewAttemptStatus", "View Attempt Status")}</span>
                      </Link>
                    ) : (
                      <div className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {t("student.assessmentClosed", "Assessment Closed")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}
