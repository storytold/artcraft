import { EditorCore } from "../../../../core";
import { Command, type CommandResult } from "../../../base-command";
import {
  buildEffectParamPath,
  upsertPathKeyframe,
} from "../../../../animation";
import { updateElementInSceneTracks } from "../../../../timeline/track-element-update";
import { isVisualElement } from "../../../../timeline/element-utils";
import { resolveAnimationTarget } from "../../../../timeline/animation-targets";
import type { AnimationInterpolation } from "../../../../animation/types";
import type { SceneTracks } from "../../../../timeline/types";
import {
  type MediaTime,
  maxMediaTime,
  minMediaTime,
  ZERO_MEDIA_TIME,
} from "../../../../wasm";

export class UpsertEffectParamKeyframeCommand extends Command {
  private savedState: SceneTracks | null = null;
  private readonly trackId: string;
  private readonly elementId: string;
  private readonly effectId: string;
  private readonly paramKey: string;
  private readonly time: MediaTime;
  private readonly value: number | string | boolean;
  private readonly interpolation: AnimationInterpolation | undefined;
  private readonly keyframeId: string | undefined;

  constructor({
    trackId,
    elementId,
    effectId,
    paramKey,
    time,
    value,
    interpolation,
    keyframeId,
  }: {
    trackId: string;
    elementId: string;
    effectId: string;
    paramKey: string;
    time: MediaTime;
    value: number | string | boolean;
    interpolation?: AnimationInterpolation;
    keyframeId?: string;
  }) {
    super();
    this.trackId = trackId;
    this.elementId = elementId;
    this.effectId = effectId;
    this.paramKey = paramKey;
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
      elementPredicate: isVisualElement,
      update: (element) => {
        const boundedTime = maxMediaTime({
          a: ZERO_MEDIA_TIME,
          b: minMediaTime({ a: this.time, b: element.duration }),
        });
        const propertyPath = buildEffectParamPath({
          effectId: this.effectId,
          paramKey: this.paramKey,
        });
        const target = resolveAnimationTarget({
          element,
          path: propertyPath,
        });
        if (!target) {
          return element;
        }

        const animations = upsertPathKeyframe({
          animations: element.animations,
          propertyPath,
          time: boundedTime,
          value: this.value,
          interpolation: this.interpolation,
          keyframeId: this.keyframeId,
          channelLayout: target.channelLayout,
          coerceValue: target.coerceValue,
        });
        return { ...element, animations };
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
