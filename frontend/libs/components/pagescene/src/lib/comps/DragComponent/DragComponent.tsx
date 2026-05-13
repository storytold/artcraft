import { createPortal } from "react-dom";
import { usePageSceneStore } from "../../PageSceneStore";

// Portaled to <body> so the chip stays anchored to the page (using the
// document-coord pageX/pageY values stored in dragPosition) regardless
// of any positioned/`transform`ed ancestor the host wraps Stage3D in.
// Without the portal, hosts whose Stage3D wrapper is a containing
// block (e.g. the webapp's wrapper uses `transform: translateZ(0)` to
// scope the lib's fixed overlays) push the chip away from the cursor
// by the wrapper's offset. Tauri has no such wrapper so the portal is
// a no-op for it.
export const DragComponent = () => {
  const dragItem = usePageSceneStore((s) => s.dragItem);
  const dragPosition = usePageSceneStore((s) => s.dragPosition);

  if (!dragItem) {
    return null;
  }
  if (typeof document === "undefined") {
    return null;
  }
  const { currX, currY } = dragPosition;

  const thumbnail = dragItem.thumbnail
    ? dragItem.thumbnail
    : `/resources/images/default-covers/${dragItem.imageIndex || 0}.webp`;

  return createPortal(
    <div
      className="pointer-events-none absolute rounded-lg"
      style={{
        width: 91,
        height: 114,
        top: currY - 57,
        left: currX + 1,
        zIndex: 10000,
      }}
    >
      <img
        {...{
          crossOrigin: "anonymous",
          src: thumbnail,
        }}
        alt={dragItem.name}
        className="pointer-events-none select-none rounded-t-lg bg-gradient-to-b from-[#CCCCCC] to-[#A0A0A0]"
      />
      <div className="w-full truncate rounded-b-lg bg-ui-controls px-2 py-1 text-center text-[12px]">
        {dragItem.name || dragItem.media_id}
      </div>
    </div>,
    document.body,
  );
};
