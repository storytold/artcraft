import { useContext } from "react";
import { Badge } from "@storyteller/ui-badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPersonRunning,
  faUpDownLeftRight,
} from "@fortawesome/pro-solid-svg-icons";
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

  // Animation cards are click-to-add (clip onto the selected character's
  // timeline row, next free slot via the controller's overlap guard) — parity
  // with the retired AnimationsDrawer. Other asset types are drag-only; a
  // click on them ends as a no-op in DndAsset.
  const handleClick = () => {
    if (item.type !== AssetType.ANIMATION || !editor) return;
    const store = usePageSceneStore.getState();
    const character = store.characters.find(
      (c) => c.kind === "character" && c.id === store.selectedObject?.id,
    );
    if (!character) {
      editor.adapter.showToast(
        ToastTypes.WARNING,
        "Select a character in the scene, then click an animation to add it.",
      );
      return;
    }
    const laneId = addClipToCharacter(editor, character.id, item);
    if (!laneId) {
      editor.adapter.showToast(
        ToastTypes.WARNING,
        `No room left on ${character.name}'s timeline for "${item.name}".`,
      );
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
        <img
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          src={item.thumbnail}
          alt={item.name}
          className="h-full w-full object-cover object-center"
        />

        <div className="text-shadow-md absolute inset-0 flex items-center justify-center bg-brand-primary-950/50 text-[13px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {item.type === AssetType.ANIMATION ? (
            <>
              <FontAwesomeIcon icon={faPersonRunning} className="mr-1.5" />
              Add to Character
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faUpDownLeftRight} className="mr-1.5" />
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
