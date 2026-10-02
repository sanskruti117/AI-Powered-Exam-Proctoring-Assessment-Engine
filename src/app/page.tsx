import { Navbar } from "@/components/Navbar";
import { getCurrentUser } from "@/lib/session";
import { LandingView } from "@/components/LandingView";

export default async function HomePage() {
  const session = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar user={session} />
      <LandingView session={session} />
    </div>
  );
}
