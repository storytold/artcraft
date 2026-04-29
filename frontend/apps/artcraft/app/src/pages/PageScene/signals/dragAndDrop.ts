import { signal } from "@preact/signals-core";
import { MediaItem } from "~/pages/PageScene/models";

export const canDrop = signal(false);
export const dragItem = signal<MediaItem | null>(null);

export const currPosition = signal<{ currX: number; currY: number }>({
  currX: 0,
  currY: 0,
});
