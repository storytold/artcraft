import type { FrameRate } from "opencut-wasm";
import type { MediaTime } from "../wasm";

// NOTE: TScene type is intentionally `unknown` here for phase-1 port.
// The real TScene lives in timeline/types.ts and pulls in animation/effects/
// masks chains that aren't yet fully ported. Once timeline/types lands,
// replace this with `import type { TScene } from "../timeline/types"`.
type TSceneStub = unknown;

export type TBackground =
  | {
      type: "color";
      color: string;
    }
  | {
      type: "blur";
      blurIntensity: number;
    };

export interface TCanvasSize {
  width: number;
  height: number;
}

export interface TProjectMetadata {
  id: string;
  name: string;
  thumbnail?: string;
  duration: MediaTime;
  createdAt: Date;
  updatedAt: Date;
}

export interface TProjectSettings {
  fps: FrameRate;
  canvasSize: TCanvasSize;
  canvasSizeMode?: "preset" | "custom";
  lastCustomCanvasSize?: TCanvasSize | null;
  originalCanvasSize?: TCanvasSize | null;
  background: TBackground;
}

export interface TTimelineViewState {
  zoomLevel: number;
  scrollLeft: number;
  playheadTime: MediaTime;
}

export interface TProject {
  metadata: TProjectMetadata;
  scenes: TSceneStub[];
  currentSceneId: string;
  settings: TProjectSettings;
  version: number;
  timelineViewState?: TTimelineViewState;
}

export type TProjectSortKey = "createdAt" | "updatedAt" | "name" | "duration";
export type TSortOrder = "asc" | "desc";
export type TProjectSortOption = `${TProjectSortKey}-${TSortOrder}`;
