import type { ReactNode } from "react";

export type PreviewOverlayHudAnchor =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type PreviewOverlayMount =
  | {
      kind: "hud";
      anchor: PreviewOverlayHudAnchor;
      order?: number;
    }
  | {
      kind: "scene";
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    }
  | {
      kind: "viewport";
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    };

export type PreviewOverlayPlane = "under-interaction" | "over-interaction";

export interface PreviewOverlayRenderContext {
  sceneHeight: number;
  sceneWidth: number;
}

export interface PreviewOverlayInstance {
  id: string;
  mount: PreviewOverlayMount;
  plane?: PreviewOverlayPlane;
  pointerEvents?: "none" | "auto";
  zIndex?: number;
  render: (context: PreviewOverlayRenderContext) => ReactNode;
}

export interface PreviewOverlayDefinition {
  id: string;
  label: string;
  defaultVisible?: boolean;
}

export interface PreviewOverlayControl extends PreviewOverlayDefinition {
  isVisible: boolean;
}

export interface PreviewOverlaySourceResult {
  definitions: PreviewOverlayDefinition[];
  instances: PreviewOverlayInstance[];
}

export const EMPTY_PREVIEW_OVERLAY_SOURCE_RESULT: PreviewOverlaySourceResult = {
  definitions: [],
  instances: [],
};

export function isPreviewOverlayVisible({
  overlay,
  overlays,
}: {
  overlay: PreviewOverlayDefinition;
  overlays: Record<string, boolean>;
}): boolean {
  return overlays[overlay.id] ?? overlay.defaultVisible ?? true;
}

export function createPreviewOverlayControl({
  overlay,
  overlays,
}: {
  overlay: PreviewOverlayDefinition;
  overlays: Record<string, boolean>;
}): PreviewOverlayControl {
  return {
    ...overlay,
    isVisible: isPreviewOverlayVisible({ overlay, overlays }),
  };
}

export function mergePreviewOverlaySources({
  sources,
}: {
  sources: PreviewOverlaySourceResult[];
}): PreviewOverlaySourceResult {
  const definitionsById = new Map<string, PreviewOverlayDefinition>();
  const instances: PreviewOverlayInstance[] = [];

  for (const source of sources) {
    for (const definition of source.definitions) {
      definitionsById.set(definition.id, definition);
    }
    instances.push(...source.instances);
  }

  return {
    definitions: [...definitionsById.values()],
    instances,
  };
}
