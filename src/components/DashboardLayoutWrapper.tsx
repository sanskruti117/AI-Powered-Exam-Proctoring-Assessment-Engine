"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";

interface DashboardLayoutWrapperProps {
  user: any;
  children: React.ReactNode;
}

export function DashboardLayoutWrapper({ user, children }: DashboardLayoutWrapperProps) {
  const pathname = usePathname();
  // Hide global navigation header when candidate is in the exam chamber or when inside examiner workspace
  const isExaminerWorkspace = pathname?.startsWith("/examiner");
  const isExamChamber = pathname?.startsWith("/student/exam/") && !pathname?.includes("/result");

  if (isExaminerWorkspace) {
    return <>{children}</>;
  }

  if (isExamChamber) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar user={user} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
