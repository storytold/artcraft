import { useCallback, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { precisionSelectedValue, precisionSelectorMenuCoords, precisionSelectorValues, showPrecisionSelector } from "../../signals/precisionSelectorMenu";

const DEFAULT_PRECISIONS = [
  10,
  1,
  0.1,
  0.01,
  0.001
]

export const DraggablePrecisionMutator = ({
  precisions = DEFAULT_PRECISIONS,
  className = "",
  initialValue = 0,
  onChange = () => { },
  onCommit = () => { },
  children
}: {
  precisions?: number[],
  className?: string,
  initialValue?: number,
  onChange?: (value: number) => void,
  onCommit?: (value: number) => void,
  children?: React.ReactNode
}) => {
  const classes = twMerge(["cursor-ew-resize", className]);
  const divRef = useRef<HTMLDivElement>(null);

  const isDraggingRef = useRef(false);
  const dragStartCoordsRef = useRef<{ x: number, y: number } | null>(null);
  const localAdjustedValueRef = useRef(initialValue);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    // Ignore mouse movement if we're not even dragging
    // or if the menu is still open (we're selecting the precision)
    if (!isDraggingRef.current || showPrecisionSelector.value) {
      return;
    }

    event.stopPropagation();

    // Record the initial drag coordinates if they haven't been set yet
    if (!dragStartCoordsRef.current) {
      dragStartCoordsRef.current = {
        x: event.clientX,
        y: event.clientY
      };
      return;
    }

    // Check how far the mouse has moved, and calculate the updated change
    const distX = event.x - dragStartCoordsRef.current.x;
    const scaledDistX = distX / 10;
    const scaledPrecision = Math.round(scaledDistX) * precisionSelectedValue.value;
    localAdjustedValueRef.current = initialValue + scaledPrecision;

    // Update the listeners
    onChange(localAdjustedValueRef.current);
  }, [initialValue, onChange]);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    event.stopPropagation();
    showPrecisionSelector.value = false;
    isDraggingRef.current = false;
    dragStartCoordsRef.current = null;

    // clean up the mouse listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // Call back the commit listener
    onCommit(localAdjustedValueRef.current);
  }, [handleMouseMove, onCommit]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    precisionSelectorMenuCoords.value = {
      x: event.clientX,
      y: event.clientY
    };
    precisionSelectorValues.value = precisions;
    showPrecisionSelector.value = true;
    isDraggingRef.current = true;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove, handleMouseUp, precisions]);

  return (
    <div className={classes} ref={divRef} onMouseDown={handleMouseDown}>
      {children}
    </div>
  )
}
