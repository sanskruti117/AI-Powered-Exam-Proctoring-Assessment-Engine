import Link from "next/link";
import { ShieldAlert, Home, LogIn } from "lucide-react";

export default function UnauthorizedPage({
  searchParams,
}: {
  searchParams?: { reason?: string };
}) {
  const reason = searchParams?.reason;

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
    <div className="min-h-screen flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Rose Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-rose-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-500/10">
          <ShieldAlert className="h-9 w-9" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          {title}
        </h2>
        <p className="mt-3 text-base text-slate-400 max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card rounded-2xl p-8 sm:p-10 border border-slate-800 shadow-2xl relative space-y-6">
          <div className="text-sm text-slate-300 bg-slate-900/90 p-4 rounded-xl border border-slate-800 leading-relaxed">
            <span className="font-bold text-rose-400">Security Policy: </span>
            Role-Based Access Control ensures that Students, Examiners, and Administrators operate strictly within their authorized assessment chambers.
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl font-semibold text-base text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25"
            >
              <Home className="h-5 w-5" />
              <span>Return to Homepage</span>
            </Link>
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl font-semibold text-sm text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In with a Different Account</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
