import React from "react";
import { getCurrentUser } from "@/lib/session";
import { ExaminerLayoutWrapper } from "@/components/ExaminerLayoutWrapper";

export default async function ExaminerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ExaminerLayoutWrapper>{children}</ExaminerLayoutWrapper>;
}
