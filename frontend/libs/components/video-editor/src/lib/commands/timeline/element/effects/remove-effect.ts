import { Command, type CommandResult } from "../../../base-command";
import { EditorCore } from "../../../../core";
import { isVisualElement } from "../../../../timeline/element-utils";
import { updateElementInSceneTracks } from "../../../../timeline/track-element-update";
import type { SceneTracks, VisualElement } from "../../../../timeline/types";

function removeEffectFromElement({
  element,
  effectId,
}: {
  element: VisualElement;
  effectId: string;
}): VisualElement {
  const currentEffects = element.effects ?? [];
  const filtered = currentEffects.filter((effect) => effect.id !== effectId);
  return { ...element, effects: filtered };
}

export class RemoveClipEffectCommand extends Command {
  private savedState: SceneTracks | null = null;
  private readonly trackId: string;
  private readonly elementId: string;
  private readonly effectId: string;

  constructor({
    trackId,
    elementId,
    effectId,
  }: {
    trackId: string;
    elementId: string;
    effectId: string;
  }) {
    super();
    this.trackId = trackId;
    this.elementId = elementId;
    this.effectId = effectId;
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
        return removeEffectFromElement({
          element: element as VisualElement,
          effectId: this.effectId,
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
