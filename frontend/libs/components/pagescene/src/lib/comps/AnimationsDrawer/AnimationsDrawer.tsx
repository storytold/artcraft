// Animations drawer: when a character is selected, lists the curated Mixamo
// clips. Click a clip to drop it on the character's timeline at the playhead,
// or drag it onto a character's timeline row (drop time follows the cursor).
// While dragging, the shared DragGhost (tilt card) previews the clip's
// thumbnail — the same pickup motion as object/character drags.

import { useContext } from "react";
import { EngineContext } from "../../contexts/EngineContext";
import { usePageSceneStore } from "../../PageSceneStore";
import { addClipToCharacter } from "../../actions";
import { demoAnimationItems } from "../../signals/demoAssets/demoAnimationItems";
import { ANIMATION_CLIP_MIME } from "../Timeline/timelineUtils";

// 1×1 transparent GIF used to suppress the browser's default drag image so only
// the DragGhost tilt card shows. Created once at module load so it's decoded by
// the time a drag starts.
const TRANSPARENT_DRAG_IMAGE =
  typeof Image !== "undefined" ? new Image() : null;
if (TRANSPARENT_DRAG_IMAGE) {
  TRANSPARENT_DRAG_IMAGE.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
}

export const AnimationsDrawer = () => {
  const editor = useContext(EngineContext);
  const selectedObject = usePageSceneStore((s) => s.selectedObject);
  const characters = usePageSceneStore((s) => s.characters);

  const character = characters.find(
    (c) => c.kind === "character" && c.id === selectedObject?.id,
  );
  if (!character) return null;

  return (
    <div className="glass glass-no-hover pointer-events-auto flex w-52 flex-col gap-2 rounded-2xl p-3 shadow-xl">
      <div className="px-1 text-xs font-medium text-base-fg/70">
        Animations · {character.name}
      </div>
      <div className="grid max-h-[46vh] grid-cols-2 gap-2 overflow-y-auto pe-1">
        {demoAnimationItems.map((item) => (
          <button
            key={item.media_id}
            type="button"
            draggable
            title={`Add “${item.name}” to ${character.name} — click, or drag onto the timeline`}
            className="group flex flex-col items-stretch gap-1 rounded-lg border border-white/10 bg-black/30 p-1 text-left transition-colors hover:border-white/40"
            onDragStart={(e) => {
              e.dataTransfer.setData(
                ANIMATION_CLIP_MIME,
                JSON.stringify({ media_id: item.media_id, name: item.name }),
              );
              e.dataTransfer.effectAllowed = "copy";
              // Hide the native drag image; the DragGhost renders the preview.
              if (TRANSPARENT_DRAG_IMAGE) {
                e.dataTransfer.setDragImage(TRANSPARENT_DRAG_IMAGE, 0, 0);
              }
              const store = usePageSceneStore.getState();
              store.setDragItem(item);
              store.setDragPosition({ currX: e.pageX, currY: e.pageY });
              store.setAssetDraggingUnder(true);
            }}
            onDrag={(e) => {
              // The final native drag event can report (0,0) — ignore it so the
              // ghost doesn't snap to the corner on release.
              if (e.pageX === 0 && e.pageY === 0) return;
              usePageSceneStore
                .getState()
                .setDragPosition({ currX: e.pageX, currY: e.pageY });
            }}
            onDragEnd={() => {
              const store = usePageSceneStore.getState();
              store.setDragItem(null);
              store.setAssetDraggingUnder(false);
              store.setDragPosition({ currX: 0, currY: 0 });
            }}
            onClick={() =>
              editor && addClipToCharacter(editor, character.id, item)
            }
          >
            <div className="aspect-square w-full overflow-hidden rounded-md bg-black/40">
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt={item.name ?? "Animation"}
                  className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                  draggable={false}
                />
              )}
            </div>
            <span className="truncate px-0.5 text-[11px] text-base-fg/90">
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AnimationsDrawer;
