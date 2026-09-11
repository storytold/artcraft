import { DragGhost } from "./DragGhost";
import galleryDnd from "./galleryDnd";

/**
 * The floating thumbnail that follows the cursor while dragging a gallery item.
 * Thin wrapper that feeds the shared {@link DragGhost} from galleryDnd's state.
 */
export const GalleryDragComponent: React.FC = () => (
  <DragGhost
    width={120}
    height={120}
    getState={() => {
      const state = galleryDnd.getDragState();
      if (!state.isDragging || !state.item) return null;
      return {
        x: state.currX,
        y: state.currY,
        thumbnail: state.item.thumbnail || state.item.fullImage || "",
      };
    }}
  />
);
