"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Users,
  Plus,
  BarChart3,
  Trophy,
} from "lucide-react";
import { ExamContextNav } from "@/components/ExamContextNav";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ExamSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  target_marks: number;
  total_pool_questions: number;
  total_pool_marks: number;
}

interface ExamDetail {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  max_attempts: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  results_published?: boolean;
  sections: ExamSection[];
  total_questions: number;
  total_pool_marks: number;
  attempts_count: number;
  is_active: boolean;
  is_upcoming: boolean;
  is_ended: boolean;
}

export default function ExamOverviewPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishLoading, setPublishLoading] = useState(false);
  const [resultsPublishLoading, setResultsPublishLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (examId) {
      fetchExam();
    }
  }, [examId]);

  const fetchExam = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${examId}`);
      if (!res.ok) throw new Error(t("examiner.examNotFound", "Failed to load exam details."));
      const data = await res.json();
      setExam(data);
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishLoading(true);
      setFeedback(null);
      const res = await fetch(`/api/exams/${examId}/publish`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || "Publish validation failed.");
      }

      setFeedback({ type: "success", msg: data.message || "Exam successfully published!" });
      fetchExam();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setPublishLoading(false);
    }
  };

  const handleTogglePublishResults = async (publishStatus: boolean) => {
    try {
      setResultsPublishLoading(true);
      setFeedback(null);
      const res = await fetch(`/api/exams/${examId}/publish-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: publishStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to update score publication status.");
      }

      setFeedback({ type: "success", msg: data.message || "Score publication updated!" });
      fetchExam();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setResultsPublishLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">{t("examiner.loadingOverview", "Loading exam overview...")}</div>;
  }

  if (!exam) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="text-rose-400 font-bold">{t("examiner.examNotFound", "Exam not found.")}</div>
        <Link href="/examiner/exams" className="text-xs text-indigo-400 underline">
          {t("examiner.returnToExams", "Return to Examinations")}
        </Link>
      </div>
    );
  }

  const isPublishable = exam.sections.every(
    (sec) => sec.total_pool_marks >= sec.target_marks
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Contextual Header & Sub-Nav */}
      <ExamContextNav
        examId={exam.id}
        examTitle={exam.title}
        status={exam.status}
        totalQuestions={exam.total_questions}
        totalMarks={exam.total_marks}
      />

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300"
              : "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-semibold">{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer">
            {t("common.dismiss", "Dismiss")}
          </button>
        </div>
      )}

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Target Marks & Readiness */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t("examiner.examMarks", "EXAM MARKS")}</span>
            <Award className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {exam.total_marks}{" "}
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              ({t("examiner.pass", "Pass")}: {exam.passing_marks})
            </span>
          </div>
          <div className="text-xs font-bold">
            {exam.total_pool_marks >= exam.total_marks ? (
              <span className="text-emerald-700 dark:text-emerald-400">✓ {t("examiner.pool", "Pool")}: {exam.total_pool_marks} {t("examiner.marks", "Marks")}</span>
            ) : (
              <span className="text-rose-700 dark:text-rose-400">⚠️ {t("examiner.pool", "Pool")}: {exam.total_pool_marks} / {exam.total_marks}</span>
            )}
          </div>
        </div>

        {/* Duration & Delivery */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t("examiner.durationAndPolicy", "DURATION & POLICY")}</span>
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{exam.duration_minutes} {t("examiner.mins", "Mins")}</div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {exam.max_attempts} {exam.max_attempts > 1 ? t("examiner.attemptsAllowed", "Attempts Allowed") : t("examiner.attemptAllowed", "Attempt Allowed")} &bull; {t("examiner.shuffled", "Shuffled")}
          </div>
        </div>

        {/* Testing Window */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t("examiner.scheduleStatus", "SCHEDULE STATUS")}</span>
            <Calendar className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
            {exam.is_active ? t("examiner.liveWindowActive", "Live Window Active") : exam.is_upcoming ? t("examiner.upcomingSchedule", "Upcoming Schedule") : t("examiner.closedEnded", "Closed / Ended")}
          </div>
          <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
            {formatDate(exam.start_time)}
          </div>
        </div>

        {/* Candidate Submissions */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t("examiner.submissions", "SUBMISSIONS")}</span>
            <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{exam.attempts_count}</div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{t("examiner.candidateEvaluations", "Candidate evaluations")}</div>
        </div>
      </div>

      {/* Candidate Score Release & Results Publishing Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white dark:bg-gradient-to-r dark:from-slate-900/90 dark:to-slate-900/50">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                exam.results_published
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30"
                  : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
              }`}
            >
              {exam.results_published
                ? `● ${t("examiner.scoresPublished", "Scores Published to Students")}`
                : `○ ${t("examiner.scoresWithheld", "Scores Withheld (Private to Examiner)")}`}
            </span>
            <span className="text-xs text-slate-700 dark:text-slate-400 font-semibold">
              &bull; {exam.attempts_count} {t("examiner.submissionsRecorded", "Submissions Recorded")}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {exam.results_published
              ? t("examiner.candidateResultsLive", "Candidate Results Are Live & Viewable by Students")
              : t("examiner.scoresHidden", "Scores & Answer Keys Are Hidden from Candidates")}
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-400 max-w-2xl font-medium">
            {exam.results_published
              ? t(
                  "examiner.candidateResultsLiveSubtitle",
                  "Students can currently view their certified score reports, earned marks, and question breakdown."
                )
              : t(
                  "examiner.scoresHiddenSubtitle",
                  "Students can only see that their exam attempt was recorded. Publish scores once you have completed all evaluations and reviews."
                )}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleTogglePublishResults(!exam.results_published)}
            disabled={resultsPublishLoading}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer ${
              exam.results_published
                ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25"
            }`}
          >
            <Award className="h-4 w-4" />
            <span>
              {resultsPublishLoading
                ? t("common.loading", "Updating...")
                : exam.results_published
                ? t("examiner.unpublishScores", "Unpublish / Revoke Scores")
                : t("examiner.publishScores", "Publish Scores to Students")}
            </span>
          </button>
        </div>
      </div>

      {/* Section-by-Section Question Pool Readiness */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>{t("examiner.sectionWisePools", "Section-wise Question Pools & Marks Readiness")}</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {t(
                "examiner.sectionWiseSubtitle",
                "Each student attempt will be delivered a randomized combination of questions summing exactly to the section target marks."
              )}
            </p>
          </div>

          <Link
            href={`/examiner/exams/${exam.id}/manage`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t("examiner.manageQuestionPools", "Manage Question Pools")}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exam.sections.map((sec, idx) => {
            const isReady = sec.total_pool_marks >= sec.target_marks;
            const progressPct = Math.min(
              100,
              Math.round((sec.total_pool_marks / (sec.target_marks || 1)) * 100)
            );

            return (
              <div
                key={sec.id}
                className={`p-5 rounded-2xl border space-y-3.5 ${
                  isReady
                    ? "bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800"
                    : "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-400 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{sec.title}</span>
                  </div>
                  <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
                    {t("examiner.target", "Target")}: {sec.target_marks} {t("examiner.marks", "Marks")}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-400 font-medium">
                    <span>
                      {t("examiner.pool", "Pool")}: {sec.total_pool_questions} {t("examiner.questions", "questions")}
                    </span>
                    <span className={isReady ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-rose-700 dark:text-rose-400 font-bold"}>
                      {sec.total_pool_marks} / {sec.target_marks} {t("examiner.marks", "Marks")} ({progressPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        isReady ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Warning Alert if insufficient questions */}
                {!isReady && (
                  <div className="p-3 rounded-xl bg-rose-100/80 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span className="font-semibold">
                      {t(
                        "examiner.cannotPublishWarning",
                        "Cannot publish — this section needs enough questions to form target marks."
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Publish Action Footer */}
        {exam.status === "DRAFT" && (
          <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{t("examiner.publishingStatus", "Publishing Status")}</h4>
              <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">
                {isPublishable
                  ? t(
                      "examiner.publishingReadyDesc",
                      "All sections meet the minimum target marks threshold. You can now publish this examination."
                    )
                  : t(
                      "examiner.publishingUnreadyDesc",
                      "Add more questions to all sections so each section has at least its target marks before publishing."
                    )}
              </p>
            </div>

            <button
              onClick={handlePublish}
              disabled={!isPublishable || publishLoading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
            >
              <PlayCircle className="h-4 w-4" />
              <span>
                {publishLoading
                  ? t("examiner.validatingAndPublishing", "Validating & Publishing...")
                  : t("examiner.publishExamination", "Publish Examination")}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Links Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href={`/examiner/exams/${exam.id}/manage`}
          className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-indigo-300 dark:hover:border-slate-700 transition-all group space-y-2 cursor-pointer shadow-sm"
        >
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Layers className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
            {t("examiner.questionPaperPools", "Question Paper & Pools")}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {t(
              "examiner.questionPaperPoolsSubtitle",
              "Author, edit, and organize questions under section weightages."
            )}
          </p>
        </Link>

        <Link
          href={`/examiner/exams/${exam.id}/leaderboard`}
          className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-amber-300 dark:hover:border-slate-700 transition-all group space-y-2 cursor-pointer shadow-sm"
        >
          <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Trophy className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300">
            {t("examiner.candidateLeaderboard", "Candidate Leaderboard")}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {t(
              "examiner.candidateLeaderboardSubtitle",
              "View ranked scores, percentages, and average stopwatch pacing."
            )}
          </p>
        </Link>

        <Link
          href={`/examiner/exams/${exam.id}/analytics`}
          className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-emerald-300 dark:hover:border-slate-700 transition-all group space-y-2 cursor-pointer shadow-sm"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
            {t("examiner.cohortAnalytics", "Cohort Analytics")}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {t(
              "examiner.cohortAnalyticsSubtitle",
              "Inspect pass rates, section mastery gauges, and item diagnostics."
            )}
          </p>
        </Link>
      </div>
    </div>
  );
}
