export type ScopeEntry = {
  hasSelection: () => boolean;
  clear: () => void;
  clearActive?: () => void;
};

let activeScope: ScopeEntry | null = null;

export function activateScope({ entry }: { entry: ScopeEntry }): () => void {
  if (activeScope && activeScope !== entry) {
    activeScope.clear();
  }

  activeScope = entry;

  return () => {
    if (activeScope === entry) {
      activeScope = null;
    }
  };
}

export function clearActiveScope(): boolean {
  if (!activeScope?.hasSelection()) {
    return false;
  }

  (activeScope.clearActive ?? activeScope.clear)();
  return true;
}
