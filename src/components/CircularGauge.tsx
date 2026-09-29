"use client";

import React, { useEffect, useState } from "react";

interface CircularGaugeProps {
  percentage: number; // 0 to 100
  size?: number; // size in px
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: "indigo" | "emerald" | "amber" | "rose" | "cyan";
  showValue?: boolean;
}

export function CircularGauge({
  percentage,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  color = "indigo",
  showValue = true,
}: CircularGaugeProps) {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentProgress(Math.min(Math.max(percentage, 0), 100));
    }, 150);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentProgress / 100) * circumference;

  const colorMap = {
    indigo: {
      stroke: "#6366f1",
      glow: "rgba(99, 102, 241, 0.4)",
      text: "text-indigo-400",
    },
    emerald: {
      stroke: "#10b981",
      glow: "rgba(16, 185, 129, 0.4)",
      text: "text-emerald-400",
    },
    amber: {
      stroke: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.4)",
      text: "text-amber-400",
    },
    rose: {
      stroke: "#f43f5e",
      glow: "rgba(244, 63, 94, 0.4)",
      text: "text-rose-400",
    },
    cyan: {
      stroke: "#06b6d4",
      glow: "rgba(6, 182, 212, 0.4)",
      text: "text-cyan-400",
    },
  };

  const activeColor = colorMap[color] || colorMap.indigo;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="w-full h-full -rotate-90 transform"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-800/80"
            fill="transparent"
          />
          {/* Animated active stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={activeColor.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
              filter: `drop-shadow(0 0 6px ${activeColor.glow})`,
            }}
          />
        </svg>

        {/* Center label */}
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight text-white`}>
              {Math.round(currentProgress)}%
            </span>
            {sublabel && (
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {sublabel}
              </span>
            )}
          </div>
        )}
      </div>

      {label && (
        <span className="mt-2 text-xs font-semibold text-slate-300 text-center">
          {label}
        </span>
      )}
    </div>
  );
}
