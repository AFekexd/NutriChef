import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-sm transition-all outline-none",
        "bg-white dark:bg-gray-800",
        "border-gray-300 dark:border-gray-600",
        "text-gray-900 dark:text-gray-100",
        "placeholder:text-gray-400 dark:placeholder:text-gray-500",
        "focus:border-green-500 dark:focus:border-green-400",
        "focus:ring-2 focus:ring-green-500/20 dark:focus:ring-green-400/30",
        "hover:border-gray-400 dark:hover:border-gray-500",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Input };
