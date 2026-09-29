import { Navbar } from "@/components/Navbar";
import { getCurrentUser } from "@/lib/session";
import { LandingView } from "@/components/LandingView";

export default async function HomePage() {
  const session = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar user={session} />
      <LandingView session={session} />
    </div>
  );
}
