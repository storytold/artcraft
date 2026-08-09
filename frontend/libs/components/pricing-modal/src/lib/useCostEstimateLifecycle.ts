import { useCallback, useRef, useState } from "react";
import { ModelPage } from "@storyteller/ui-model-selector";
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";

interface PendingCostEstimate {
  settle: (credits: number | null) => void;
  cancel: () => void;
}

/**
 * Owns the freshness boundary shared by the cost-estimate hooks.
 *
 * Starting or clearing an estimate invalidates every earlier request from the
 * same hook. A stale promise therefore cannot update either credits or loading
 * after a dependency change or unmount.
 */
export function useCostEstimateLifecycle(): {
  isLoading: boolean;
  begin: (page: ModelPage) => PendingCostEstimate;
  clear: (page: ModelPage) => void;
} {
  const [isLoading, setIsLoading] = useState(false);
  const requestSequence = useRef(0);
  const setEstimatedCreditsForPage = useCostBreakdownModalStore(
    (state) => state.setEstimatedCreditsForPage,
  );

  const clear = useCallback(
    (page: ModelPage) => {
      requestSequence.current += 1;
      setEstimatedCreditsForPage(page, null);
      setIsLoading(false);
    },
    [setEstimatedCreditsForPage],
  );

  const begin = useCallback(
    (page: ModelPage): PendingCostEstimate => {
      const requestId = ++requestSequence.current;
      let pending = true;

      // A quote for the previous inputs must never remain visible while the
      // replacement request is in flight.
      setEstimatedCreditsForPage(page, null);
      setIsLoading(true);

      return {
        settle: (credits) => {
          if (!pending || requestSequence.current !== requestId) return;
          pending = false;
          setEstimatedCreditsForPage(page, credits);
          setIsLoading(false);
        },
        cancel: () => {
          if (!pending) return;
          pending = false;
          if (requestSequence.current === requestId) {
            requestSequence.current += 1;
          }
        },
      };
    },
    [setEstimatedCreditsForPage],
  );

  return { isLoading, begin, clear };
}
