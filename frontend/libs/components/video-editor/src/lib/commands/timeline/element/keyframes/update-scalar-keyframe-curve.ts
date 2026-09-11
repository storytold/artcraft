import { EditorCore } from "../../../../core";
import {
  updateScalarKeyframeCurve,
} from "../../../../animation";
import { Command, type CommandResult } from "../../../base-command";
import { updateElementInSceneTracks } from "../../../../timeline/track-element-update";
import { resolveAnimationTarget } from "../../../../timeline/animation-targets";
import type {
  AnimationPath,
  ScalarCurveKeyframePatch,
} from "../../../../animation/types";
import type { SceneTracks } from "../../../../timeline/types";

export class UpdateScalarKeyframeCurveCommand extends Command {
  private savedState: SceneTracks | null = null;
  private readonly trackId: string;
  private readonly elementId: string;
  private readonly propertyPath: AnimationPath;
  private readonly componentKey: string;
  private readonly keyframeId: string;
  private readonly patch: ScalarCurveKeyframePatch;

  constructor({
    trackId,
    elementId,
    propertyPath,
    componentKey,
    keyframeId,
    patch,
  }: {
    trackId: string;
    elementId: string;
    propertyPath: AnimationPath;
    componentKey: string;
    keyframeId: string;
    patch: ScalarCurveKeyframePatch;
  }) {
    super();
    this.trackId = trackId;
    this.elementId = elementId;
    this.propertyPath = propertyPath;
    this.componentKey = componentKey;
    this.keyframeId = keyframeId;
    this.patch = patch;
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

        return {
          ...element,
          animations: updateScalarKeyframeCurve({
            animations: element.animations,
            propertyPath: this.propertyPath,
            componentKey: this.componentKey,
            keyframeId: this.keyframeId,
            patch: this.patch,
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
