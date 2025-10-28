import { useEffect, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  disabled = false,
}: UsePullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const isTouching = useRef(false);

  useEffect(() => {
    if (disabled) return;

    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      // Only activate if scrolled to top
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        touchStartY.current = startY;
        isTouching.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching.current || isRefreshing) return;

      currentY = e.touches[0].clientY;
      const distance = currentY - startY;

      // Only trigger on pull down
      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault();
        // Use diminishing returns for pull distance
        const dampedDistance = Math.min(distance * 0.5, threshold * 1.5);
        setPullDistance(dampedDistance);
      }
    };

    const handleTouchEnd = async () => {
      if (!isTouching.current || isRefreshing) return;

      isTouching.current = false;

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onRefresh, threshold, isRefreshing, pullDistance, disabled]);

  return {
    isRefreshing,
    pullDistance,
    isPulling: pullDistance > 0,
  };
};
