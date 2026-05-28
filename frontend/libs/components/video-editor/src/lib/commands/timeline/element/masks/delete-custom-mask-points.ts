import { EditorCore } from "../../../../core";
import { Command, type CommandResult } from "../../../base-command";
import {
  getFreeformPathClosedStateAfterPointRemoval,
  removeFreeformPathPoints,
} from "../../../../masks/freeform/path";
import type { FreeformPathMask } from "../../../../masks/types";
import { isMaskableElement } from "../../../../timeline/element-utils";
import { updateElementInSceneTracks } from "../../../../timeline/track-element-update";
import type { MaskableElement, SceneTracks } from "../../../../timeline/types";

function deletePointsFromFreeformPathMask({
  mask,
  pointIds,
}: {
  mask: FreeformPathMask;
  pointIds: string[];
}): FreeformPathMask {
  const points = mask.params.path;
  const nextPoints = removeFreeformPathPoints({ points, pointIds });
  if (nextPoints.length === points.length) {
    return mask;
  }

  return {
    ...mask,
    params: {
      ...mask.params,
      path: nextPoints,
      closed: getFreeformPathClosedStateAfterPointRemoval({
        wasClosed: mask.params.closed,
        remainingPointCount: nextPoints.length,
      }),
    },
  };
}

function deletePointsFromElementMask({
  element,
  maskId,
  pointIds,
}: {
  element: MaskableElement;
  maskId: string;
  pointIds: string[];
}): { element: MaskableElement; didDeletePoints: boolean } {
  const currentMasks = element.masks ?? [];
  let didDeletePoints = false;
  const nextMasks = currentMasks.map((mask) => {
    if (mask.id !== maskId || mask.type !== "freeform") {
      return mask;
    }

    const nextMask = deletePointsFromFreeformPathMask({
      mask,
      pointIds,
    });
    didDeletePoints ||= nextMask !== mask;
    return nextMask;
  });

  return {
    element: didDeletePoints ? { ...element, masks: nextMasks } : element,
    didDeletePoints,
  };
}

export class DeleteFreeformPathMaskPointsCommand extends Command {
  private savedState: SceneTracks | null = null;
  private readonly trackId: string;
  private readonly elementId: string;
  private readonly maskId: string;
  private readonly pointIds: string[];

  constructor({
    trackId,
    elementId,
    maskId,
    pointIds,
  }: {
    trackId: string;
    elementId: string;
    maskId: string;
    pointIds: string[];
  }) {
    super();
    this.trackId = trackId;
    this.elementId = elementId;
    this.maskId = maskId;
    this.pointIds = pointIds;
  }

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.scenes.getActiveScene().tracks;

    let didDeletePoints = false;
    const updatedTracks = updateElementInSceneTracks({
      tracks: this.savedState,
      trackId: this.trackId,
      elementId: this.elementId,
      elementPredicate: isMaskableElement,
      update: (element) => {
        if (!isMaskableElement(element)) return element;
        const result = deletePointsFromElementMask({
          element,
          maskId: this.maskId,
          pointIds: this.pointIds,
        });
        didDeletePoints ||= result.didDeletePoints;
        return result.element;
      },
    });

    if (didDeletePoints) {
      editor.timeline.updateTracks(updatedTracks);
      return {
        selection: {
          selectedMaskPoints: null,
        },
      };
    }

    return undefined;
  }

  undo(): void {
    if (this.savedState) {
      const editor = EditorCore.getInstance();
      editor.timeline.updateTracks(this.savedState);
    }
  }
}
