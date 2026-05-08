import { usePageSceneStore } from "../../PageSceneStore";

export const DragComponent = () => {
  const dragItem = usePageSceneStore((s) => s.dragItem);
  const dragPosition = usePageSceneStore((s) => s.dragPosition);

  if (!dragItem) {
    return null;
  }
  const { currX, currY } = dragPosition;

  const thumbnail = dragItem.thumbnail
    ? dragItem.thumbnail
    : `/resources/images/default-covers/${dragItem.imageIndex || 0}.webp`;

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
        alt={dragItem.name}
        className="pointer-events-none select-none rounded-t-lg bg-gradient-to-b from-[#CCCCCC] to-[#A0A0A0]"
      />
      <div className="w-full truncate rounded-b-lg bg-ui-controls px-2 py-1 text-center text-[12px]">
        {dragItem.name || dragItem.media_id}
      </div>
    </div>
  );
};
