"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ThemeToggleProps {
  className?: string;
  variant?: "default" | "compact" | "icon-only";
}

export function ThemeToggle({ className = "", variant = "default" }: ThemeToggleProps) {
  const { theme, toggleTheme, isMounted } = useTheme();
  const { t } = useLanguage();

  const isLight = isMounted && theme === "light";
  const label = isLight
    ? t("theme.switchToDark", "Switch to Dark Mode")
    : t("theme.switchToLight", "Switch to Light Mode");

  if (variant === "icon-only") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`relative inline-flex items-center justify-center h-9 w-9 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 group ${
          isLight
            ? "bg-white/90 border-slate-200 text-amber-600 hover:text-amber-500 hover:bg-slate-50 hover:border-amber-300 shadow-xs"
            : "bg-slate-900/90 border-slate-700/80 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 hover:border-indigo-500/50 shadow-xs"
        } ${className}`}
        title={label}
        aria-label={label}
      >
        <span className="relative flex items-center justify-center">
          {isLight ? (
            <Sun className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
          ) : (
            <Moon className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
          )}
        </span>
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 group ${
          isLight
            ? "bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 shadow-xs"
            : "bg-slate-900/80 border-slate-700/60 text-slate-200 hover:text-white hover:border-indigo-500/50 hover:bg-slate-800 shadow-xs"
        } ${className}`}
        title={label}
        aria-label={label}
      >
        <span className="flex items-center justify-center">
          {isLight ? (
            <Sun className="h-3.5 w-3.5 text-amber-500 transition-transform duration-300 group-hover:rotate-45" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-indigo-400 transition-transform duration-300 group-hover:-rotate-12" />
          )}
        </span>
        <span className="text-[11px] font-medium hidden sm:inline">
          {isLight ? "Light" : "Dark"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 group ${
        isLight
          ? "bg-white/95 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
          : "bg-slate-900/90 border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 hover:bg-slate-800/90 shadow-sm"
      } ${className}`}
      title={label}
      aria-label={label}
    >
      <span
        className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
          isLight
            ? "bg-amber-100 text-amber-600 group-hover:scale-105"
            : "bg-indigo-500/20 text-indigo-400 group-hover:scale-105"
        }`}
      >
        {isLight ? (
          <Sun className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </span>
      <span className="font-medium hidden sm:inline">
        {isLight ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}
