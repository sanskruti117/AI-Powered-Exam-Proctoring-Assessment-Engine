"use client";

import React, { useState } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Smartphone,
  Users,
  Maximize2,
  Volume2,
  RefreshCw,
  Activity,
  Cpu,
  Radio,
  Zap,
} from "lucide-react";
import { CircularGauge } from "./CircularGauge";

type SimState = "normal" | "phone" | "multiface" | "tabswitch" | "audio";

interface EventLogItem {
  id: string;
  time: string;
  type: string;
  severity: "low" | "medium" | "high" | "safe";
  message: string;
}

export function InteractiveProctorSimulator() {
  const [activeSim, setActiveSim] = useState<SimState>("normal");
  const [integrityScore, setIntegrityScore] = useState(99.4);
  const [logs, setLogs] = useState<EventLogItem[]>([
    {
      id: "1",
      time: "10:02:14",
      type: "AI_GAZE_CALIBRATED",
      severity: "safe",
      message: "Biometric reticle verified. Single candidate in active viewport.",
    },
  ]);

  const triggerSim = (type: SimState) => {
    setActiveSim(type);
    const now = new Date().toLocaleTimeString();

    if (type === "normal") {
      setIntegrityScore(99.8);
      setLogs((prev) => [
        {
          id: Math.random().toString(),
          time: now,
          type: "GAZE_RE-CENTERED",
          severity: "safe",
          message: "Candidate focus restored to primary exam viewport.",
        },
        ...prev.slice(0, 4),
      ]);
    } else if (type === "phone") {
      setIntegrityScore(78.5);
      setLogs((prev) => [
        {
          id: Math.random().toString(),
          time: now,
          type: "OBJECT_DETECTED",
          severity: "high",
          message: "Secondary mobile device detected in candidate right quadrant.",
        },
        ...prev.slice(0, 4),
      ]);
    } else if (type === "multiface") {
      setIntegrityScore(62.0);
      setLogs((prev) => [
        {
          id: Math.random().toString(),
          time: now,
          type: "MULTI_FACE_FLAG",
          severity: "high",
          message: "Unauthorized secondary individual identified in background frame.",
        },
        ...prev.slice(0, 4),
      ]);
    } else if (type === "tabswitch") {
      setIntegrityScore(84.2);
      setLogs((prev) => [
        {
          id: Math.random().toString(),
          time: now,
          type: "FOCUS_LOST",
          severity: "medium",
          message: "Candidate switched browser window / lost window active focus.",
        },
        ...prev.slice(0, 4),
      ]);
    } else if (type === "audio") {
      setIntegrityScore(89.0);
      setLogs((prev) => [
        {
          id: Math.random().toString(),
          time: now,
          type: "AUDIO_ANOMALY",
          severity: "low",
          message: "Ambient conversation noise spike detected (>45dB threshold).",
        },
        ...prev.slice(0, 4),
      ]);
    }
  };

  const isAnomaly = activeSim === "phone" || activeSim === "multiface";

  return (
    <div
      className={`w-full max-w-5xl mx-auto rounded-3xl bg-white/90 dark:bg-slate-900/90 border backdrop-blur-2xl shadow-2xl transition-all duration-500 overflow-hidden relative group ${
        isAnomaly
          ? "border-rose-500/60 shadow-rose-950/30 dark:shadow-rose-950/60 animate-hazard-pulse"
          : "border-indigo-500/30 shadow-indigo-950/20 dark:shadow-indigo-950/60"
      }`}
    >
      {/* Top Header Bar */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full animate-ping ${
                isAnomaly ? "bg-rose-500" : "bg-emerald-500"
              }`}
            />
            <span
              className={`w-3 h-3 rounded-full absolute ${
                isAnomaly ? "bg-rose-500" : "bg-emerald-500"
              }`}
            />
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-600 dark:text-slate-300">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">AI_PROCTOR_CORE</span>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <span className="text-emerald-600 dark:text-emerald-400">FPS: 30.0</span>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <span className="text-slate-500 dark:text-slate-400">LATENCY: 32ms</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Integrity Score Badge */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Integrity:</span>
            <span
              className={`text-xs font-bold font-mono ${
                integrityScore > 90
                  ? "text-emerald-600 dark:text-emerald-400"
                  : integrityScore > 75
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {integrityScore.toFixed(1)}%
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-300 font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-500 dark:text-indigo-400" />
            <span>LIVE INTERACTIVE SIMULATOR</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Viewport: Simulated AI Vision Camera */}
        <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between relative bg-slate-100/50 dark:bg-slate-950/60 overflow-hidden">
          {/* Ambient Scanner & Grid */}
          <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none" />
          <div className="scanline absolute inset-0 pointer-events-none" />

          {/* Simulated Candidate Frame */}
          <div className="relative aspect-video w-full rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
            {/* Corner Bracket Reticle */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-indigo-400" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-indigo-400" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-indigo-400" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-indigo-400" />

            {/* Face Box Simulation */}
            <div
              className={`relative w-44 h-48 rounded-2xl border-2 transition-all duration-500 flex flex-col items-center justify-center ${
                activeSim === "normal"
                  ? "border-emerald-400/80 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                  : activeSim === "phone"
                  ? "border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20"
                  : activeSim === "multiface"
                  ? "border-rose-500 bg-rose-500/15 shadow-lg shadow-rose-500/30"
                  : activeSim === "tabswitch"
                  ? "border-purple-400 bg-purple-500/10 opacity-40 scale-95"
                  : "border-cyan-400 bg-cyan-500/10"
              }`}
            >
              {/* Eye Tracking Reticles */}
              <div className="flex items-center gap-6 mb-3">
                <div
                  className={`w-3.5 h-3.5 rounded-full border border-indigo-400 flex items-center justify-center ${
                    activeSim === "normal" ? "bg-emerald-400" : "bg-rose-400 animate-ping"
                  }`}
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                <div
                  className={`w-3.5 h-3.5 rounded-full border border-indigo-400 flex items-center justify-center ${
                    activeSim === "normal" ? "bg-emerald-400" : "bg-rose-400 animate-ping"
                  }`}
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </div>

              {/* Status Text Overlay in Face Box */}
              <div className="text-center font-mono text-[11px] font-bold tracking-wider">
                {activeSim === "normal" && (
                  <span className="text-emerald-300">CANDIDATE #1 [SECURE]</span>
                )}
                {activeSim === "phone" && (
                  <span className="text-amber-300 animate-pulse">DEVICE DETECTED</span>
                )}
                {activeSim === "multiface" && (
                  <span className="text-rose-300 animate-pulse">SECONDARY PERSON</span>
                )}
                {activeSim === "tabswitch" && (
                  <span className="text-purple-300">FOCUS UNLOCKED</span>
                )}
                {activeSim === "audio" && (
                  <span className="text-cyan-300">AUDIO SPIKE DETECTED</span>
                )}
              </div>

              {/* Landmark Dots */}
              <div className="mt-2 flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/80" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/80" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/80" />
              </div>
            </div>

            {/* Secondary Face Box if Multi-Face Triggered */}
            {activeSim === "multiface" && (
              <div className="absolute right-8 top-10 w-28 h-32 rounded-xl border-2 border-rose-500 bg-rose-950/60 flex flex-col items-center justify-center animate-bounce">
                <Users className="w-6 h-6 text-rose-400 mb-1" />
                <span className="text-[9px] font-mono font-bold text-rose-300">UNREGISTERED</span>
              </div>
            )}

            {/* Secondary Device Box if Phone Triggered */}
            {activeSim === "phone" && (
              <div className="absolute right-10 bottom-6 w-20 h-28 rounded-xl border-2 border-amber-400 bg-amber-950/60 flex flex-col items-center justify-center animate-pulse">
                <Smartphone className="w-6 h-6 text-amber-300 mb-1" />
                <span className="text-[9px] font-mono font-bold text-amber-200">PHONE (94%)</span>
              </div>
            )}

            {/* Live Camera Bottom HUD Overlay */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-slate-300 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gaze Angle: 0.2° pitch, -0.4° yaw</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-400">
                <Cpu className="w-3.5 h-3.5" />
                <span>Tensor Engine: Active</span>
              </div>
            </div>
          </div>

          {/* Interactive Trigger Buttons */}
          <div className="mt-5 space-y-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Interactive Controls (Click to Test Real-Time AI Detection):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => triggerSim("normal")}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  activeSim === "normal"
                    ? "bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30"
                    : "bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                Normal State
              </button>

              <button
                type="button"
                onClick={() => triggerSim("phone")}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  activeSim === "phone"
                    ? "bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30"
                    : "bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-500/40 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
                Mobile Device
              </button>

              <button
                type="button"
                onClick={() => triggerSim("multiface")}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  activeSim === "multiface"
                    ? "bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30"
                    : "bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-500/40 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-rose-600 dark:text-rose-300" />
                Multiple Faces
              </button>

              <button
                type="button"
                onClick={() => triggerSim("tabswitch")}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  activeSim === "tabswitch"
                    ? "bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30"
                    : "bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-500/40 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
                Tab Switch
              </button>

              <button
                type="button"
                onClick={() => triggerSim("audio")}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  activeSim === "audio"
                    ? "bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30"
                    : "bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-300" />
                Noise Spike
              </button>

              <button
                type="button"
                onClick={() => triggerSim("normal")}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-600/20 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Core
              </button>
            </div>
          </div>
        </div>

        {/* Right Telemetry & Event Stream */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Real-Time Telemetry Log
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                AUDIT READY
              </span>
            </div>

            {/* Event Items */}
            <div className="space-y-2.5">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border text-xs transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
                    log.severity === "safe"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200"
                      : log.severity === "high"
                      ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-200 animate-pulse"
                      : log.severity === "medium"
                      ? "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50 text-purple-800 dark:text-purple-200"
                      : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px] mb-1 opacity-80">
                    <span className="font-bold">{log.type}</span>
                    <span>{log.time}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-95">{log.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Security Assurance & Circular Trust Gauge */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div>
              <span className="block font-medium text-slate-800 dark:text-slate-300">Automated AI Evidence Snapshots</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">100% Cryptographic Audit</span>
            </div>
            <div className="shrink-0">
              <CircularGauge
                percentage={integrityScore}
                size={54}
                strokeWidth={5}
                showValue={false}
                color={integrityScore > 90 ? "emerald" : integrityScore > 75 ? "amber" : "rose"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
