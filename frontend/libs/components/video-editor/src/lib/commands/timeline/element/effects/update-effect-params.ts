import { Command, type CommandResult } from "../../../base-command";
import { EditorCore } from "../../../../core";
import { isVisualElement } from "../../../../timeline/element-utils";
import { updateElementInSceneTracks } from "../../../../timeline/track-element-update";
import type { ParamValues } from "../../../../params";
import type { SceneTracks, VisualElement } from "../../../../timeline/types";

function updateEffectParamsOnElement({
  element,
  effectId,
  params,
}: {
  element: VisualElement;
  effectId: string;
  params: Partial<ParamValues>;
}): VisualElement {
  const currentEffects = element.effects ?? [];
  const updated = currentEffects.map((effect) => {
    if (effect.id !== effectId) {
      return effect;
    }

    const nextParams = { ...effect.params };
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        nextParams[key] = value;
      }
    }

    return { ...effect, params: nextParams };
  });
  return { ...element, effects: updated };
}

export class UpdateClipEffectParamsCommand extends Command {
  private savedState: SceneTracks | null = null;
  private readonly trackId: string;
  private readonly elementId: string;
  private readonly effectId: string;
  private readonly params: Partial<ParamValues>;

  constructor({
    trackId,
    elementId,
    effectId,
    params,
  }: {
    trackId: string;
    elementId: string;
    effectId: string;
    params: Partial<ParamValues>;
  }) {
    super();
    this.trackId = trackId;
    this.elementId = elementId;
    this.effectId = effectId;
    this.params = params;
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
        return updateEffectParamsOnElement({
          element: element as VisualElement,
          effectId: this.effectId,
          params: this.params,
        });
      },
    });

    editor.timeline.updateTracks(updatedTracks);
    return undefined;
  }

  undo(): void {
    if (this.savedState) {
      const editor = EditorCore.getInstance();
      editor.timeline.updateTracks(this.savedState);
    }
  }
}
