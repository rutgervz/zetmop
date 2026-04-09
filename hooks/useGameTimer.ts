import { useState, useEffect, useRef } from 'react';

/**
 * Simpele timer die bijhoudt hoe lang een partij duurt.
 * Start automatisch, stopt als isPlaying false wordt.
 */
export function useGameTimer(isPlaying: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());

  // Reset wanneer een nieuw spel begint
  useEffect(() => {
    if (isPlaying) {
      startRef.current = Date.now();
      setElapsed(0);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return elapsed;
}
