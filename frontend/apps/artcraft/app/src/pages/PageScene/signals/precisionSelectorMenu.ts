import { Signal, signal } from "@preact/signals-react";

export const showPrecisionSelector = signal(false);
export const precisionSelectorMenuCoords = signal({ x: 0, y: 0 });
export const precisionSelectorValues: Signal<number[]> = signal([]);
export const precisionSelectedValue = signal(0);
