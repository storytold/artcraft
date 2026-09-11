import { usePageSceneStore } from "../PageSceneStore";

// Open the standalone animations-only library modal (the "Add Animation"
// button next to Enter Pose Mode). Closes the presets modal so only one
// library panel is ever open, and clears leftover drag-under state so the
// panel opens fully shown (a reopen-off drag leaves it faded-hidden until
// the next open).
export function openAnimationsModal(): void {
  const store = usePageSceneStore.getState();
  store.setAssetModalVisible(false);
  store.setAnimationsModalVisible(true);
  store.setAssetDraggingUnder(false);
}
