"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, Home, LogIn } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";

import { ThemeToggle } from "@/components/ThemeToggle";

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const reason = searchParams?.get("reason");

  let title = "Access Restricted";
  let message = "You do not have the required permissions or role to access this portal.";

  if (reason === "rejected") {
    title = "Application Rejected";
    message = "Your examiner registration was rejected by the administrator. Please contact your academic administrator for assistance.";
  } else if (reason === "suspended") {
    title = "Account Suspended";
    message = "Your account has been temporarily or permanently suspended.";
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-200">
      {/* Rose Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-rose-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Floating Controls in Top Right Corner */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSelector variant="compact" />
        <PWAInstallButton variant="compact" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-500/10">
          <ShieldAlert className="h-9 w-9" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed font-medium">
          {message}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card rounded-2xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900/80 relative space-y-6">
          <div className="text-sm text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed font-medium">
            <span className="font-bold text-rose-600 dark:text-rose-400">Security Policy: </span>
            Role-Based Access Control ensures that Students, Examiners, and Administrators operate strictly within their authorized assessment chambers.
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              <Home className="h-5 w-5" />
              <span>Return to Homepage</span>
            </Link>
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl font-bold text-sm text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>{t("common.signIn", "Sign In with a Different Account")}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-medium">
          Loading...
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
