"use client";

import React, { useState, useEffect } from "react";
import { Download, Check, Sparkles, X, Share } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PWAInstallButtonProps {
  className?: string;
  variant?: "default" | "compact" | "mobile";
}

export function PWAInstallButton({ className = "", variant = "default" }: PWAInstallButtonProps) {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isWindowStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isNavStandalone = (navigator as any).standalone === true;
      setIsStandalone(isWindowStandalone || isNavStandalone);
    };

    checkStandalone();

    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // If browser doesn't support beforeinstallprompt yet
      setShowIOSModal(true);
    }
  };

  if (isStandalone) {
    if (variant === "compact") {
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-semibold ${className}`}
          title="App is already installed and operating in Standalone Mode"
        >
          <Check className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Installed</span>
        </div>
      );
    }
    return (
      <div
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-semibold ${className}`}
        title="App is already installed"
      >
        <Check className="h-4 w-4" />
        <span>Installed</span>
      </div>
    );
  }

  return (
    <>
      {variant === "compact" && (
        <button
          type="button"
          onClick={handleInstall}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/15 border border-indigo-500/40 text-xs font-semibold text-indigo-300 hover:text-white hover:bg-indigo-600/30 hover:border-indigo-400 transition-all shadow-sm group ${className}`}
          title="Install AI Proctor App"
        >
          <Download className="h-3.5 w-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>{t("pwa.install", "Install App")}</span>
        </button>
      )}

      {variant === "default" && (
        <button
          type="button"
          onClick={handleInstall}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600/15 border border-indigo-500/40 text-sm font-semibold text-indigo-300 hover:text-white hover:bg-indigo-600/30 hover:border-indigo-400 transition-all shadow-sm group ${className}`}
          title="Install AI Proctor App"
        >
          <div className="h-6 w-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 group-hover:scale-110 transition-transform">
            <Download className="h-3.5 w-3.5" />
          </div>
          <span>{t("pwa.installApp", "Install App")}</span>
        </button>
      )}

      {variant === "mobile" && (
        <button
          type="button"
          onClick={handleInstall}
          className={`w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all ${className}`}
        >
          <Download className="h-4 w-4" />
          <span>{t("pwa.installApp", "Install AI Proctor App")}</span>
        </button>
      )}

      {/* Manual / iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full p-6 text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4">
              <Sparkles className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Install AI Proctor</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Install the app directly to your home screen or desktop for a fullscreen, low-latency examination environment.
            </p>

            <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                  1
                </span>
                <p className="text-slate-300">
                  {isIOS
                    ? "Tap the Share icon in Safari (bottom navigation bar)."
                    : "Open your browser menu (three dots in top-right)."}
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                  2
                </span>
                <p className="text-slate-300">
                  Select <strong className="text-white">&quot;Add to Home Screen&quot;</strong> or <strong className="text-white">&quot;Install App&quot;</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
