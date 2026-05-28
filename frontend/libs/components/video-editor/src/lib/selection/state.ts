import type { BoxSelectionChange, SelectionState } from "./types";

function dedupeIds({ ids }: { ids: string[] }) {
  return [...new Set(ids)];
}

function getRangeIds({
  orderedIds,
  anchorId,
  targetId,
}: {
  orderedIds: string[];
  anchorId: string;
  targetId: string;
}) {
  const anchorIndex = orderedIds.indexOf(anchorId);
  const targetIndex = orderedIds.indexOf(targetId);

  if (anchorIndex === -1 || targetIndex === -1) {
    return [targetId];
  }

  const rangeStart = Math.min(anchorIndex, targetIndex);
  const rangeEnd = Math.max(anchorIndex, targetIndex);
  return orderedIds.slice(rangeStart, rangeEnd + 1);
}

export function replaceSelection({
  ids,
  anchorId,
}: {
  ids: string[];
  anchorId?: string | null;
}): SelectionState {
  const selectedIds = dedupeIds({ ids });
  return {
    selectedIds,
    anchorId: anchorId ?? selectedIds[selectedIds.length - 1] ?? null,
  };
}

export function clearSelection(): SelectionState {
  return {
    selectedIds: [],
    anchorId: null,
  };
}

export function pruneSelection({
  state,
  orderedIds,
}: {
  state: SelectionState;
  orderedIds: string[];
}): SelectionState {
  const validIds = new Set(orderedIds);
  const selectedIds = state.selectedIds.filter((id) => validIds.has(id));
  const anchorId =
    state.anchorId && validIds.has(state.anchorId)
      ? state.anchorId
      : selectedIds[selectedIds.length - 1] ?? null;
  const isUnchanged =
    selectedIds.length === state.selectedIds.length &&
    anchorId === state.anchorId;

  if (isUnchanged) {
    return state;
  }

  return {
    selectedIds,
    anchorId,
  };
}

export function isSelected({
  state,
  id,
}: {
  state: SelectionState;
  id: string;
}) {
  return state.selectedIds.includes(id);
}

export function toggleSelection({
  state,
  id,
}: {
  state: SelectionState;
  id: string;
}): SelectionState {
  if (isSelected({ state, id })) {
    const selectedIds = state.selectedIds.filter((selectedId) => selectedId !== id);
    const anchorId =
      state.anchorId === id
        ? selectedIds[selectedIds.length - 1] ?? null
        : state.anchorId;
    return replaceSelection({
      ids: selectedIds,
      anchorId,
    });
  }

  return replaceSelection({
    ids: [...state.selectedIds, id],
    anchorId: id,
  });
}

export function selectRange({
  state,
  orderedIds,
  targetId,
  isAdditive,
}: {
  state: SelectionState;
  orderedIds: string[];
  targetId: string;
  isAdditive: boolean;
}): SelectionState {
  const anchorId =
    state.anchorId ??
    state.selectedIds[state.selectedIds.length - 1] ??
    targetId;
  const rangeIds = getRangeIds({
    orderedIds,
    anchorId,
    targetId,
  });
  const selectedIds = isAdditive
    ? dedupeIds({
        ids: [...state.selectedIds, ...rangeIds],
      })
    : rangeIds;

  return replaceSelection({
    ids: selectedIds,
    anchorId,
  });
}

export function applyBoxSelection({
  intersectedIds,
  initialSelectedIds,
  initialAnchorId,
  isAdditive,
}: BoxSelectionChange): SelectionState {
  const selectedIds = isAdditive
    ? dedupeIds({
        ids: [...initialSelectedIds, ...intersectedIds],
      })
    : intersectedIds;
  const anchorId = isAdditive
    ? initialAnchorId ?? intersectedIds[intersectedIds.length - 1] ?? null
    : intersectedIds[intersectedIds.length - 1] ?? null;

  return replaceSelection({
    ids: selectedIds,
    anchorId,
  });
}
