import React, { useState } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = "top",
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`
            absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700
            rounded shadow-lg whitespace-nowrap pointer-events-none
            ${positionClasses[position]}
          `}
          role="tooltip"
        >
          {content}
          {/* Arrow */}
          <div
            className={`
              absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45
              ${
                position === "top"
                  ? "bottom-0 left-1/2 -translate-x-1/2 translate-y-1"
                  : ""
              }
              ${
                position === "bottom"
                  ? "top-0 left-1/2 -translate-x-1/2 -translate-y-1"
                  : ""
              }
              ${
                position === "left"
                  ? "right-0 top-1/2 -translate-y-1/2 translate-x-1"
                  : ""
              }
              ${
                position === "right"
                  ? "left-0 top-1/2 -translate-y-1/2 -translate-x-1"
                  : ""
              }
            `}
          />
        </div>
      )}
    </div>
  );
}
