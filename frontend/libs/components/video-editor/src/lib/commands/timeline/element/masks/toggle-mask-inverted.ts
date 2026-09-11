import { EditorCore } from "../../../../core";
import { Command, type CommandResult } from "../../../base-command";
import { isMaskableElement } from "../../../../timeline/element-utils";
import { updateElementInSceneTracks } from "../../../../timeline/track-element-update";
import type { Mask } from "../../../../masks/types";
import type { SceneTracks, MaskableElement } from "../../../../timeline/types";

export function toggleMaskInvertedOnElement({
  element,
  maskId,
}: {
  element: MaskableElement;
  maskId: string;
}): MaskableElement {
  const currentMasks = element.masks ?? [];
  const toggleMask = <TMask extends Mask>(mask: TMask): TMask => ({
    ...mask,
    params: {
      ...mask.params,
      inverted: !mask.params.inverted,
    },
  });
  const updatedMasks = currentMasks.map((mask) =>
    mask.id !== maskId ? mask : toggleMask(mask),
  );

  return { ...element, masks: updatedMasks };
}

export class ToggleMaskInvertedCommand extends Command {
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
        return toggleMaskInvertedOnElement({
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
