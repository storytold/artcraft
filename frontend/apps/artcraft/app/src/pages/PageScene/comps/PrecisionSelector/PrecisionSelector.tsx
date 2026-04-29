import { Signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";

export const PrecisionSelector = ({
  showSignal,
  coordSignal,
  valuesSignal,
  selectedValueSignal
}: {
  showSignal: Signal<boolean>,
  coordSignal: Signal<{ x: number; y: number }>,
  valuesSignal: Signal<number[]>
  selectedValueSignal: Signal<number>
}) => {
  useSignals();

  const handleMouseLeave = () => {
    showSignal.value = false;
  }

  const handleMouseEnterItem = (scale: number) => {
    selectedValueSignal.value = scale;
    console.log("selectedValueSignal", selectedValueSignal.value);
  }

  return (
    <div
      className="fixed z-50 bg-red-600 -translate-x-1/2 -translate-y-1/2 flex-col gap-[1px] shadow-md bg-ui-divider border-ui-divider border-2 rounded-md overflow-clip"
      style={{
        top: coordSignal.value.y,
        left: coordSignal.value.x,
        display: showSignal.value ? "flex" : "none"
      }}
      onMouseLeave={handleMouseLeave}
    >
      {valuesSignal.value.map((scale, index) => (
        <span onMouseEnter={() => handleMouseEnterItem(scale)} key={index}
          className="flex bg-ui-panel text-sm justify-center align-middle justify-items-center px-2 hover:bg-ui-controls"
        >{scale}</span>
      ))}
    </div>
  )
}
