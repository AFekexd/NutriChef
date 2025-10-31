import React from "react";
import {
  ChefHat,
  Package,
  ShoppingCart,
  Calendar,
  BookOpen,
} from "lucide-react";

export type EmptyStateType =
  | "recipes"
  | "inventory"
  | "shopping"
  | "meal-plan"
  | "recommendations";

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EMPTY_STATE_CONFIG: Record<
  EmptyStateType,
  {
    icon: React.ComponentType<{ className?: string }>;
    defaultTitle: string;
    defaultMessage: string;
    color: string;
  }
> = {
  recipes: {
    icon: ChefHat,
    defaultTitle: "No recipes yet",
    defaultMessage:
      "Get started by creating your first recipe or discovering recommendations.",
    color: "text-orange-500 dark:text-orange-400",
  },
  inventory: {
    icon: Package,
    defaultTitle: "Inventory is empty",
    defaultMessage: "Add ingredients to track what you have in your kitchen.",
    color: "text-blue-500 dark:text-blue-400",
  },
  shopping: {
    icon: ShoppingCart,
    defaultTitle: "Shopping list is empty",
    defaultMessage: "Add items to your shopping list to remember what to buy.",
    color: "text-purple-500 dark:text-purple-400",
  },
  "meal-plan": {
    icon: Calendar,
    defaultTitle: "No meals planned",
    defaultMessage: "Start planning your meals for the week.",
    color: "text-green-500 dark:text-green-400",
  },
  recommendations: {
    icon: BookOpen,
    defaultTitle: "No recommendations yet",
    defaultMessage:
      "Generate AI-powered recipe recommendations based on your inventory.",
    color: "text-pink-500 dark:text-pink-400",
  },
};

export function EmptyState({
  type,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className={`mb-4 ${config.color}`}>
        <Icon className="h-16 w-16 md:h-20 md:w-20" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title || config.defaultTitle}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {message || config.defaultMessage}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors hover-lift"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
