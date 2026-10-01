"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, SupportedLanguage } from "./translations";
import "./i18n";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, fallback?: string) => string;
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { t: i18nextT, i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  const language =
    SUPPORTED_LANGUAGES.find(({ code }) => code === i18n.resolvedLanguage)?.code ?? "en";

  useEffect(() => {
    let initialLanguage: SupportedLanguage = "en";
    try {
      const saved = localStorage.getItem("app_language") as SupportedLanguage | null;
      if (saved && SUPPORTED_LANGUAGES.some(({ code }) => code === saved)) {
        initialLanguage = saved;
      }
    } catch {
      // Use English when browser storage is unavailable.
    }

    void i18n.changeLanguage(initialLanguage).finally(() => setIsReady(true));
  }, [i18n]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback(
    (lang: SupportedLanguage) => {
      try {
        localStorage.setItem("app_language", lang);
      } catch {
        // The selection still applies for the current page when storage is unavailable.
      }
      void i18n.changeLanguage(lang);
    },
    [i18n],
  );

  const t = useCallback(
    (path: string, fallback?: string): string => {
      const translated = i18nextT(path, { defaultValue: fallback ?? path });
      return typeof translated === "string" ? translated : fallback ?? path;
    },
    [i18nextT],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
