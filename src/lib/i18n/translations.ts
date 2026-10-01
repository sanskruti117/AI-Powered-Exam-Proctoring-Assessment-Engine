import translationData from "./all_translations.json";

export type SupportedLanguage = "en" | "hi" | "mr" | "ml" | "te" | "ta" | "kn" | "bn" | "gu";

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

// Keep this list aligned with the language catalogs and the language picker.
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
];

export const translations = translationData as Record<
  SupportedLanguage,
  Record<string, any>
>;
