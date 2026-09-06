"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { useState } from "react";

interface ExaminerHeaderProps {
  user?: {
    fullName?: string;
    email?: string;
    institution?: string | null;
  } | null;
}

export function ExaminerHeader({ user }: ExaminerHeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const name = user?.fullName || "Examiner";

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-[#070d1c]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[78px] max-w-[1720px] items-center justify-between px-4 sm:px-7 lg:px-8">
        <Link href="/examiner" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform group-hover:scale-105">
            <ShieldCheck className="h-6 w-6" strokeWidth={2.3} />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-extrabold tracking-tight text-white">Proctor <span className="text-indigo-400">AI</span></p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Assessment platform</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/75 px-3 py-2 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-sm font-bold text-indigo-300 ring-1 ring-inset ring-indigo-400/20">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="max-w-[180px] leading-tight">
              <div className="flex items-center gap-2">
                <p className="truncate text-xs font-bold text-slate-100">{name}</p>
                <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-indigo-300 ring-1 ring-inset ring-indigo-400/20">Examiner</span>
              </div>
              <p className="mt-1 truncate text-[10px] text-slate-400">{user?.email || user?.institution || "Academic workspace"}</p>
            </div>
          </div>
          <button onClick={handleLogout} disabled={loggingOut} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 px-3.5 text-xs font-bold text-slate-200 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-60 sm:px-4">
            <LogOut className="h-4 w-4" />
            <span>{loggingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
