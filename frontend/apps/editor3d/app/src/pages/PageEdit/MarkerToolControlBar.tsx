import { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeDropper } from "@fortawesome/pro-solid-svg-icons";
import { SliderV2 } from "@storyteller/ui-sliderv2";
import { HsvaColorPicker, HsvaColor } from "react-colorful";
import { hsvaToHex, hexToHsva } from "@uiw/color-convert";

export interface MarkerToolControlBarProps {
  currentSize: number;
  currentColor: string;
  activeTool: string;
  showColorPicker: boolean;
  onSizeChange?: (size: number) => void;
  onColorChange?: (color: string) => void;
}

function useDebounced<T extends (...args: A) => void, A extends unknown[]>(
  fn: T,
  ms = 75,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (...args: A) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), ms);
  };
}

const MarkerToolControlBar = ({
  currentSize,
  currentColor,
  activeTool,
  showColorPicker: showColorPickerProp,
  onSizeChange,
  onColorChange,
}: MarkerToolControlBarProps) => {
  const [showColorPickerPanel, setShowColorPickerPanel] = useState(false);
  const [hsva, setHsva] = useState<HsvaColor>(hexToHsva(currentColor));

  const isEraser = activeTool === "eraser";
  const shouldShowColorPicker = showColorPickerProp && !isEraser;
  const maxSize = isEraser ? 50 : 20;

  const sendColor = useDebounced<(hex: string) => void, [string]>(
    (hex: string) => {
      onColorChange?.(hex);
    },
    75,
  );

  return (
    <div className="absolute left-1/2 top-20 flex -translate-x-1/2 flex-col gap-3">
      <div className="glass flex w-[400px] items-center gap-2 rounded-xl p-2">
        {shouldShowColorPicker && (
          <div className="relative">
            <button
              onClick={() => setShowColorPickerPanel(!showColorPickerPanel)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-transparent text-white transition-colors hover:bg-white/10"
            >
              <span
                className="inline-block h-5 w-5 rounded-full border-2 border-white"
                style={{ backgroundColor: currentColor }}
              />
            </button>

            {showColorPickerPanel && (
              <div
                className="absolute left-0 top-12 z-50 rounded-xl border border-[#404040] bg-[#303030] transition-all duration-200 ease-in-out"
                onMouseLeave={() => setShowColorPickerPanel(false)}
              >
                <div className="glass relative w-fit rounded-2xl p-4 shadow-lg">
                  <button className="bg-zinc-700 text-zinc-300 hover:bg-zinc-600 absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full">
                    <FontAwesomeIcon icon={faEyeDropper} size="sm" />
                  </button>

                  <HsvaColorPicker
                    color={hsva}
                    onChange={(c) => {
                      setHsva(c);
                      const hex = hsvaToHex(c);
                      sendColor(hex);
                    }}
                    className="brush-picker"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <SliderV2
          min={1}
          max={maxSize}
          value={currentSize}
          onChange={(size) => onSizeChange?.(size)}
          step={1}
          innerLabel={"Size " + currentSize + "pt"}
          showDecrement
          showIncrement
        />
      </div>
    </div>
  );
};

export default MarkerToolControlBar;
