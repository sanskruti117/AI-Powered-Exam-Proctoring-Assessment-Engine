"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  User,
  Building,
  Briefcase,
  Shield,
  CheckCircle,
  Sparkles,
} from "lucide-react";

interface CurrentUser {
  userId?: string;
  fullName?: string;
  email?: string;
  institution?: string | null;
  department?: string | null;
  role?: string;
}

export default function ExaminerProfilePage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
          <User className="h-4 w-4" />
          <span>{t("examiner.accountVerification", "Account & Verification")}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          {t("examiner.examinerProfile", "Examiner Profile")}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {t("examiner.examinerProfileDesc", "Your instructor credentials, institution affiliation, and academic verification status.")}
        </p>
      </div>

      {/* Profile Card */}
      <div className="glass-card rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-extrabold text-white text-3xl shadow-xl shadow-indigo-500/25">
              {user?.fullName?.charAt(0).toUpperCase() || "E"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{user?.fullName || "Examiner"}</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                  {t("examiner.activeExaminer", "Active Examiner")}
                </span>
              </div>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
              User ID: {user?.userId?.slice(0, 13) || "EXM"}...
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Building className="h-4 w-4 text-indigo-400" />
              {t("examiner.affiliatedInstitution", "Affiliated Institution")}
            </div>
            <div className="text-base font-semibold text-white">
              {user?.institution || t("examiner.academicInstitution", "Academic Institution")}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-violet-400" />
              {t("examiner.academicDepartment", "Academic Department")}
            </div>
            <div className="text-base font-semibold text-white">
              {user?.department || t("examiner.department", "Department")}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              {t("examiner.securityRoleAuth", "Security & Role Authorization")}
            </div>
            <div className="text-base font-semibold text-white flex items-center gap-2">
              <span>{t("examiner.verifiedExaminerRole", "Verified Examiner Role")}</span>
              <span className="text-xs text-slate-400">({t("examiner.roleAccessEnforced", "Role-Based Access Enforced")})</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              {t("examiner.examinationPrivileges", "Examination Privileges")}
            </div>
            <div className="text-base font-semibold text-white">
              {t("examiner.privilegesDesc", "Question Bank Authoring, Assessment Configuration, Proctoring Review")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
