import { useCallback, useState } from 'react';

/**
 * useSlider (CMS) — simple slide navigation for editor previews.
 * No autoplay — editors control slides manually.
 */
export function useSlider(count: number) {
  const [activeIndex, setActiveIndex] = useState(0);

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

  return { activeIndex, goTo, next, prev };
}
