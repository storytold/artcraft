import {
  Command,
  createElementSelectionResult,
  type CommandResult,
} from "../../base-command";
import type { SceneTracks, TimelineElement } from "../../../timeline/types";
import { generateUUID } from "../../../utils/id";
import { EditorCore } from "../../../core";
import { isRetimableElement } from "../../../timeline/element-utils";
import { splitAnimationsAtTime } from "../../../animation";
import { getSourceSpanAtClipTime } from "../../../retime";
import {
  addMediaTime,
  type MediaTime,
  roundMediaTime,
  subMediaTime,
} from "../../../wasm";

export class SplitElementsCommand extends Command {
  private savedState: SceneTracks | null = null;
  private rightSideElements: { trackId: string; elementId: string }[] = [];
  private readonly elements: { trackId: string; elementId: string }[];
  private readonly splitTime: MediaTime;
  private readonly retainSide: "both" | "left" | "right";

  constructor({
    elements,
    splitTime,
    retainSide = "both",
  }: {
    elements: { trackId: string; elementId: string }[];
    splitTime: MediaTime;
    retainSide?: "both" | "left" | "right";
  }) {
    super();
    this.elements = elements;
    this.splitTime = splitTime;
    this.retainSide = retainSide;
  }

  getRightSideElements(): { trackId: string; elementId: string }[] {
    return this.rightSideElements;
  }

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.scenes.getActiveScene().tracks;
    this.rightSideElements = [];

    const splitTrack = <
      TTrack extends { id: string; elements: TimelineElement[] },
    >(
      track: TTrack,
    ): TTrack => {
      const elementsToSplit = this.elements.filter(
        (target) => target.trackId === track.id,
      );

      if (elementsToSplit.length === 0) {
        return track;
      }

      const elements = track.elements.flatMap((element) => {
        const shouldSplit = elementsToSplit.some(
          (target) => target.elementId === element.id,
        );

        if (!shouldSplit) {
          return [element];
        }

        const effectiveStart = element.startTime;
        const effectiveEnd = element.startTime + element.duration;

        if (
          this.splitTime <= effectiveStart ||
          this.splitTime >= effectiveEnd
        ) {
          return [element];
        }

        const relativeTime = subMediaTime({
          a: this.splitTime,
          b: element.startTime,
        });
        const leftVisibleDuration = relativeTime;
        const rightVisibleDuration = subMediaTime({
          a: element.duration,
          b: relativeTime,
        });
        const retimeRef = isRetimableElement(element)
          ? element.retime
          : undefined;
        // Snap the source-side split point exactly once and derive the right
        // half from it. Independently rounding both spans (left and total)
        // would let a 1-tick rounding error desynchronise them, breaking the
        // invariant `leftSourceSpan + rightSourceSpan == totalSourceSpan`.
        // See the same discipline in `compute-resize.ts` (snap-once comment).
        const leftSourceSpan = roundMediaTime({
          time: getSourceSpanAtClipTime({
            clipTime: leftVisibleDuration,
            retime: retimeRef,
          }),
        });
        const totalSourceSpan = roundMediaTime({
          time: getSourceSpanAtClipTime({
            clipTime: element.duration,
            retime: retimeRef,
          }),
        });
        const rightSourceSpan = subMediaTime({
          a: totalSourceSpan,
          b: leftSourceSpan,
        });
        const { leftAnimations, rightAnimations } = splitAnimationsAtTime({
          animations: element.animations,
          splitTime: relativeTime,
          shouldIncludeSplitBoundary: true,
        });
        let splitResult: TimelineElement[];

        const leftTrimEnd = addMediaTime({
          a: element.trimEnd,
          b: rightSourceSpan,
        });
        const rightTrimStart = addMediaTime({
          a: element.trimStart,
          b: leftSourceSpan,
        });

        if (this.retainSide === "left") {
          splitResult = [
            {
              ...element,
              duration: leftVisibleDuration,
              trimEnd: leftTrimEnd,
              name: `${element.name} (left)`,
              animations: leftAnimations,
              ...(retimeRef !== undefined ? { retime: retimeRef } : {}),
            },
          ];
        } else if (this.retainSide === "right") {
          const newId = generateUUID();
          this.rightSideElements.push({
            trackId: track.id,
            elementId: newId,
          });
          splitResult = [
            {
              ...element,
              id: newId,
              startTime: this.splitTime,
              duration: rightVisibleDuration,
              trimStart: rightTrimStart,
              name: `${element.name} (right)`,
              animations: rightAnimations,
              ...(retimeRef !== undefined ? { retime: retimeRef } : {}),
            },
          ];
        } else {
          const secondElementId = generateUUID();
          this.rightSideElements.push({
            trackId: track.id,
            elementId: secondElementId,
          });
          splitResult = [
            {
              ...element,
              duration: leftVisibleDuration,
              trimEnd: leftTrimEnd,
              name: `${element.name} (left)`,
              animations: leftAnimations,
              ...(retimeRef !== undefined ? { retime: retimeRef } : {}),
            },
            {
              ...element,
              id: secondElementId,
              startTime: this.splitTime,
              duration: rightVisibleDuration,
              trimStart: rightTrimStart,
              name: `${element.name} (right)`,
              animations: rightAnimations,
              ...(retimeRef !== undefined ? { retime: retimeRef } : {}),
            },
          ];
        }

        return splitResult;
      });

      return { ...track, elements } as TTrack;
    };

    const updatedTracks: SceneTracks = {
      overlay: this.savedState.overlay.map((track) => splitTrack(track)),
      main: splitTrack(this.savedState.main),
      audio: this.savedState.audio.map((track) => splitTrack(track)),
    };

    editor.timeline.updateTracks(updatedTracks);

    if (this.rightSideElements.length > 0) {
      return createElementSelectionResult(this.rightSideElements);
    }
    return undefined;
  }

  undo(): void {
    if (this.savedState) {
      const editor = EditorCore.getInstance();
      editor.timeline.updateTracks(this.savedState);
    }
  }
}
