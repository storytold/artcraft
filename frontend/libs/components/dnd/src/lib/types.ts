// Core type vocabulary shared by every drag-and-drop participant in the app.
//
// Two things drive every drop: WHAT is being dragged (a `DragPayload`) and WHAT
// a field is willing to receive (`MediaKind[]` on a registration). The coordinator
// matches the two. Keeping these types here — with no imports from feature libs —
// lets gallery-modal, promptbox, pagescene, and both apps depend on `@storyteller/ui-dnd`
// without any of them depending on each other.

/** The media families a drop target can accept. Normalized across OS files
 *  (by MIME/extension) and in-app gallery items (by `mediaClass`). */
export type MediaKind = "image" | "video" | "audio" | "model3d" | "splat";

/** Structural subset of the gallery's `GalleryItem`. We intentionally re-declare
 *  the few fields we need instead of importing from `@storyteller/ui-gallery-modal`,
 *  which would create a dependency cycle (gallery-modal depends on this lib). */
export interface GalleryItemLike {
  id: string;
  label?: string;
  fullImage?: string | null;
  thumbnail?: string | null;
  mediaClass?: string;
  mediaTokens?: string[];
  assetType?: string;
}

/** A normalized description of whatever is currently being dragged. Both the
 *  internal gallery drag and external OS-file drags produce this shape, so a
 *  drop target's `onDrop` handles them uniformly. */
export type DragPayload =
  | { source: "gallery"; kind: MediaKind; item: GalleryItemLike }
  | {
      source: "os-file";
      kind: MediaKind;
      fileName: string;
      /** Lazily materializes the dropped file. For OS drags the bytes aren't
       *  available until the drop fires (Tauri must fetch via convertFileSrc),
       *  so we defer the work until a target actually accepts it. */
      getFile: () => Promise<File>;
    };

/** Visual state a registered target should render while a drag hovers it. */
export type HighlightState = "accept" | "reject" | null;

/** What a component hands the coordinator to become a drop target. The hook
 *  (`useDropTarget`) builds and maintains this; non-React callers may register
 *  directly. Fields are read live on each hit-test, so updating them in place
 *  (rather than re-registering) keeps highlight/route logic current. */
export interface DropTargetRegistration {
  id: string;
  /** Resolves the target's current element. Returns null when unmounted/detached. */
  getEl: () => HTMLElement | null;
  accepts: MediaKind[];
  onDrop: (payload: DragPayload) => void | Promise<void>;
  /** Short human label for the drag ghost, e.g. "Image Ref". */
  label?: string;
  disabled?: boolean;
}
