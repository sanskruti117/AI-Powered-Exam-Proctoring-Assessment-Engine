"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRejectionReason(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || data.error || "Failed to sign in. Please verify your credentials.");
        if (data.rejectionReason) {
          setRejectionReason(data.rejectionReason);
        }
        return;
      }

      if (data.status === "PENDING" || data.redirectTo === "/pending-approval") {
        router.push("/pending-approval");
        return;
      }

      router.push(data.redirectTo || "/student");
      router.refresh();
    } catch (err: any) {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />

      {/* Header / Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Proctor<span className="text-indigo-400">AI</span>
          </span>
        </Link>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Sign In to Your Account
        </h2>
        <p className="mt-2.5 text-base text-slate-400">
          Enter your credentials to access the proctoring portal
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="glass-card rounded-2xl p-8 sm:p-10 border border-slate-800 shadow-2xl relative">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex flex-col gap-2 animate-fadeIn">
              <div className="flex items-center gap-2.5 font-medium text-base">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
              {rejectionReason && (
                <div className="text-sm text-rose-300 pl-7 bg-rose-950/40 p-3 rounded-lg border border-rose-800/40">
                  <span className="font-semibold">Reason: </span>
                  {rejectionReason}
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Email Address
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  className="block w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-base text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-200">
                  Password
                </label>
              </div>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-base text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl font-semibold text-base text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Portal"}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          {/* Registration Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-3">
            <p className="text-sm text-slate-400">
              Student candidate?{" "}
              <Link href="/register/student" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
                Create Student Account
              </Link>
            </p>
            <p className="text-sm text-slate-400">
              Faculty / Examiner?{" "}
              <Link href="/register/examiner" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
                Request Examiner Privileges
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
