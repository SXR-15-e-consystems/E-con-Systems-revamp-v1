'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useSlider — generic finite-loop slider state.
 *
 * @param count        Total number of slides
 * @param autoplayMs   Autoplay interval in ms. 0 or undefined = no autoplay.
 */
export function useSlider(count: number, autoplayMs?: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(((index % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    setActiveIndex((prev) => ((prev - 1) + count) % count);
  }, [count]);

  // Pause autoplay on user interaction
  const pause = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!autoplayMs || autoplayMs <= 0 || count <= 1) return;
    timerRef.current = setInterval(next, autoplayMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoplayMs, count, next]);

  return { activeIndex, goTo, next, prev, pause };
}
