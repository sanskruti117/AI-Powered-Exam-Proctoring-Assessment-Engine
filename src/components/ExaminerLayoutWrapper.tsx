import React from "react";
import { getCurrentUser } from "@/lib/session";
import { ExaminerHeader } from "./ExaminerHeader";
import { ExaminerSidebar } from "./ExaminerSidebar";

interface ExaminerLayoutWrapperProps {
  children: React.ReactNode;
}

export async function ExaminerLayoutWrapper({ children }: ExaminerLayoutWrapperProps) {
  const session = await getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-950">
      <ExaminerHeader user={session} />
      <div className="mx-auto flex max-w-[1720px] flex-col items-start gap-7 px-4 py-7 sm:px-7 lg:flex-row lg:gap-8 lg:px-8 lg:py-8">
        <ExaminerSidebar user={session} />
        <main className="min-w-0 flex-1 self-stretch">{children}</main>
      </div>
    </div>
  );
}
