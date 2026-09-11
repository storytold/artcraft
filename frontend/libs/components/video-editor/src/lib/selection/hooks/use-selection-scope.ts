import { useEffect, useState } from "react";
import { useCommittedRef } from "../../hooks/use-committed-ref";
import { useSelectionContext } from "../context";
import { activateScope, type ScopeEntry } from "../scope";

export function useSelectionScope() {
  const { selectedIds, clearSelection } = useSelectionContext();
  const hasSelection = selectedIds.length > 0;
  const hasSelectionRef = useCommittedRef(hasSelection);
  const clearSelectionRef = useCommittedRef(clearSelection);
  const [entry] = useState<ScopeEntry>(() => ({
    hasSelection: () => hasSelectionRef.current,
    clear: () => {
      clearSelectionRef.current();
    },
  }));

  useEffect(() => {
    if (!hasSelection) {
      return;
    }

    return activateScope({ entry });
  }, [entry, hasSelection]);
}
