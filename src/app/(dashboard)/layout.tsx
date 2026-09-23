import { getCurrentUser } from "@/lib/session";
import { DashboardLayoutWrapper } from "@/components/DashboardLayoutWrapper";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();

  if (!session) {
    redirect("/login");
  }

  return <DashboardLayoutWrapper user={session}>{children}</DashboardLayoutWrapper>;
}

