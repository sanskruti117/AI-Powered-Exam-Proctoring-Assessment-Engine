"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "card" | "text" | "circle" | "table-row";
}

export function Skeleton({ className = "", variant = "text" }: SkeletonProps) {
  const baseClasses = "relative overflow-hidden bg-slate-800/60 rounded";

  const shimmerEffect = (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
  );

  if (variant === "circle") {
    return (
      <div className={`${baseClasses} rounded-full ${className}`}>
        {shimmerEffect}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`glass-card rounded-2xl p-6 relative overflow-hidden border border-slate-800 ${className}`}>
        {shimmerEffect}
        <div className="space-y-3">
          <div className="h-4 bg-slate-800/80 rounded w-1/3" />
          <div className="h-8 bg-slate-800 rounded w-1/2" />
          <div className="h-3 bg-slate-800/60 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (variant === "table-row") {
    return (
      <div className={`flex items-center gap-4 py-3 px-4 border-b border-slate-800/50 ${className}`}>
        <div className="h-4 bg-slate-800 rounded w-1/4 relative overflow-hidden">{shimmerEffect}</div>
        <div className="h-4 bg-slate-800 rounded w-1/3 relative overflow-hidden">{shimmerEffect}</div>
        <div className="h-4 bg-slate-800 rounded w-1/6 relative overflow-hidden">{shimmerEffect}</div>
        <div className="h-4 bg-slate-800 rounded w-1/5 relative overflow-hidden">{shimmerEffect}</div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`}>
      {shimmerEffect}
    </div>
  );
}
