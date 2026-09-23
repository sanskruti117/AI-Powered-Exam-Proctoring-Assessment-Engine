"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { SUPPORTED_LANGUAGES, SupportedLanguage } from "@/lib/i18n/translations";

interface LanguageSelectorProps {
  className?: string;
  variant?: "default" | "compact" | "exam";
}

export function LanguageSelector({ className = "", variant = "default" }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === "compact") {
    return (
      <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs font-semibold text-slate-200 hover:text-white hover:border-indigo-500/50 hover:bg-slate-800 transition-all shadow-sm"
          title="Select Language"
        >
          <Globe className="h-3.5 w-3.5 text-indigo-400" />
          <span>{currentLang.nativeName}</span>
          <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/80 py-1.5 z-50 backdrop-blur-xl">
            <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-800">
              Select Language
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                    language === lang.code
                      ? "bg-indigo-600/20 text-indigo-300 font-bold"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-100">{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400">{lang.name}</span>
                  </div>
                  {language === lang.code && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-sm font-semibold text-slate-200 hover:text-white hover:border-slate-700 hover:bg-slate-800/90 transition-all shadow-sm group"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="h-6 w-6 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 group-hover:scale-105 transition-transform">
          <Globe className="h-3.5 w-3.5" />
        </div>
        <span className="font-medium">{currentLang.nativeName}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl shadow-black/80 py-2 z-50 backdrop-blur-xl">
          <div className="px-3.5 py-1.5 text-[11px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-800/80 mb-1">
            Regional Language / भाषा
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 divide-y divide-slate-800/30">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left transition-colors ${
                  language === lang.code
                    ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-slate-100">{lang.nativeName}</span>
                  <span className="text-xs text-slate-400">{lang.name}</span>
                </div>
                {language === lang.code && (
                  <div className="h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-indigo-400" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

