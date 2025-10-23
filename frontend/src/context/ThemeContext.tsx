import React, { createContext, useContext, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import {
  setTheme as setThemeAction,
  toggleTheme as toggleThemeAction,
} from "../store/slices/themeSlice";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    dispatch(toggleThemeAction());
  };

  const setTheme = (newTheme: Theme) => {
    dispatch(setThemeAction(newTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
