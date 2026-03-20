'use client';

import { useCallback, useState } from 'react';

/**
 * useVideoModal — manages which video (by URL) is currently playing.
 *
 * Opening a new video while one is already open replaces it, ensuring
 * only one video plays at a time across the entire component tree
 * that shares this hook instance.
 *
 * The modal consumer is responsible for UNMOUNTING the iframe (not just
 * hiding it) when activeVideoUrl is null — this is what stops playback.
 */
export function useVideoModal() {
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const open = useCallback((url: string) => {
    setActiveVideoUrl(url);
  }, []);

  const close = useCallback(() => {
    setActiveVideoUrl(null);
  }, []);

  const isOpen = activeVideoUrl !== null;

  return { activeVideoUrl, isOpen, open, close };
}
