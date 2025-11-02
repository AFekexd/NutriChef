import { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { gsap } from "gsap";

export interface TutorialStep {
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  action?: () => void; // Optional action to perform when reaching this step
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function TutorialOverlay({
  steps,
  isActive,
  onComplete,
  onSkip,
}: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [spotlightPosition, setSpotlightPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });
  const [tooltipPosition, setTooltipPosition] = useState({
    top: 0,
    left: 0,
  });

  // Refs for animation targets
  const spotlightRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Function to update positions
  const updatePositions = () => {
    if (!isActive || !steps[currentStep]) return;

    const step = steps[currentStep];
    const element = document.querySelector(step.target) as HTMLElement;

    if (element) {
      // Get element position and dimensions
      const rect = element.getBoundingClientRect();
      const padding = 8;

      setSpotlightPosition({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Calculate tooltip position based on preferred position
      const tooltipWidth = 320;
      // Get actual tooltip height if it exists, otherwise estimate
      const tooltipActualHeight = tooltipRef.current?.offsetHeight || 300;
      const tooltipHeight = Math.min(
        tooltipActualHeight,
        window.innerHeight * 0.8
      );
      const margin = 20;
      const viewportPadding = 10;

      let top = rect.top;
      let left = rect.left;

      switch (step.position) {
        case "top":
          top = rect.top - tooltipHeight - margin;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case "bottom":
          top = rect.bottom + margin;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - margin;
          break;
        case "right":
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + margin;
          break;
        default:
          // Auto position - try bottom first, then top
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;

          if (spaceBelow >= tooltipHeight + margin + viewportPadding) {
            // Enough space below
            top = rect.bottom + margin;
          } else if (spaceAbove >= tooltipHeight + margin + viewportPadding) {
            // Enough space above
            top = rect.top - tooltipHeight - margin;
          } else if (spaceBelow > spaceAbove) {
            // More space below, but not enough - position at bottom of viewport
            top = window.innerHeight - tooltipHeight - viewportPadding;
          } else {
            // More space above - position at top of viewport
            top = viewportPadding;
          }
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
      }

      // Ensure tooltip stays within viewport horizontally
      if (left < viewportPadding) {
        left = viewportPadding;
      }
      if (left + tooltipWidth > window.innerWidth - viewportPadding) {
        left = window.innerWidth - tooltipWidth - viewportPadding;
      }

      // Ensure tooltip stays within viewport vertically
      if (top < viewportPadding) {
        top = viewportPadding;
      }
      if (top + tooltipHeight > window.innerHeight - viewportPadding) {
        top = window.innerHeight - tooltipHeight - viewportPadding;
      }

      setTooltipPosition({ top, left });
    }
  };

  // Handle window resize
  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => {
      updatePositions();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [isActive, currentStep, steps]);

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const step = steps[currentStep];

    // Execute step action if provided
    if (step.action) {
      step.action();
    }

    // Wait a bit for any navigation/rendering to complete
    const timer = setTimeout(() => {
      const element = document.querySelector(step.target) as HTMLElement;

      if (element) {
        setTargetElement(element);

        // Scroll element into view
        element.scrollIntoView({ behavior: "smooth", block: "center" });

        // Small delay to let tooltip render and get its actual height
        setTimeout(() => {
          updatePositions();
        }, 50);

        // Animate spotlight using ref
        if (spotlightRef.current) {
          gsap.fromTo(
            spotlightRef.current,
            {
              scale: 0.8,
              opacity: 0,
            },
            {
              scale: 1,
              opacity: 1,
              duration: 0.3,
              ease: "back.out(1.7)",
            }
          );
        }

        // Animate tooltip using ref
        if (tooltipRef.current) {
          gsap.fromTo(
            tooltipRef.current,
            {
              scale: 0.9,
              opacity: 0,
              y: 20,
            },
            {
              scale: 1,
              opacity: 1,
              y: 0,
              duration: 0.3,
              ease: "back.out(1.7)",
              delay: 0.1,
            }
          );
        }

        // Add pulse animation to highlighted element
        element.classList.add("tutorial-highlight");
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (targetElement) {
        targetElement.classList.remove("tutorial-highlight");
      }
    };
  }, [currentStep, isActive, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isActive || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      {/* Dark backdrop with cutout for spotlight */}
      <div className="fixed inset-0 z-[9999]">
        <svg className="absolute inset-0 w-full h-full pointer-events-auto">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={spotlightPosition.left}
                y={spotlightPosition.top}
                width={spotlightPosition.width}
                height={spotlightPosition.height}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
            onClick={onSkip}
          />
        </svg>
      </div>

      {/* Spotlight border - animated ring */}
      <div
        ref={spotlightRef}
        className="fixed border-4 border-green-500 rounded-xl pointer-events-none animate-pulse z-[10000]"
        style={{
          top: spotlightPosition.top,
          left: spotlightPosition.left,
          width: spotlightPosition.width,
          height: spotlightPosition.height,
          boxShadow:
            "0 0 0 4px rgba(34, 197, 94, 0.2), 0 0 30px rgba(34, 197, 94, 0.3)",
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 overflow-hidden z-[10001] max-w-md"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,

          maxHeight: "min(400px, 80vh)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step counter */}
        <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">
          Step {currentStep + 1} of {steps.length}
        </div>

        {/* Scrollable Content */}
        <div
          className="overflow-y-auto max-h-[calc(80vh-200px)] pr-2"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(156, 163, 175, 0.5) transparent",
          }}
        >
          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 pr-6">
            {step.title}
          </h3>

          {/* Content */}
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {step.content}
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={onSkip}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Skip Tutorial
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            {isLastStep ? "Finish" : "Next"}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CSS for pulse animation and scrollbar styling */}
      <style>{`
        @keyframes tutorial-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
          }
        }

        .tutorial-highlight {
          position: relative;
          z-index: 10000;
        }

        /* Custom scrollbar for webkit browsers */
        .tutorial-tooltip ::-webkit-scrollbar {
          width: 6px;
        }

        .tutorial-tooltip ::-webkit-scrollbar-track {
          background: transparent;
        }

        .tutorial-tooltip ::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .tutorial-tooltip ::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
      `}</style>
    </>
  );
}
