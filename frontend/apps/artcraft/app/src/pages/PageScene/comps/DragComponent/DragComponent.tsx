import { currPosition, dragItem } from "~/pages/PageScene/signals";
import { useSignals } from "@preact/signals-react/runtime";

export const DragComponent = () => {
  useSignals();
  if (!dragItem.value) {
    return null;
  }
  const { currX, currY } = currPosition.value;

  const thumbnail = dragItem.value.thumbnail
    ? dragItem.value.thumbnail
    : `/resources/images/default-covers/${dragItem.value.imageIndex || 0}.webp`;

  return (
    <div
      className="absolute rounded-lg"
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
        alt={dragItem.value.name}
        className="pointer-events-none select-none rounded-t-lg bg-gradient-to-b from-[#CCCCCC] to-[#A0A0A0]"
      />
      <div className="w-full truncate rounded-b-lg bg-ui-controls px-2 py-1 text-center text-[12px]">
        {dragItem.value.name || dragItem.value.media_id}
      </div>
    </div>
  );
};
