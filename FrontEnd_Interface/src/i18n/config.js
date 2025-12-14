// Import Dependencies
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Local Imports
import { defaultTheme } from "configs/theme.config";
import { isServer } from "utils/isServer";

// ----------------------------------------------------------------------

const getInitialLang = () => {
  if (isServer) return defaultTheme.defaultLang;
  return localStorage.getItem("i18nextLng") || defaultTheme.defaultLang;
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: 'i18nextLng',
      lookupSessionStorage: 'i18nextLng',
    },
    fallbackLng: defaultTheme.fallbackLang,
    lng: getInitialLang(),
    supportedLngs: ["en", "es", "ar", "zh-cn"],
    ns: ["translations"],
    defaultNS: "translations",
    interpolation: {
      escapeValue: false,
    },
    lowerCaseLng: true,
    debug: false,
  }).languages = ["en", "es", "ar", "zh-cn"];

export default i18n
