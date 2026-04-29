import { useEffect, useState } from "react";
import {
  camViewCanvasSignal,
  editorCanvasSignal,
} from "~/pages/PageScene/contexts/EngineContext";

// React-shaped accessors for the canvas DOM nodes that the engine
// renders into. The underlying storage is a signal (set by
// EngineCanvases on mount); these hooks convert that to React state so
// dependent useEffects re-run when the canvas mounts/unmounts.

export function useEditorCanvas(): HTMLCanvasElement | null {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(
    editorCanvasSignal.value,
  );
  useEffect(() => editorCanvasSignal.subscribe(setCanvas), []);
  return canvas;
}

export function useCamViewCanvas(): HTMLCanvasElement | null {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(
    camViewCanvasSignal.value,
  );
  useEffect(() => camViewCanvasSignal.subscribe(setCanvas), []);
  return canvas;
}
