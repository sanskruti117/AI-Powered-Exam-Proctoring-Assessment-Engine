"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Shield, RefreshCw, LogOut, CheckCircle2, Building, Mail } from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [userData, setUserData] = useState<{
    fullName: string;
    email: string;
    institution?: string;
    status: string;
  } | null>(null);

  const fetchSession = React.useCallback(async () => {
    try {
      setChecking(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUserData(data.user);
        if (data.user.status === "ACTIVE") {
          if (data.user.role === "EXAMINER") router.push("/examiner");
          else if (data.user.role === "ADMIN") router.push("/admin");
          else router.push("/student");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/10">
          <Clock className="h-9 w-9 animate-pulse" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Application Pending Review
        </h2>
        <p className="mt-3 text-base text-slate-400">
          Your Examiner application has been submitted to the Administrator
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="glass-card rounded-2xl p-8 sm:p-10 border border-slate-800 shadow-2xl relative space-y-6">
          {/* User Info Snapshot */}
          {userData && (
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-sm">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Applicant:</span>
                <span className="text-white font-bold text-base">{userData.fullName}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Email:</span>
                <span className="text-slate-200">{userData.email}</span>
              </div>
              {userData.institution && (
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                  <span className="text-slate-400 font-medium">Institution:</span>
                  <span className="text-slate-200">{userData.institution}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400 font-medium">Current Status:</span>
                <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                  Pending Admin Approval
                </span>
              </div>
            </div>
          )}

          <div className="text-sm text-slate-400 leading-relaxed space-y-3">
            <p>
              To maintain assessment security and academic integrity, all instructor privileges are reviewed by the institutional administrator.
            </p>
            <p>
              Once your request is approved, you will have immediate access to create exams, configure webcam proctoring, and review candidate integrity scores.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={fetchSession}
              disabled={checking}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl font-semibold text-base text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-5 w-5 ${checking ? "animate-spin" : ""}`} />
              <span>{checking ? "Checking Status..." : "Check Approval Status"}</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl font-semibold text-sm text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-slate-400" />
              <span>Sign in as a Different User</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
