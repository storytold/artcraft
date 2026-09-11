import { EditorCore } from "../../../../core";
import { Command, type CommandResult } from "../../../base-command";
import { isMaskableElement } from "../../../../timeline/element-utils";
import { updateElementInSceneTracks } from "../../../../timeline/track-element-update";
import type { SceneTracks, MaskableElement } from "../../../../timeline/types";

function removeMaskFromElement({
  element,
  maskId,
}: {
  element: MaskableElement;
  maskId: string;
}): MaskableElement {
  const currentMasks = element.masks ?? [];
  const filteredMasks = currentMasks.filter((mask) => mask.id !== maskId);
  return { ...element, masks: filteredMasks };
}

export class RemoveMaskCommand extends Command {
  private savedState: SceneTracks | null = null;
  private readonly trackId: string;
  private readonly elementId: string;
  private readonly maskId: string;

  constructor({
    trackId,
    elementId,
    maskId,
  }: {
    trackId: string;
    elementId: string;
    maskId: string;
  }) {
    super();
    this.trackId = trackId;
    this.elementId = elementId;
    this.maskId = maskId;
  }

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.scenes.getActiveScene().tracks;

    const updatedTracks = updateElementInSceneTracks({
      tracks: this.savedState,
      trackId: this.trackId,
      elementId: this.elementId,
      elementPredicate: isMaskableElement,
      update: (element) => {
        if (!isMaskableElement(element)) return element;
        return removeMaskFromElement({
          element,
          maskId: this.maskId,
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
