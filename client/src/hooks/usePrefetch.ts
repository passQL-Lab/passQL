import { useRef, useCallback } from "react";
import { generateChoices } from "../api/questions";
import type { ChoiceSetComplete } from "../types/api";

// Module-level cache — persists for the session, cleared on page refresh
const prefetchCache = new Map<string, ChoiceSetComplete>();

export function usePrefetch() {
  // Track in-flight prefetch abort functions
  const inFlightRef = useRef(new Map<string, () => void>());

  const prefetch = useCallback((questionUuid: string) => {
    // Skip if already cached or in-flight
    if (prefetchCache.has(questionUuid)) return;
    if (inFlightRef.current.has(questionUuid)) return;

    const abort = generateChoices(questionUuid, {
      onStatus: () => {}, // No UI for prefetch status
      onComplete: (result) => {
        prefetchCache.set(questionUuid, result);
        inFlightRef.current.delete(questionUuid);
      },
      onError: () => {
        // Prefetch failure is silent — next page will generate fresh
        inFlightRef.current.delete(questionUuid);
      },
    });

    inFlightRef.current.set(questionUuid, abort);
  }, []);

  const consumeCache = useCallback((questionUuid: string): ChoiceSetComplete | null => {
    const cached = prefetchCache.get(questionUuid) ?? null;
    prefetchCache.delete(questionUuid);
    return cached;
  }, []);

  return { prefetch, consumeCache };
}
