import { usePageSceneStore } from "../../PageSceneStore";

export const PrecisionSelector = () => {
  const showing = usePageSceneStore((s) => s.precisionSelectorShowing);
  const coords = usePageSceneStore((s) => s.precisionSelectorCoords);
  const values = usePageSceneStore((s) => s.precisionSelectorValues);

  const handleMouseLeave = () => {
    usePageSceneStore.getState().hidePrecisionSelector();
  };

  const handleMouseEnterItem = (scale: number) => {
    usePageSceneStore.getState().setPrecisionSelectedValue(scale);
  };

  return (
    <div
      className="fixed z-50 bg-red-600 -translate-x-1/2 -translate-y-1/2 flex-col gap-[1px] shadow-md bg-ui-divider border-ui-divider border-2 rounded-md overflow-clip"
      style={{
        top: coords.y,
        left: coords.x,
        display: showing ? "flex" : "none",
      }}
      onMouseLeave={handleMouseLeave}
    >
      {values.map((scale, index) => (
        <span
          onMouseEnter={() => handleMouseEnterItem(scale)}
          key={index}
          className="flex bg-ui-panel text-sm justify-center align-middle justify-items-center px-2 hover:bg-ui-controls"
        >
          {scale}
        </span>
      ))}
    </div>
  );
};
