// ── hooks/useCounterAnimation.ts ──
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/** Animates a number from 0 to target using requestAnimationFrame with easeOut curve */
export function useCounterAnimation<T extends HTMLElement = HTMLDivElement>(
  target: number,
  duration: number = 1500,
  decimals: number = 0
): { value: number; ref: React.RefObject<T | null> } {
  const [value, setValue] = useState(0);
  const ref = useRef<T>(null);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutQuart curve for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 4);
      const currentValue = parseFloat((eased * target).toFixed(decimals));

      setValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [target, duration, decimals]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            animate();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [animate]);

  return { value, ref };
}
