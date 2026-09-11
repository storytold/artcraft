import { Command, type CommandResult } from "../../../base-command";
import { EditorCore } from "../../../../core";
import { isVisualElement } from "../../../../timeline/element-utils";
import { updateElementInSceneTracks } from "../../../../timeline/track-element-update";
import type { SceneTracks, VisualElement } from "../../../../timeline/types";

export function toggleEffectOnElement({
  element,
  effectId,
}: {
  element: VisualElement;
  effectId: string;
}): VisualElement {
  const currentEffects = element.effects ?? [];
  const updated = currentEffects.map((effect) =>
    effect.id === effectId ? { ...effect, enabled: !effect.enabled } : effect,
  );
  return { ...element, effects: updated };
}

export class ToggleClipEffectCommand extends Command {
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
        return toggleEffectOnElement({
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
