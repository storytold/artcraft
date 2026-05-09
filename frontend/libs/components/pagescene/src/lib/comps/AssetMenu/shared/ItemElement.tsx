import { useContext } from "react";
import { Badge } from "@storyteller/ui-badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpDownLeftRight } from "@fortawesome/pro-solid-svg-icons";
import { EngineContext } from "../../../contexts/EngineContext/EngineContext";
import dragAndDrop from "../../../DragAndDrop/DndAsset";
import { AssetType } from "../../../enums";
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

  return (
    <div className="group relative w-full select-none overflow-hidden transition-all duration-200">
      {item.media_type && (
        <Badge
          label={
            item.type === AssetType.CHARACTER
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
          <FontAwesomeIcon icon={faUpDownLeftRight} className="mr-1.5" />
          Drag to Scene
        </div>
      </div>
      <div className="pointer-events-none w-full select-none truncate py-1.5 text-start text-[13px] text-white/80 transition-all duration-200">
        {item.name || item.media_id}
      </div>
    </div>
  );
};
