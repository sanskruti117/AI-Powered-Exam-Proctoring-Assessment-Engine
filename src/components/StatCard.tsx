"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { SpotlightCard } from "./SpotlightCard";
import { AnimatedCounter } from "./AnimatedCounter";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  color?: "indigo" | "emerald" | "amber" | "rose" | "cyan" | "purple";
  cyberCorners?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "indigo",
  cyberCorners = true,
}: StatCardProps) {
  const colorMap = {
    indigo: {
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/25",
      text: "text-indigo-600 dark:text-indigo-400",
      hoverBorder: "group-hover:border-indigo-500/50",
      glowBg: "group-hover:bg-indigo-600",
      shadow: "group-hover:shadow-indigo-500/15",
      spotlight: "rgba(99, 102, 241, 0.22)",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/25",
      text: "text-emerald-600 dark:text-emerald-400",
      hoverBorder: "group-hover:border-emerald-500/50",
      glowBg: "group-hover:bg-emerald-600",
      shadow: "group-hover:shadow-emerald-500/15",
      spotlight: "rgba(16, 185, 129, 0.22)",
    },
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/25",
      text: "text-amber-600 dark:text-amber-400",
      hoverBorder: "group-hover:border-amber-500/50",
      glowBg: "group-hover:bg-amber-600",
      shadow: "group-hover:shadow-amber-500/15",
      spotlight: "rgba(245, 158, 11, 0.22)",
    },
    rose: {
      bg: "bg-rose-500/10",
      border: "border-rose-500/25",
      text: "text-rose-600 dark:text-rose-400",
      hoverBorder: "group-hover:border-rose-500/50",
      glowBg: "group-hover:bg-rose-600",
      shadow: "group-hover:shadow-rose-500/15",
      spotlight: "rgba(244, 63, 94, 0.22)",
    },
    cyan: {
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/25",
      text: "text-cyan-600 dark:text-cyan-400",
      hoverBorder: "group-hover:border-cyan-500/50",
      glowBg: "group-hover:bg-cyan-600",
      shadow: "group-hover:shadow-cyan-500/15",
      spotlight: "rgba(6, 182, 212, 0.22)",
    },
    purple: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/25",
      text: "text-purple-600 dark:text-purple-400",
      hoverBorder: "group-hover:border-purple-500/50",
      glowBg: "group-hover:bg-purple-600",
      shadow: "group-hover:shadow-purple-500/15",
      spotlight: "rgba(168, 85, 247, 0.22)",
    },
  };

  const currentTheme = colorMap[color] || colorMap.indigo;

  return (
    <SpotlightCard
      glowColor={currentTheme.spotlight}
      cyberCorners={cyberCorners}
      className={`group rounded-2xl p-7 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-2xl ${currentTheme.hoverBorder} ${currentTheme.shadow}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
            {title}
          </p>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2 group-hover:scale-[1.03] transition-transform origin-left font-mono">
            <AnimatedCounter value={value} />
          </p>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`h-14 w-14 rounded-2xl ${currentTheme.bg} ${currentTheme.border} border flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${currentTheme.glowBg} group-hover:text-white group-hover:shadow-lg`}
        >
          <Icon className={`h-7 w-7 ${currentTheme.text} group-hover:text-white transition-colors`} />
        </div>
      </div>
    </SpotlightCard>
  );
}
