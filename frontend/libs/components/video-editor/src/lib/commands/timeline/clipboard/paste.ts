import {
  Command,
  createElementSelectionResult,
  type CommandResult,
} from "../../base-command";
import { EditorCore } from "../../../core";
import type { SceneTracks, TimelineElement } from "../../../timeline/types";
import type { ElementClipboardItem } from "../../../clipboard/types";
import { generateUUID } from "../../../utils/id";
import {
  applyPlacement,
  resolveTrackPlacement,
  enforceMainTrackStart,
} from "../../../timeline/placement";
import { cloneAnimations } from "../../../animation";
import {
  addMediaTime,
  type MediaTime,
  maxMediaTime,
  subMediaTime,
  ZERO_MEDIA_TIME,
} from "../../../wasm";

export class PasteCommand extends Command {
  private savedState: SceneTracks | null = null;
  private pastedElements: { trackId: string; elementId: string }[] = [];
  private readonly time: MediaTime;
  private readonly clipboardItems: ElementClipboardItem[];

  constructor({
    time,
    clipboardItems,
  }: {
    time: MediaTime;
    clipboardItems: ElementClipboardItem[];
  }) {
    super();
    this.time = time;
    this.clipboardItems = clipboardItems;
  }

  execute(): CommandResult | undefined {
    if (this.clipboardItems.length === 0) return undefined;

    const editor = EditorCore.getInstance();
    this.savedState = editor.scenes.getActiveScene().tracks;
    this.pastedElements = [];

    const minStart = this.clipboardItems.reduce(
      (earliestStartTime, item) =>
        item.element.startTime < earliestStartTime
          ? item.element.startTime
          : earliestStartTime,
      this.clipboardItems[0].element.startTime,
    );

    let updatedTracks = this.savedState;
    const itemsByTrackId = groupClipboardItemsByTrackId({
      clipboardItems: this.clipboardItems,
    });

    for (const [trackId, items] of itemsByTrackId) {
      const elementsToAdd = buildPastedElements({
        items,
        minStart,
        time: this.time,
      });

      if (elementsToAdd.length === 0) {
        continue;
      }

      const trackType = items[0].trackType;
      const sourceTrackIndex = [
        ...updatedTracks.overlay,
        updatedTracks.main,
        ...updatedTracks.audio,
      ].findIndex((track) => track.id === trackId);
      const placementResult = resolveTrackPlacement({
        tracks: updatedTracks,
        trackType,
        timeSpans: elementsToAdd.map((element) => ({
          startTime: element.startTime,
          duration: element.duration,
        })),
        strategy: { type: "aboveSource", sourceTrackIndex },
      });
      if (!placementResult) {
        continue;
      }

      let elementsForPlacement = elementsToAdd;
      if (placementResult.kind === "existingTrack") {
        const targetTrack =
          placementResult.trackIndex < updatedTracks.overlay.length
            ? updatedTracks.overlay[placementResult.trackIndex]
            : placementResult.trackIndex === updatedTracks.overlay.length
              ? updatedTracks.main
              : updatedTracks.audio[
                  placementResult.trackIndex - updatedTracks.overlay.length - 1
                ];
        if (targetTrack?.id === updatedTracks.main.id) {
          const earliestElement = elementsToAdd.reduce((earliest, element) =>
            element.startTime < earliest.startTime ? element : earliest,
          );
          const adjustedEarliestStartTime = enforceMainTrackStart({
            tracks: updatedTracks,
            targetTrackId: targetTrack.id,
            requestedStartTime: earliestElement.startTime,
          });
          const delta = subMediaTime({
            a: adjustedEarliestStartTime,
            b: earliestElement.startTime,
          });

          if (delta !== ZERO_MEDIA_TIME) {
            elementsForPlacement = elementsToAdd.map((element) => ({
              ...element,
              startTime: maxMediaTime({
                a: ZERO_MEDIA_TIME,
                b: addMediaTime({ a: element.startTime, b: delta }),
              }),
            }));
          }
        }
      }

      const applied = applyPlacement({
        tracks: updatedTracks,
        placementResult,
        elements: elementsForPlacement,
      });
      if (!applied) {
        continue;
      }

      updatedTracks = applied.updatedTracks;

      for (const element of elementsForPlacement) {
        this.pastedElements.push({
          trackId: applied.targetTrackId,
          elementId: element.id,
        });
      }
    }

    editor.timeline.updateTracks(updatedTracks);

    if (this.pastedElements.length > 0) {
      return createElementSelectionResult(this.pastedElements);
    }
    return undefined;
  }

  undo(): void {
    if (this.savedState) {
      const editor = EditorCore.getInstance();
      editor.timeline.updateTracks(this.savedState);
    }
  }

  getPastedElements(): { trackId: string; elementId: string }[] {
    return this.pastedElements;
  }
}

function groupClipboardItemsByTrackId({
  clipboardItems,
}: {
  clipboardItems: ElementClipboardItem[];
}): Map<string, ElementClipboardItem[]> {
  const groupedItems = new Map<string, ElementClipboardItem[]>();

  for (const item of clipboardItems) {
    const existingItems = groupedItems.get(item.trackId) ?? [];
    groupedItems.set(item.trackId, [...existingItems, item]);
  }

  return groupedItems;
}

function buildPastedElements({
  items,
  minStart,
  time,
}: {
  items: ElementClipboardItem[];
  minStart: MediaTime;
  time: MediaTime;
}): TimelineElement[] {
  const elementsToAdd: TimelineElement[] = [];

  for (const item of items) {
    const relativeOffset = subMediaTime({
      a: item.element.startTime,
      b: minStart,
    });
    const startTime = maxMediaTime({
      a: ZERO_MEDIA_TIME,
      b: addMediaTime({ a: time, b: relativeOffset }),
    });
    const newElementId = generateUUID();

    elementsToAdd.push({
      ...item.element,
      id: newElementId,
      startTime,
      animations: cloneAnimations({
        animations: item.element.animations,
        shouldRegenerateKeyframeIds: true,
      }),
    } as TimelineElement);
  }

  return elementsToAdd;
}
