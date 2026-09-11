import { SliderV2 } from "@storyteller/ui-sliderv2";

interface InpaintToolBarProps {
  operation: "add" | "minus";
  brushSize: number;
  onOperationChange: (op: "add" | "minus") => void;
  onBrushSizeChange: (size: number) => void;
}

const InpaintToolBar = ({
  operation,
  brushSize,
  onOperationChange,
  onBrushSizeChange,
}: InpaintToolBarProps) => {
  return (
    <div className="fixed left-1/2 top-20 z-20 flex -translate-x-1/2 flex-col gap-3">
      <div className="glass flex w-[400px] items-center gap-2 rounded-xl p-2">
        <div className="flex rounded-lg border border-white/10 bg-white/5">
          <button
            className={`rounded-l-lg px-4 py-2 text-sm font-medium transition-colors ${
              operation === "add"
                ? "bg-white/20 text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => onOperationChange("add")}
          >
            Add
          </button>
          <button
            className={`rounded-r-lg px-4 py-2 text-sm font-medium transition-colors ${
              operation === "minus"
                ? "bg-white/20 text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => onOperationChange("minus")}
          >
            Erase
          </button>
        </div>

        <SliderV2
          min={1}
          max={100}
          value={brushSize}
          onChange={onBrushSizeChange}
          step={1}
          innerLabel={"Size " + brushSize + "pt"}
          showDecrement
          showIncrement
        />
      </div>
    </div>
  );
};

export default InpaintToolBar;
