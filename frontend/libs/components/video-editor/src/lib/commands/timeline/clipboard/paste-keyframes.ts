import { EditorCore } from "../../../core";
import {
  getKeyframeAtTime,
  updateScalarKeyframeCurve,
  upsertPathKeyframe,
} from "../../../animation";
import { Command, type CommandResult } from "../../base-command";
import type { KeyframeClipboardItem } from "../../../clipboard/types";
import type { SceneTracks, TimelineElement } from "../../../timeline/types";
import { updateElementInSceneTracks } from "../../../timeline/track-element-update";
import { resolveAnimationTarget } from "../../../timeline/animation-targets";
import { generateUUID } from "../../../utils/id";
import {
  addMediaTime,
  type MediaTime,
  maxMediaTime,
  minMediaTime,
  ZERO_MEDIA_TIME,
} from "../../../wasm";

function pasteKeyframesIntoElement({
  element,
  time,
  clipboardItems,
}: {
  element: TimelineElement;
  time: MediaTime;
  clipboardItems: KeyframeClipboardItem[];
}): TimelineElement {
  let nextElement = element;

  for (const item of clipboardItems) {
    const target = resolveAnimationTarget({
      element: nextElement,
      path: item.propertyPath,
    });
    if (!target) {
      continue;
    }

    const keyframeTime = maxMediaTime({
      a: ZERO_MEDIA_TIME,
      b: minMediaTime({
        a: addMediaTime({ a: time, b: item.timeOffset }),
        b: nextElement.duration,
      }),
    });
    const nextAnimations = upsertPathKeyframe({
      animations: nextElement.animations,
      propertyPath: item.propertyPath,
      time: keyframeTime,
      value: item.value,
      interpolation: item.interpolation,
      keyframeId: generateUUID(),
      channelLayout: target.channelLayout,
      coerceValue: target.coerceValue,
    });
    const pastedKeyframe = getKeyframeAtTime({
      animations: nextAnimations,
      propertyPath: item.propertyPath,
      time: keyframeTime,
    });

    let patchedAnimations = nextAnimations;
    if (pastedKeyframe) {
      for (const curvePatch of item.curvePatches) {
        const nextPatchedAnimations = updateScalarKeyframeCurve({
          animations: patchedAnimations,
          propertyPath: item.propertyPath,
          componentKey: curvePatch.componentKey,
          keyframeId: pastedKeyframe.id,
          patch: curvePatch.patch,
        });
        patchedAnimations = nextPatchedAnimations ?? patchedAnimations;
      }
    }

    nextElement = {
      ...nextElement,
      animations: patchedAnimations,
    };
  }

  return nextElement;
}

export class PasteKeyframesCommand extends Command {
  private savedState: SceneTracks | null = null;
  private readonly trackId: string;
  private readonly elementId: string;
  private readonly time: MediaTime;
  private readonly clipboardItems: KeyframeClipboardItem[];

  constructor({
    trackId,
    elementId,
    time,
    clipboardItems,
  }: {
    trackId: string;
    elementId: string;
    time: MediaTime;
    clipboardItems: KeyframeClipboardItem[];
  }) {
    super();
    this.trackId = trackId;
    this.elementId = elementId;
    this.time = time;
    this.clipboardItems = clipboardItems;
  }

  execute(): CommandResult | undefined {
    if (this.clipboardItems.length === 0) {
      return undefined;
    }

    const editor = EditorCore.getInstance();
    this.savedState = editor.scenes.getActiveScene().tracks;

    const updatedTracks = updateElementInSceneTracks({
      tracks: this.savedState,
      trackId: this.trackId,
      elementId: this.elementId,
      update: (element) =>
        pasteKeyframesIntoElement({
          element,
          time: this.time,
          clipboardItems: this.clipboardItems,
        }),
    });

    editor.timeline.updateTracks(updatedTracks);
    return undefined;
  }

  undo(): void {
    if (!this.savedState) {
      return;
    }

    const editor = EditorCore.getInstance();
    editor.timeline.updateTracks(this.savedState);
  }
}
