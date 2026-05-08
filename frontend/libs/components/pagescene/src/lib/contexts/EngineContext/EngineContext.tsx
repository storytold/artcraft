import { createContext } from "react";
import Editor from "../../engine/editor";

export interface EditorExpandedI extends Editor {
  setSceneContainer: React.Dispatch<
    React.SetStateAction<HTMLDivElement | null>
  >;
  setEditorCanvas: React.Dispatch<
    React.SetStateAction<HTMLCanvasElement | null>
  >;
  setCamViewCanvas: React.Dispatch<
    React.SetStateAction<HTMLCanvasElement | null>
  >;
}

export const EngineContext = createContext<Editor | null>(null);

// Module-level handle on the active Editor instance. EngineProvider keeps
// this in sync with its lifecycle. React components should still use
// useContext(EngineContext) — this exists for non-React callers (and for
// cross-page actions that fire before the 3D tab has mounted).
let activeEditor: Editor | null = null;
export const getActiveEditor = (): Editor | null => activeEditor;
export const setActiveEditor = (editor: Editor | null): void => {
  activeEditor = editor;
};
