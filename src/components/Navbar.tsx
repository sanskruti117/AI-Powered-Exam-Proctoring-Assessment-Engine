"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Shield, User, LogOut, Menu, X } from "lucide-react";

interface NavbarProps {
  user?: {
    fullName: string;
    email: string;
    role: string;
    status: string;
    institution?: string | null;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Administrator
          </span>
        );
      case "EXAMINER":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            Examiner
          </span>
        );
      case "STUDENT":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Student
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
                  Proctor<span className="text-indigo-400">AI</span>
                </span>
                <span className="hidden sm:block text-xs text-slate-400 tracking-wider uppercase font-semibold">
                  Assessment Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-5">
            {user ? (
              <>
                <div className="flex items-center gap-3.5 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="h-9 w-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-base">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-slate-100 flex items-center gap-2.5">
                      <span>{user.fullName}</span>
                      {getRoleBadge(user.role)}
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-[220px]">
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* Dashboard Navigation Link */}
                {user.role === "ADMIN" && pathname !== "/admin" && (
                  <Link
                    href="/admin"
                    className="text-sm font-semibold text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl hover:bg-slate-900 transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                )}
                {user.role === "EXAMINER" && pathname !== "/examiner" && (
                  <Link
                    href="/examiner"
                    className="text-sm font-semibold text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl hover:bg-slate-900 transition-colors"
                  >
                    Examiner Portal
                  </Link>
                )}
                {user.role === "STUDENT" && pathname !== "/student" && (
                  <Link
                    href="/student"
                    className="text-sm font-semibold text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl hover:bg-slate-900 transition-colors"
                  >
                    Student Portal
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-slate-800 hover:border-rose-500/20"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <div className="flex items-center gap-3">
                  <Link
                    href="/register/student"
                    className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02]"
                  >
                    Student Registration
                  </Link>
                  <Link
                    href="/register/examiner"
                    className="text-sm font-semibold text-indigo-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-5 py-2.5 rounded-xl transition-colors"
                  >
                    Apply as Examiner
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-5 pt-3 pb-6 space-y-4">
          {user ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-slate-100">{user.fullName}</span>
                  {getRoleBadge(user.role)}
                </div>
                <div className="text-xs text-slate-400 mt-1">{user.email}</div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900"
                  >
                    Admin Dashboard
                  </Link>
                )}
                {user.role === "EXAMINER" && (
                  <Link
                    href="/examiner"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900"
                  >
                    Examiner Portal
                  </Link>
                )}
                {user.role === "STUDENT" && (
                  <Link
                    href="/student"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900"
                  >
                    Student Portal
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl text-sm font-semibold text-slate-200 bg-slate-900 border border-slate-800"
              >
                Sign In
              </Link>
              <Link
                href="/register/student"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600"
              >
                Student Registration
              </Link>
              <Link
                href="/register/examiner"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl text-sm font-semibold text-indigo-300 bg-slate-900 border border-slate-800"
              >
                Apply as Examiner
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
