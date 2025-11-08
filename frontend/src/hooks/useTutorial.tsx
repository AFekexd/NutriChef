import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

const TUTORIAL_STORAGE_KEY = "nutrichef_tutorial_completed";
const TUTORIAL_DISMISSED_KEY = "nutrichef_tutorial_dismissed";

interface TutorialContextType {
  isTutorialActive: boolean;
  hasCompletedTutorial: boolean;
  startTutorial: () => void;
  completeTutorial: () => void;
  skipTutorial: () => void;
  resetTutorial: () => void;
  isAuthenticatedUser: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(
  undefined
);

export function TutorialContextProvider({ children }: { children: ReactNode }) {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if we're on a protected route (not login/register)
    const isProtectedRoute =
      location.pathname !== "/login" &&
      location.pathname !== "/register" &&
      location.pathname !== "/auth/callback";

    setIsAuthenticatedUser(isProtectedRoute);

    // Check if user has completed or dismissed the tutorial
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
    const dismissed = localStorage.getItem(TUTORIAL_DISMISSED_KEY) === "true";

    setHasCompletedTutorial(completed);

    // Auto-start tutorial on dashboard for first-time authenticated users
    if (
      isProtectedRoute &&
      !completed &&
      !dismissed &&
      location.pathname === "/dashboard"
    ) {
      // Small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        setIsTutorialActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const startTutorial = () => {
    setIsTutorialActive(true);
  };

  const completeTutorial = () => {
    setIsTutorialActive(false);
    setHasCompletedTutorial(true);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    localStorage.removeItem(TUTORIAL_DISMISSED_KEY);
  };

  const skipTutorial = () => {
    setIsTutorialActive(false);
    localStorage.setItem(TUTORIAL_DISMISSED_KEY, "true");
  };

  const resetTutorial = () => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    localStorage.removeItem(TUTORIAL_DISMISSED_KEY);
    setHasCompletedTutorial(false);
  };

  const value = {
    isTutorialActive,
    hasCompletedTutorial,
    startTutorial,
    completeTutorial,
    skipTutorial,
    resetTutorial,
    isAuthenticatedUser,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error(
      "useTutorial must be used within a TutorialContextProvider"
    );
  }
  return context;
}
