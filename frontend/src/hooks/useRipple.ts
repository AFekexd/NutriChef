import { useEffect, useState } from "react";
import type { MouseEvent } from "react";

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

export const useRipple = (duration = 600) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    if (ripples.length === 0) return;

    const timer = setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, duration);

    return () => clearTimeout(timer);
  }, [ripples, duration]);

  const addRipple = (e: MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple: Ripple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);
  };

  return { addRipple, ripples, duration };
};
