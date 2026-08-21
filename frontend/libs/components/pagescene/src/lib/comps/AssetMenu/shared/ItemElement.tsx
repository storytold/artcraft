import { useContext, useState } from "react";
import { Badge } from "@storyteller/ui-badge";
import { BoxIcon, FootprintsIcon, MoveIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { EngineContext } from "../../../contexts/EngineContext/EngineContext";
import dragAndDrop from "../../../DragAndDrop/DndAsset";
import { addClipToCharacter } from "../../../actions";
import { AssetType, ToastTypes } from "../../../enums";
import { usePageSceneStore } from "../../../PageSceneStore";
import type { MediaItem } from "../../../models/assets";

interface Props {
  debug?: string;
  item: MediaItem;
}

const mapCharacterObjectType = (mediaType: string) => {
  const typeCased = mediaType.toLowerCase();
  switch (typeCased) {
    case "fbx":
    case "glb": {
      return "Mixamo";
    }
    case "pmx": {
      return "MMD";
    }
    default: {
      return typeCased.toUpperCase();
    }
  }
};
const patchExpressionObjectType = (mediaType: string) => {
  const typeCased = mediaType.toLowerCase();
  if (typeCased === "vmd") {
    return "Mixamo";
  }
  return typeCased.toUpperCase();
};

export const ItemElement = ({ item }: Props) => {
  const editor = useContext(EngineContext);
  // Broken thumbnail URL (404, CORS) → swap to the icon placeholder instead
  // of the browser's broken-image glyph + alt text. Keyed by media id, NOT a
  // boolean: the virtualized grid reuses component instances with positional
  // cell keys, so a plain flag would stick to the CELL and blank out
  // whichever item scrolls/filters into it next.
  const [failedMediaId, setFailedMediaId] = useState<string | null>(null);
  const thumbnailFailed = failedMediaId === item.media_id;

  // Animation cards are click-to-add (clip onto the selected character's
  // timeline row, next free slot via the controller's overlap guard) — parity
  // with the retired AnimationsDrawer. Other asset types are drag-only; a
  // click on them ends as a no-op in DndAsset.
  const handleClick = () => {
    if (item.type !== AssetType.ANIMATION || !editor) return;
    // A very fast flick can release before React commits the modal's
    // pointer-transparency, so the browser still synthesizes a click on the
    // card — but that gesture was a DRAG (aborted or not), never a click.
    if (dragAndDrop.wasDragGesture) return;
    const store = usePageSceneStore.getState();
    const selectedId = store.selectedObject?.id;
    // Same eligibility as the drag path and the timeline rows: characters OR
    // any skinned object (creatures, rigged uploads). Click-to-add rejecting
    // what a drop accepts read as broken.
    const target = selectedId
      ? (store.characters.find((c) => c.id === selectedId) ??
        store.outlinerItems.find(
          (o) => o.id === selectedId && o.hasSkeleton,
        ))
      : undefined;
    if (!target) {
      editor.adapter.showToast(
        ToastTypes.WARNING,
        "Select a character or rigged object in the scene, then click an animation to add it.",
      );
      return;
    }
    // atTime 0 → resolveFreeStart snaps to the earliest free slot on the row.
    const laneId = addClipToCharacter(editor, target.id, item, 0);
    if (!laneId) {
      editor.adapter.showToast(
        ToastTypes.WARNING,
        `No room left on ${target.name}'s timeline for "${item.name}".`,
      );
      return;
    }
    // Successful add: honor the same "Reopen after adding" preference drags
    // use, so with reopen off the library closes and the expanded timeline
    // (addClipToCharacter reveals it) is unobstructed.
    if (!store.reopenAfterDrag) {
      if (store.assetModalVisible) store.setAssetModalVisible(false);
      if (store.animationsModalVisible) store.setAnimationsModalVisible(false);
    }
  };

  return (
    <div className="group relative w-full select-none overflow-hidden transition-all duration-200">
      {item.media_type && (
        <Badge
          label={
            item.type === AssetType.CHARACTER ||
            item.type === AssetType.ANIMATION
              ? mapCharacterObjectType(item.media_type)
              : item.type === AssetType.EXPRESSION
                ? patchExpressionObjectType(item.media_type)
                : item.media_type.toUpperCase()
          }
          className="absolute right-0 mr-[3px] mt-[3px]"
        />
      )}

      <div
        className="pointer-events-none relative aspect-[16/12] w-full select-none overflow-hidden rounded-xl border-[3px] border-white/5 bg-brand-secondary-600 object-cover object-center transition-all group-hover:border-brand-primary"
        onPointerDown={(event) => dragAndDrop.onPointerDown(event, item, editor)}
        onClick={handleClick}
        style={{ cursor: "grab", pointerEvents: "auto" }}
      >
        {item.thumbnail && !thumbnailFailed ? (
          <img
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            src={item.thumbnail}
            alt={item.name}
            className="h-full w-full object-cover object-center"
            onError={() => setFailedMediaId(item.media_id)}
          />
        ) : (
          /* Missing/broken thumbnail: type icon on a slightly lighter card
             so it reads as a deliberate placeholder, not a load failure. */
          <div className="flex h-full w-full items-center justify-center bg-brand-secondary-500/60">
            <DynamicIcon
              icon={
                item.type === AssetType.ANIMATION ? FootprintsIcon : BoxIcon
              }
              className="text-2xl text-white/30"
            />
          </div>
        )}

        <div className="text-shadow-md absolute inset-0 flex items-center justify-center bg-brand-primary-950/50 text-[13px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {item.type === AssetType.ANIMATION ? (
            <>
              <FootprintsIcon  className="mr-1.5" />
              Add to Character
            </>
          ) : (
            <>
              <MoveIcon  className="mr-1.5" />
              Drag to Scene
            </>
          )}
        </div>
      </div>
      <div className="pointer-events-none w-full select-none truncate py-1.5 text-start text-[13px] text-white/80 transition-all duration-200">
        {item.name || item.media_id}
      </div>
    </div>
  );
};
