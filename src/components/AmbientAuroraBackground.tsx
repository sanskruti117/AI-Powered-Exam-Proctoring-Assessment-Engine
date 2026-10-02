"use client";

import React from "react";

interface AmbientAuroraBackgroundProps {
  intensity?: "subtle" | "medium" | "vibrant";
  variant?: "indigo-cyan" | "emerald-indigo" | "rose-indigo";
}

export function AmbientAuroraBackground({
  intensity = "subtle",
  variant = "indigo-cyan",
}: AmbientAuroraBackgroundProps) {
  const opacityMap = {
    subtle: "opacity-15 dark:opacity-30",
    medium: "opacity-25 dark:opacity-45",
    vibrant: "opacity-35 dark:opacity-60",
  };

  const currentOpacity = opacityMap[intensity];

  return (
    <div className={`pointer-events-none fixed inset-0 overflow-hidden ${currentOpacity} -z-10`}>
      {/* Orb 1: Top Left / Center */}
      {variant === "indigo-cyan" && (
        <>
          <div className="absolute -top-[15%] left-[10%] h-[550px] w-[550px] rounded-full bg-indigo-500/20 dark:bg-indigo-600/30 blur-[130px] animate-float" />
          <div className="absolute top-[35%] right-[5%] h-[480px] w-[480px] rounded-full bg-cyan-500/15 dark:bg-cyan-600/20 blur-[140px] animate-float-slow" />
          <div className="absolute bottom-[5%] left-[25%] h-[500px] w-[500px] rounded-full bg-purple-500/15 dark:bg-purple-700/25 blur-[150px] animate-float-reverse" />
        </>
      )}

      {variant === "emerald-indigo" && (
        <>
          <div className="absolute -top-[15%] left-[15%] h-[550px] w-[550px] rounded-full bg-emerald-500/15 dark:bg-emerald-600/25 blur-[130px] animate-float" />
          <div className="absolute top-[40%] right-[10%] h-[450px] w-[450px] rounded-full bg-indigo-500/15 dark:bg-indigo-600/25 blur-[140px] animate-float-slow" />
          <div className="absolute bottom-[10%] left-[30%] h-[480px] w-[480px] rounded-full bg-teal-500/15 dark:bg-teal-600/20 blur-[150px] animate-float-reverse" />
        </>
      )}

      {variant === "rose-indigo" && (
        <>
          <div className="absolute -top-[15%] left-[15%] h-[550px] w-[550px] rounded-full bg-rose-500/15 dark:bg-rose-600/25 blur-[130px] animate-float" />
          <div className="absolute top-[40%] right-[10%] h-[450px] w-[450px] rounded-full bg-indigo-500/15 dark:bg-indigo-600/25 blur-[140px] animate-float-slow" />
          <div className="absolute bottom-[10%] left-[30%] h-[480px] w-[480px] rounded-full bg-pink-500/15 dark:bg-pink-700/20 blur-[150px] animate-float-reverse" />
        </>
      )}
    </div>
  );
}
