// Animations drawer: when a character is selected, lists the curated Mixamo
// clips. Clicking one drops it as a stacked clip lane on that character's
// timeline at the current playhead (the character then animates on scrub/play).
//
// This is the first verifiable slice of the Mixamo-drawer feature — click to
// add. Drag-and-drop onto specific timeline lanes and the stacked strip UI come
// once retargeting/playback is confirmed correct in the viewport.

import { useContext } from "react";
import { EngineContext } from "../../contexts/EngineContext";
import { usePageSceneStore } from "../../PageSceneStore";
import { addClipToCharacter } from "../../actions";
import { demoAnimationItems } from "../../signals/demoAssets/demoAnimationItems";
import { ANIMATION_CLIP_MIME } from "../Timeline/timelineUtils";

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
