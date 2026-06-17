import { DragGhost } from "@storyteller/ui-gallery-modal";
import { usePageSceneStore } from "../../PageSceneStore";

// The floating chip shown while dragging an asset out of the library. Feeds the
// shared DragGhost (lift/tilt/follow) from the pagescene store, so the asset
// library gets the exact same pickup motion as the gallery. Gated on
// `assetDraggingUnder` so it only appears once a real drag begins (not on a
// plain click, which sets dragItem on pointer-down).
export const DragComponent = () => (
  <DragGhost
    width={96}
    height={120}
    crossOrigin="anonymous"
    getState={() => {
      const { dragItem, dragPosition, assetDraggingUnder } =
        usePageSceneStore.getState();
      if (!dragItem || !assetDraggingUnder) return null;
      const thumbnail =
        dragItem.thumbnail ||
        `/resources/images/default-covers/${dragItem.imageIndex || 0}.webp`;
      return {
        x: dragPosition.currX,
        y: dragPosition.currY,
        thumbnail,
        label: dragItem.name || dragItem.media_id,
      };
    }}
  />
);
