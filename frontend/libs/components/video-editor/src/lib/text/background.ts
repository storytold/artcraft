export const CORNER_RADIUS_MIN = 0;
export const CORNER_RADIUS_MAX = 100;

// Configuration block for the optional background plate behind text
// elements. Stored flat in the element's `params` map (background.color,
// background.enabled, etc.); this struct is the resolved shape that
// the renderer + properties panel use.
export interface TextBackground {
  enabled: boolean;
  color: string;
  cornerRadius?: number;
  paddingX?: number;
  paddingY?: number;
  offsetX?: number;
  offsetY?: number;
}
