import type { TScene } from "./timeline";

export interface TCanvasSize {
  width: number;
  height: number;
}

export interface TProjectSettings {
  fps: number;
  canvasSize: TCanvasSize;
  background: { type: "color"; color: string };
}

export interface TProject {
  id: string;
  name: string;
  scenes: TScene[];
  currentSceneId: string;
  settings: TProjectSettings;
}
