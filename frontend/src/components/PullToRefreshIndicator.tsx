import { Loader2, RefreshCw } from "lucide-react";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export const PullToRefreshIndicator = ({
  pullDistance,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const rotation = (pullDistance / threshold) * 360;

  return (
    <div
      className="fixed top-0 left-0 right-0 flex justify-center transition-all duration-200 z-50"
      style={{
        transform: `translateY(${
          isRefreshing ? "0" : Math.min(pullDistance, threshold) - threshold
        }px)`,
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-full shadow-lg p-3 mt-4 border border-gray-200 dark:border-gray-700">
        {isRefreshing ? (
          <Loader2 className="w-6 h-6 text-[#4CAF50] dark:text-green-400 animate-spin" />
        ) : (
          <RefreshCw
            className="w-6 h-6 text-[#4CAF50] dark:text-green-400 transition-transform"
            style={{
              transform: `rotate(${rotation}deg)`,
              opacity: Math.min(progress / 100, 1),
            }}
          />
        )}
      </div>
    </div>
  );
};
