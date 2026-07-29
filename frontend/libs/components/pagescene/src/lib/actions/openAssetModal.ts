import { usePageSceneStore } from "../PageSceneStore";

// Open the add-asset (ArtCraft presets) modal. Shared by the Controls3D "+"
// popover and the Outliner's "+ Add" button. Clears any leftover drag-under
// state so the panel opens fully shown (a reopen-off drag leaves it
// faded-hidden until the next open).
export function openAssetModal(): void {
  const store = usePageSceneStore.getState();
  store.setAssetModalVisibleDuringDrag(true);
  store.setAssetModalVisible(true);
  store.setAssetDraggingUnder(false);
}
