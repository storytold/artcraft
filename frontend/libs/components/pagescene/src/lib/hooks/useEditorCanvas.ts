import { usePageSceneStore } from "../PageSceneStore";

// React-shaped accessors for the canvas DOM nodes that the engine
// renders into. The underlying storage is the Zustand store (set by
// EngineCanvases on mount); the selector triggers a re-render whenever
// the canvas mounts/unmounts.

export function useEditorCanvas(): HTMLCanvasElement | null {
  return usePageSceneStore((s) => s.editorCanvasEl);
}

export function useCamViewCanvas(): HTMLCanvasElement | null {
  return usePageSceneStore((s) => s.camViewCanvasEl);
}
