import translationData from "./all_translations.json";

export type SupportedLanguage = "en" | "hi" | "mr" | "ml" | "te" | "ta";

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

// Keep this list aligned with the language catalogs and the language picker.
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "\u0939\u093f\u0928\u094d\u0926\u0940" },
  { code: "mr", name: "Marathi", nativeName: "\u092e\u0930\u093e\u0920\u0940" },
  { code: "ml", name: "Malayalam", nativeName: "\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02" },
  { code: "te", name: "Telugu", nativeName: "\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41" },
  { code: "ta", name: "Tamil", nativeName: "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd" },
];

export const translations = translationData as Record<
  SupportedLanguage,
  Record<string, any>
>;
