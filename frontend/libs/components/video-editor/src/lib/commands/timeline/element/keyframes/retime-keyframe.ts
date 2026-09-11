import { EditorCore } from "../../../../core";
import { retimeElementKeyframe } from "../../../../animation";
import { Command, type CommandResult } from "../../../base-command";
import { updateElementInSceneTracks } from "../../../../timeline/track-element-update";
import type { AnimationPath } from "../../../../animation/types";
import type { SceneTracks } from "../../../../timeline/types";
import {
  type MediaTime,
  maxMediaTime,
  minMediaTime,
  ZERO_MEDIA_TIME,
} from "../../../../wasm";
import { resolveAnimationTarget } from "../../../../timeline/animation-targets";

export class RetimeKeyframeCommand extends Command {
  private savedState: SceneTracks | null = null;
  private readonly trackId: string;
  private readonly elementId: string;
  private readonly propertyPath: AnimationPath;
  private readonly keyframeId: string;
  private readonly nextTime: MediaTime;

  constructor({
    trackId,
    elementId,
    propertyPath,
    keyframeId,
    nextTime,
  }: {
    trackId: string;
    elementId: string;
    propertyPath: AnimationPath;
    keyframeId: string;
    nextTime: MediaTime;
  }) {
    super();
    this.trackId = trackId;
    this.elementId = elementId;
    this.propertyPath = propertyPath;
    this.keyframeId = keyframeId;
    this.nextTime = nextTime;
  }

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.scenes.getActiveScene().tracks;

    const updatedTracks = updateElementInSceneTracks({
      tracks: this.savedState,
      trackId: this.trackId,
      elementId: this.elementId,
      update: (element) => {
        if (!resolveAnimationTarget({ element, path: this.propertyPath })) {
          return element;
        }

        const boundedTime = maxMediaTime({
          a: ZERO_MEDIA_TIME,
          b: minMediaTime({ a: this.nextTime, b: element.duration }),
        });
        return {
          ...element,
          animations: retimeElementKeyframe({
            animations: element.animations,
            propertyPath: this.propertyPath,
            keyframeId: this.keyframeId,
            time: boundedTime,
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
