import React from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number; // 0-5
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showCount?: boolean;
  reviewCount?: number;
}

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function RatingStars({
  rating,
  maxStars = 5,
  size = "md",
  interactive = false,
  onRatingChange,
  showCount = false,
  reviewCount = 0,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= displayRating;
          const isPartial =
            !isFilled &&
            starValue - 1 < displayRating &&
            displayRating < starValue;

          return (
            <button
              key={i}
              type="button"
              className={`
                relative transition-all
                ${
                  interactive
                    ? "cursor-pointer hover:scale-110"
                    : "cursor-default"
                }
                ${interactive ? "focus-visible-ring rounded" : ""}
              `}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              disabled={!interactive}
              aria-label={`Rate ${starValue} stars`}
            >
              {isPartial ? (
                <div className="relative">
                  <Star
                    className={`${sizeClasses[size]} text-gray-300 dark:text-gray-600`}
                  />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                      width: `${
                        (displayRating - Math.floor(displayRating)) * 100
                      }%`,
                    }}
                  >
                    <Star
                      className={`${sizeClasses[size]} text-yellow-400 fill-yellow-400`}
                    />
                  </div>
                </div>
              ) : (
                <Star
                  className={`
                    ${sizeClasses[size]}
                    ${
                      isFilled
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    }
                  `}
                />
              )}
            </button>
          );
        })}
      </div>
      {showCount && reviewCount > 0 && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          ({reviewCount})
        </span>
      )}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}
