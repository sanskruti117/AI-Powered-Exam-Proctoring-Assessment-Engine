"use client";

import React, { ReactNode } from "react";

interface CyberFrameProps {
  children: ReactNode;
  className?: string;
  variant?: "indigo" | "emerald" | "rose" | "cyan";
  badgeText?: string;
  activeScan?: boolean;
}

export function CyberFrame({
  children,
  className = "",
  variant = "indigo",
  badgeText,
  activeScan = false,
}: CyberFrameProps) {
  const colorMap = {
    indigo: {
      bracket: "border-indigo-500/60",
      badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      dot: "bg-indigo-400",
    },
    emerald: {
      bracket: "border-emerald-500/60",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      dot: "bg-emerald-400",
    },
    rose: {
      bracket: "border-rose-500/60",
      badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      dot: "bg-rose-400",
    },
    cyan: {
      bracket: "border-cyan-500/60",
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      dot: "bg-cyan-400",
    },
  };

  const theme = colorMap[variant] || colorMap.indigo;

  return (
    <div className={`relative ${activeScan ? "scanline" : ""} ${className}`}>
      {/* Top Left Bracket */}
      <div className={`pointer-events-none absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 ${theme.bracket} z-20`} />
      {/* Top Right Bracket */}
      <div className={`pointer-events-none absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 ${theme.bracket} z-20`} />
      {/* Bottom Left Bracket */}
      <div className={`pointer-events-none absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 ${theme.bracket} z-20`} />
      {/* Bottom Right Bracket */}
      <div className={`pointer-events-none absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 ${theme.bracket} z-20`} />

      {/* Optional Tactical HUD Badge */}
      {badgeText && (
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border backdrop-blur-md flex items-center gap-1.5 ${theme.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${theme.dot} animate-pulse`} />
            {badgeText}
          </span>
        </div>
      )}

      {children}
    </div>
  );
}
