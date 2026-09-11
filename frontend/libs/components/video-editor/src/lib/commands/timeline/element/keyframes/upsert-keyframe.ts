import { EditorCore } from "../../../../core";
import { Command, type CommandResult } from "../../../base-command";
import { upsertPathKeyframe } from "../../../../animation";
import { updateElementInSceneTracks } from "../../../../timeline/track-element-update";
import type { SceneTracks } from "../../../../timeline/types";
import { resolveAnimationTarget } from "../../../../timeline/animation-targets";
import type {
  AnimationPath,
  AnimationInterpolation,
} from "../../../../animation/types";
import type { ParamValue } from "../../../../params";
import {
  type MediaTime,
  maxMediaTime,
  minMediaTime,
  ZERO_MEDIA_TIME,
} from "../../../../wasm";

export class UpsertKeyframeCommand extends Command {
  private savedState: SceneTracks | null = null;
  private readonly trackId: string;
  private readonly elementId: string;
  private readonly propertyPath: AnimationPath;
  private readonly time: MediaTime;
  private readonly value: ParamValue;
  private readonly interpolation: AnimationInterpolation | undefined;
  private readonly keyframeId: string | undefined;

  constructor({
    trackId,
    elementId,
    propertyPath,
    time,
    value,
    interpolation,
    keyframeId,
  }: {
    trackId: string;
    elementId: string;
    propertyPath: AnimationPath;
    time: MediaTime;
    value: ParamValue;
    interpolation?: AnimationInterpolation;
    keyframeId?: string;
  }) {
    super();
    this.trackId = trackId;
    this.elementId = elementId;
    this.propertyPath = propertyPath;
    this.time = time;
    this.value = value;
    this.interpolation = interpolation;
    this.keyframeId = keyframeId;
  }

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.scenes.getActiveScene().tracks;

    const updatedTracks = updateElementInSceneTracks({
      tracks: this.savedState,
      trackId: this.trackId,
      elementId: this.elementId,
      update: (element) => {
        const target = resolveAnimationTarget({
          element,
          path: this.propertyPath,
        });
        if (!target) {
          return element;
        }

        const boundedTime = maxMediaTime({
          a: ZERO_MEDIA_TIME,
          b: minMediaTime({ a: this.time, b: element.duration }),
        });
        return {
          ...element,
          animations: upsertPathKeyframe({
            animations: element.animations,
            propertyPath: this.propertyPath,
            time: boundedTime,
            value: this.value,
            interpolation: this.interpolation,
            keyframeId: this.keyframeId,
            channelLayout: target.channelLayout,
            coerceValue: target.coerceValue,
          }),
        };
      },
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
