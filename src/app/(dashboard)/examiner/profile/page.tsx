import React from "react";
import { getCurrentUser } from "@/lib/session";
import {
  User,
  Building,
  Briefcase,
  Mail,
  Shield,
  CheckCircle,
  Calendar,
  KeyRound,
  FileText,
  Sparkles,
} from "lucide-react";
export default async function ExaminerProfilePage() {
  const session = await getCurrentUser();

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
          <User className="h-4 w-4" />
          <span>Account & Verification</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          Examiner Profile
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Your instructor credentials, institution affiliation, and academic verification status.
        </p>
      </div>

      {/* Profile Card */}
      <div className="glass-card rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-extrabold text-white text-3xl shadow-xl shadow-indigo-500/25">
              {session?.fullName?.charAt(0).toUpperCase() || "E"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{session?.fullName}</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                  Active Examiner
                </span>
              </div>
              <p className="text-sm text-slate-400">{session?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
              User ID: {session?.userId?.slice(0, 13)}...
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Building className="h-4 w-4 text-indigo-400" />
              Affiliated Institution
            </div>
            <div className="text-base font-semibold text-white">
              {session?.institution || "Stanford University"}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-violet-400" />
              Academic Department
            </div>
            <div className="text-base font-semibold text-white">
              {session?.department || "Computer Science Department"}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              Security & Role Authorization
            </div>
            <div className="text-base font-semibold text-white flex items-center gap-2">
              <span>Verified Examiner Role</span>
              <span className="text-xs text-slate-400">(Role-Based Access Enforced)</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Examination Privileges
            </div>
            <div className="text-base font-semibold text-white">
              Question Bank Authoring, Proctoring Configuration
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
