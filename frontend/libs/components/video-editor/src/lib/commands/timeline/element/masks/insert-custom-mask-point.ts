import { EditorCore } from "../../../../core";
import { Command, type CommandResult } from "../../../base-command";
import { insertPointOnFreeformSegment } from "../../../../masks/freeform/definition";
import type { ElementBounds } from "../../../../preview/element-bounds";
import type { FreeformPathMask } from "../../../../masks/types";
import { isMaskableElement } from "../../../../timeline/element-utils";
import { updateElementInSceneTracks } from "../../../../timeline/track-element-update";
import type { MaskableElement, SceneTracks } from "../../../../timeline/types";

function insertPointIntoFreeformPathMask({
  mask,
  segmentIndex,
  canvasPoint,
  bounds,
}: {
  mask: FreeformPathMask;
  segmentIndex: number;
  canvasPoint: { x: number; y: number };
  bounds: ElementBounds;
}): { mask: FreeformPathMask; insertedPointId: string | null } {
  const result = insertPointOnFreeformSegment({
    params: mask.params,
    segmentIndex,
    canvasPoint,
    bounds,
  });
  if (!result) {
    return {
      mask,
      insertedPointId: null,
    };
  }

  return {
    mask: {
      ...mask,
      params: result.params,
    },
    insertedPointId: result.pointId,
  };
}

function insertPointIntoElementMask({
  element,
  maskId,
  segmentIndex,
  canvasPoint,
  bounds,
}: {
  element: MaskableElement;
  maskId: string;
  segmentIndex: number;
  canvasPoint: { x: number; y: number };
  bounds: ElementBounds;
}): {
  element: MaskableElement;
  didInsertPoint: boolean;
  insertedPointId: string | null;
} {
  const currentMasks = element.masks ?? [];
  let insertedPointId: string | null = null;
  let didInsertPoint = false;

  const nextMasks = currentMasks.map((mask) => {
    if (mask.id !== maskId || mask.type !== "freeform") {
      return mask;
    }

    const result = insertPointIntoFreeformPathMask({
      mask,
      segmentIndex,
      canvasPoint,
      bounds,
    });
    if (result.insertedPointId) {
      insertedPointId = result.insertedPointId;
      didInsertPoint = true;
    }
    return result.mask;
  });

  return {
    element: didInsertPoint ? { ...element, masks: nextMasks } : element,
    didInsertPoint,
    insertedPointId,
  };
}

export class InsertFreeformPathMaskPointCommand extends Command {
  private savedState: SceneTracks | null = null;
  private readonly trackId: string;
  private readonly elementId: string;
  private readonly maskId: string;
  private readonly segmentIndex: number;
  private readonly canvasPoint: { x: number; y: number };
  private readonly bounds: ElementBounds;

  constructor({
    trackId,
    elementId,
    maskId,
    segmentIndex,
    canvasPoint,
    bounds,
  }: {
    trackId: string;
    elementId: string;
    maskId: string;
    segmentIndex: number;
    canvasPoint: { x: number; y: number };
    bounds: ElementBounds;
  }) {
    super();
    this.trackId = trackId;
    this.elementId = elementId;
    this.maskId = maskId;
    this.segmentIndex = segmentIndex;
    this.canvasPoint = canvasPoint;
    this.bounds = bounds;
  }

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.scenes.getActiveScene().tracks;

    let didInsertPoint = false;
    let insertedPointId: string | null = null;
    const updatedTracks = updateElementInSceneTracks({
      tracks: this.savedState,
      trackId: this.trackId,
      elementId: this.elementId,
      elementPredicate: isMaskableElement,
      update: (element) => {
        if (!isMaskableElement(element)) return element;
        const result = insertPointIntoElementMask({
          element,
          maskId: this.maskId,
          segmentIndex: this.segmentIndex,
          canvasPoint: this.canvasPoint,
          bounds: this.bounds,
        });
        didInsertPoint ||= result.didInsertPoint;
        insertedPointId ??= result.insertedPointId;
        return result.element;
      },
    });

    if (!didInsertPoint || !insertedPointId) {
      return undefined;
    }

    editor.timeline.updateTracks(updatedTracks);
    return {
      selection: {
        selectedMaskPoints: {
          trackId: this.trackId,
          elementId: this.elementId,
          maskId: this.maskId,
          pointIds: [insertedPointId],
        },
      },
    };
  }

  undo(): void {
    if (this.savedState) {
      const editor = EditorCore.getInstance();
      editor.timeline.updateTracks(this.savedState);
    }
  }
}
