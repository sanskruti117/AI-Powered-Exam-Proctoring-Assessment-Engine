import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  color?: "indigo" | "emerald" | "amber" | "rose" | "cyan";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "indigo",
}: StatCardProps) {
  const colorMap = {
    indigo: {
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/25",
      text: "text-indigo-400",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/25",
      text: "text-emerald-400",
    },
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/25",
      text: "text-amber-400",
    },
    rose: {
      bg: "bg-rose-500/10",
      border: "border-rose-500/25",
      text: "text-rose-400",
    },
    cyan: {
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/25",
      text: "text-cyan-400",
    },
  };

  const currentTheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="glass-card rounded-2xl p-7 relative overflow-hidden transition-all duration-200 hover:border-slate-700">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-400 tracking-wide">{title}</p>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">{value}</p>
          {subtitle && <p className="text-xs sm:text-sm text-slate-400 mt-1.5">{subtitle}</p>}
        </div>
        <div className={`h-14 w-14 rounded-2xl ${currentTheme.bg} ${currentTheme.border} border flex items-center justify-center shrink-0`}>
          <Icon className={`h-7 w-7 ${currentTheme.text}`} />
        </div>
      </div>
    </div>
  );
}
