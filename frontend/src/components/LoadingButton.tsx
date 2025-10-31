import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

const variantClasses = {
  primary: "bg-green-600 hover:bg-green-700 text-white",
  secondary:
    "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  ghost:
    "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
};

export function LoadingButton({
  loading = false,
  children,
  loadingText = "Loading...",
  variant = "primary",
  className = "",
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      className={`
        px-4 py-2 rounded-lg font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        hover-lift focus-visible-ring
        ${variantClasses[variant]}
        ${className}
      `}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
