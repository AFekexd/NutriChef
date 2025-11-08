import { useEffect, useState } from "react";
import { X, Sparkles, ChefHat } from "lucide-react";
import { Button } from "./ui/button";

import { gsap } from "gsap";
import { useTutorial } from "@/hooks/useTutorial";
import { useAuth } from "@/context/AuthContext";

const WELCOME_MODAL_KEY = "nutrichef_welcome_shown";

export function WelcomeModal() {
  const [isVisible, setIsVisible] = useState(false);
  const { startTutorial } = useTutorial();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Only show welcome modal if user is authenticated
    if (!isAuthenticated) {
      return;
    }

    // Check if welcome modal has been shown before
    const hasSeenWelcome = localStorage.getItem(WELCOME_MODAL_KEY) === "true";

    if (!hasSeenWelcome) {
      // Show welcome modal after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);

        // Animate modal entrance
        gsap.fromTo(
          ".welcome-modal-content",
          {
            scale: 0.8,
            opacity: 0,
            y: 50,
          },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "back.out(1.7)",
          }
        );
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const handleStartTutorial = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    setIsVisible(false);
    startTutorial();
  };

  const handleSkip = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="welcome-modal-content bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-400/20 to-transparent rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-400/20 to-transparent rounded-full blur-3xl -z-10" />

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
            <ChefHat className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to NutriChef!
            </h2>
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
            Your personal AI-powered nutrition assistant is ready to help you
            manage your kitchen, plan delicious meals, and achieve your health
            goals!
          </p>
        </div>

        {/* Features list */}
        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Smart Inventory
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Track ingredients with AI-powered photo scanning
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white font-bold text-sm">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                AI Recipe Generator
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Get personalized recipes based on what you have
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white font-bold text-sm">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Meal Planning & More
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Plan meals, track nutrition, and get health insights
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleStartTutorial}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Start Interactive Tutorial
          </Button>

          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 py-6 rounded-xl"
          >
            Skip for now
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          You can always restart the tutorial from the help menu
        </p>
      </div>
    </div>
  );
}
