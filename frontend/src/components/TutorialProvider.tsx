import React from "react";
// Tutorial disabled for now
// import { useLocation } from "react-router-dom";
// import { TutorialOverlay, getTutorialSteps } from "./Tutorial";
// import { useTutorial } from "@/hooks/useTutorial";

interface TutorialProviderProps {
  children: React.ReactNode;
}

// Tutorial disabled - just render children without overlay
export function TutorialProvider({ children }: TutorialProviderProps) {
  return <>{children}</>;
}
