"use client";

import React, { useState } from "react";
import { Cpu, ShieldCheck, Globe, Zap, CheckCircle, Award } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function InteractiveStatsSection() {
  const { t } = useLanguage();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const stats = [
    {
      icon: ShieldCheck,
      value: "99.8%",
      label: "AI Detection Accuracy",
      desc: "Instant flagging of secondary devices, face absence, and window switches.",
      color: "emerald",
      badge: "Verified",
    },
    {
      icon: Zap,
      value: "< 45ms",
      label: "Real-time Telemetry",
      desc: "Sub-50ms latency client-side neural vision and biometric reticle tracking.",
      color: "indigo",
      badge: "High-Speed",
    },
    {
      icon: Globe,
      value: "6 Languages",
      label: "Multilingual Engine",
      desc: "Native support for English, Hindi, Marathi, Telugu, Tamil, and Malayalam.",
      color: "purple",
      badge: "Regional",
    },
    {
      icon: Cpu,
      value: "100%",
      label: "Automated Evaluation",
      desc: "Zero-wait auto-grading for Code submissions, MCQs, and AI-assisted marking.",
      color: "amber",
      badge: "Auto Grade",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Engineered for High-Stakes Institutional Reliability
        </h2>
        <p className="text-sm sm:text-base text-slate-400">
          Industry-leading performance benchmarks delivering uncompromising academic integrity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`glass-card-interactive rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between ${
                isHovered
                  ? "border-indigo-400/50 bg-slate-900/90 -translate-y-2 shadow-xl shadow-indigo-950/50"
                  : "border-slate-800/80 bg-slate-900/60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 ${
                      isHovered ? "scale-110 bg-indigo-600 text-white" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                    {item.badge}
                  </span>
                </div>

                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                  {item.value}
                </div>
                <div className="text-sm font-bold text-slate-200 mb-2">
                  {item.label}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-indigo-400 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Active in Examination Engine</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
