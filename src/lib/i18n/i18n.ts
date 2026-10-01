import i18next, { Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import { SUPPORTED_LANGUAGES, translations } from "./translations";

const resources = Object.fromEntries(
  SUPPORTED_LANGUAGES.map(({ code }) => [code, { translation: translations[code] }]),
) as Resource;

if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map(({ code }) => code),
    defaultNS: "translation",
    keySeparator: ".",
    returnNull: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18next;
