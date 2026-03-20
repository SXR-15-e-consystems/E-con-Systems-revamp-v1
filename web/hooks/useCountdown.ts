'use client';

import { useEffect, useState } from 'react';

export interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  expired: boolean;
}

function computeParts(expiryMs: number): CountdownParts {
  const diff = Math.max(0, expiryMs - Date.now());
  const expired = diff === 0;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    expired,
  };
}

/**
 * useCountdown — live countdown to an ISO 8601 expiry string.
 *
 * Ticks every second. Stops (clears interval) once expired.
 * Returns zero-padded DD / HH / MM / SS parts plus an `expired` flag.
 */
export function useCountdown(expiryIso: string): CountdownParts {
  const expiryMs = new Date(expiryIso).getTime();

  const [parts, setParts] = useState<CountdownParts>(() => computeParts(expiryMs));

  useEffect(() => {
    if (parts.expired) return;

    const id = setInterval(() => {
      const next = computeParts(expiryMs);
      setParts(next);
      if (next.expired) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiryMs]);

  return parts;
}
