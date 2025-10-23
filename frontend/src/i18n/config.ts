import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import hu from "./locales/hu.json";
import { store } from "../store";

// Get initial language from Redux store
const getInitialLanguage = () => {
  const state = store.getState();
  return state.language.language || "en";
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hu: { translation: hu },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

// Subscribe to Redux store changes for language
store.subscribe(() => {
  const state = store.getState();
  const currentLanguage = state.language.language;
  if (i18n.language !== currentLanguage) {
    i18n.changeLanguage(currentLanguage);
  }
});

export default i18n;
