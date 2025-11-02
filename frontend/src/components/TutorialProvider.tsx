import React from "react";
import { useLocation } from "react-router-dom";
import { TutorialOverlay, getTutorialSteps } from "./Tutorial";
import { useTutorial } from "@/hooks/useTutorial";

interface TutorialProviderProps {
  children: React.ReactNode;
}

// Map routes to tutorial pages
const routeToTutorialMap: Record<string, string> = {
  "/dashboard": "dashboard",
  "/inventory": "inventory",
  "/recipes": "recipes",
  "/recipe-recommendations": "recipes",
  "/meal-planning": "meal-planning",
  "/nutrition": "nutrition",
  "/health-insights": "health-insights",
  "/profile": "profile",
};

export function TutorialProvider({ children }: TutorialProviderProps) {
  const location = useLocation();
  const { isTutorialActive, completeTutorial, skipTutorial } = useTutorial();

  // Get tutorial steps for current route
  const getTutorialForRoute = () => {
    const tutorialPage = routeToTutorialMap[location.pathname];
    if (!tutorialPage) return [];

    // Add navigation tutorial steps if on any main page
    if (isTutorialActive && tutorialPage === "dashboard") {
      // Combine dashboard and navigation tutorials for first-time users
      return [
        ...getTutorialSteps("dashboard"),
        ...getTutorialSteps("navigation"),
      ];
    }

    return getTutorialSteps(tutorialPage);
  };

  const steps = getTutorialForRoute();

  return (
    <>
      {children}
      {steps.length > 0 && (
        <TutorialOverlay
          steps={steps}
          isActive={isTutorialActive}
          onComplete={completeTutorial}
          onSkip={skipTutorial}
        />
      )}
    </>
  );
}
