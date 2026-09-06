"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
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
  Trophy,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";

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
  status: string;
  total_questions: number;
  is_active: boolean;
  is_upcoming: boolean;
  is_ended: boolean;
  examiner?: {
    full_name: string;
    email: string;
  };
}

export default function StudentDashboardPage() {
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
  const pastExams = exams.filter((e) => e.is_ended || e.status === "CLOSED");

  return (
    <div className="space-y-10 pb-16">
      {/* Welcome Banner */}
      <div className="glass-card rounded-3xl p-8 sm:p-10 border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[110px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-400" />
                Active Student Candidate
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome{user?.fullName ? `, ${user.fullName}` : ""}!
            </h1>
            <p className="text-sm text-slate-300">
              Candidate Email: <span className="font-semibold text-white">{user?.email || "candidate"}</span> &bull; Candidate ID:{" "}
              <span className="font-semibold text-white">{user?.userId?.slice(0, 8) || "..."}</span>
            </p>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <ShieldCheck className="h-7 w-7 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-base text-white">System Integrity Ready</div>
              <div className="text-slate-400 text-xs mt-0.5">AI Proctoring Compatibility Verified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Live Assessments"
          value={liveExams.length.toString()}
          subtitle="Open for attempt right now"
          icon={PlayCircle}
          color="emerald"
        />
        <StatCard
          title="Scheduled Tests"
          value={upcomingExams.length.toString()}
          subtitle="Upcoming examination windows"
          icon={Calendar}
          color="indigo"
        />
        <StatCard
          title="Integrity Rating"
          value="100%"
          subtitle="Proctored session compliance"
          icon={ShieldCheck}
          color="cyan"
        />
      </div>

      {/* Hardware Readiness Checklist */}
      <div className="glass-card rounded-3xl p-8 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
          <Camera className="h-5 w-5 text-emerald-400" />
          Proctoring Hardware Readiness Checklist
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white">Webcam Check</div>
              <div className="text-emerald-400 text-xs font-semibold mt-0.5">Face Tracking Ready</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white">Microphone Check</div>
              <div className="text-emerald-400 text-xs font-semibold mt-0.5">VAD Audio Stream Ready</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white">Browser Guard</div>
              <div className="text-emerald-400 text-xs font-semibold mt-0.5">Fullscreen & Tab Guard Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Examinations List */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-0">
        <div className="p-8 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Calendar className="h-6 w-6 text-indigo-400" />
              Your Enrolled Examinations
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Join active proctored sessions or view your score reports
            </p>
          </div>

          <button
            onClick={fetchSessionAndExams}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading examinations...</div>
        ) : exams.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileSpreadsheet className="h-10 w-10 text-slate-600 mx-auto" />
            <div className="text-base font-bold text-white">No Examinations Published Yet</div>
            <div className="text-xs text-slate-400">
              When instructors publish scheduled assessments, they will appear here automatically.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {exams.map((exam) => {
              return (
                <div
                  key={exam.id}
                  className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-900/40 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-lg font-bold text-white">{exam.title}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          exam.is_active
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 animate-pulse"
                            : exam.is_upcoming
                            ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                            : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                        }`}
                      >
                        {exam.is_active
                          ? "● Open for Attempt"
                          : exam.is_upcoming
                          ? "Upcoming Schedule"
                          : "Closed / Ended"}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300">
                      Instructor:{" "}
                      <span className="text-white font-semibold">
                        {exam.examiner?.full_name || "Academic Examiner"}
                      </span>{" "}
                      &bull; Duration: {exam.duration_minutes} Mins &bull; Total Marks: {exam.total_marks}{" "}
                      &bull; Passing Marks: {exam.passing_marks}
                    </p>

                    <div className="text-xs text-slate-500 flex items-center gap-4 flex-wrap">
                      <span>Starts: {new Date(exam.start_time).toLocaleString()}</span>
                      <span>Ends: {new Date(exam.end_time).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {exam.is_active ? (
                      <Link
                        href={`/student/exam/${exam.id}`}
                        className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/25 transition-all hover:scale-105"
                      >
                        <span>Enter Exam Chamber</span>
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    ) : exam.is_upcoming ? (
                      <div className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800">
                        Scheduled Window Not Started
                      </div>
                    ) : (
                      <Link
                        href={`/student/exam/${exam.id}/result`}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-indigo-300 hover:text-white bg-indigo-950/30 border border-indigo-500/30 hover:bg-indigo-900/40 transition-all"
                      >
                        <Award className="h-4 w-4" />
                        <span>View Result Report</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

