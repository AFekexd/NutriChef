import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, Languages } from "lucide-react";

const SettingsMenu: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Language Toggle */}
      <div className="relative group">
        <button
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={t("language.toggle")}
        >
          <Languages className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <button
            onClick={() => changeLanguage("en")}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors ${
              i18n.language === "en"
                ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {t("language.english")}
          </button>
          <button
            onClick={() => changeLanguage("hu")}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors ${
              i18n.language === "hu"
                ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {t("language.hungarian")}
          </button>
        </div>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={t("theme.toggle")}
      >
        {theme === "light" ? (
          <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        )}
      </button>
    </div>
  );
};

export default SettingsMenu;
