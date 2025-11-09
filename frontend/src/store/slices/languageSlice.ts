import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface LanguageState {
  language: string;
}

// Detect browser language or use stored preference
const getInitialLanguage = (): string => {
  // First check if user has a saved preference
  const savedLanguage = localStorage.getItem("nutrichef_language");
  if (savedLanguage && (savedLanguage === "en" || savedLanguage === "hu")) {
    return savedLanguage;
  }

  // Otherwise, detect browser language
  const browserLang = navigator.language.split("-")[0]; // Get 'en' from 'en-US'

  // Check if browser language is supported
  const supportedLanguages = ["en", "hu"];
  if (supportedLanguages.includes(browserLang)) {
    return browserLang;
  }

  // Fallback to English
  return "en";
};

const initialState: LanguageState = {
  language: getInitialLanguage(),
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
      // Persist language preference to localStorage
      localStorage.setItem("nutrichef_language", action.payload);
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
