# @storyteller/ui-dnd

Unified drag-and-drop foundation for Artcraft. A single drop-target registry that
both the **internal gallery drag** and **external OS file drops** route through,
so any field can declare itself a typed drop target with media-type safety.

## Concepts

- **`MediaKind`** — `"image" | "video" | "audio" | "model3d" | "splat"`. The
  common vocabulary for what's being dragged and what a field accepts.
- **`DragPayload`** — normalized description of the active drag, either
  `{ source: "gallery", item }` or `{ source: "os-file", getFile }`.
- **`dndCoordinator`** — module singleton holding the registry. Hit-tests
  geometrically (rect math, not `elementFromPoint`) so it works even while the
  gallery modal is pointer-transparent mid-drag.
- **`useDropTarget`** — React hook a field uses to register and read its live
  `{ isOver, isRejecting }` highlight state.

## Usage

```tsx
import { useDropTarget } from "@storyteller/ui-dnd";

const ref = useRef<HTMLDivElement>(null);
const { isOver, isRejecting } = useDropTarget({
  ref,
  accepts: ["image"],
  label: "Image Ref",
  onDrop: (payload) => {
    if (payload.source === "gallery") attachFromGallery(payload.item);
    else payload.getFile().then(uploadAndAttach);
  },
});

<div ref={ref} className={isOver ? "ring-2 ring-primary/80" : isRejecting ? "ring-2 ring-red-500/80" : ""} />
```

Drag sources (gallery pointer drag, Tauri/HTML5 file handlers) call
`dndCoordinator.beginDrag/updateHover/drop/endDrag` to drive the registry.
