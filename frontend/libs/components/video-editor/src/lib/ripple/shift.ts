import type { TimelineElement } from "../timeline/types";

// Shifts every element whose start lies at or after `afterTime` back
// by `shiftAmount`. Used to close gaps in a track after the elements
// inside that gap are deleted (the "ripple" mode behaviour).
export function rippleShiftElements<TElement extends TimelineElement>({
  elements,
  afterTime,
  shiftAmount,
}: {
  elements: TElement[];
  afterTime: number;
  shiftAmount: number;
}): TElement[] {
  return elements.map((element) =>
    element.startTime >= afterTime
      ? ({ ...element, startTime: element.startTime - shiftAmount } as TElement)
      : element,
  );
}
