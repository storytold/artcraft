"use client";

import { PEN_CURSOR } from "./cursors";
import { usePreviewViewport } from "./preview-viewport";
// TODO: useMaskHandles is exported from
// opencut-classic/apps/web/src/masks/use-mask-handles.ts and hasn't been
// ported yet. Once the mask handles hook lands in `../../masks/`, replace
// this stub with `import { useMaskHandles } from "../../masks/use-mask-handles";`
// and restore the full body below.
import { maskHandleIdKey, type MaskHandleId } from "../../masks/types";
import type { SnapLine } from "../preview-snap";
import {
  CornerHandle,
  CircleHandle,
  CanvasPathOutline,
  EdgeHandle,
  IconHandle,
  LineOverlay,
  BoundingBoxOutline,
  ShapeOutline,
} from "./handle-primitives";

const CUSTOM_MASK_ANCHOR_SIZE = 7;
import { Rotate01Icon, FeatherIcon } from "@hugeicons/core-free-icons";

// TODO(use-mask-handles): re-enable as soon as the hook is ported. For now we
// expose a no-op component so MaskHandles remains importable and the rest of
// the preview surface compiles. Suppressing the unused imports above lets the
// real implementation reuse them.
void CornerHandle;
void CircleHandle;
void CanvasPathOutline;
void EdgeHandle;
void IconHandle;
void LineOverlay;
void BoundingBoxOutline;
void ShapeOutline;
void CUSTOM_MASK_ANCHOR_SIZE;
void Rotate01Icon;
void FeatherIcon;
void PEN_CURSOR;
void maskHandleIdKey;

export function MaskHandles({
  onSnapLinesChange,
}: {
  onSnapLinesChange?: (lines: SnapLine[]) => void;
}) {
  // Touch hooks so future implementations stay aligned with the public surface
  // expected by PreviewInteractionOverlay.
  usePreviewViewport();
  void onSnapLinesChange;

  // No-op until masks/use-mask-handles is ported. See TODO above.
  return null;
}

export type { MaskHandleId };
