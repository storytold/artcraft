import { ReactNode, useEffect, useRef, useState } from "react";
import { EngineContext, setActiveEditor } from "./EngineContext";

import Editor from "~/pages/PageScene/engine/editor";
import { useTabStore } from "../../../Stores/TabState";
import { getSceneGenerationMetaData } from "../../sceneMetadata";
import { usePageSceneStore } from "~/pages/PageScene/PageSceneStore";
interface Props {
  sceneToken?: string;
  children: ReactNode;
}

export const EngineProvider = ({ sceneToken, children }: Props) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const activeEditorRef = useRef<Editor | null>(null);

  const createEditor = () => {
    return new Editor();
  };
  const tabStore = useTabStore();
  const tab = tabStore.activeTabId;

  const sceneContainer = usePageSceneStore((s) => s.sceneContainerEl);
  const editorCanvas = usePageSceneStore((s) => s.editorCanvasEl);
  const camViewCanvas = usePageSceneStore((s) => s.camViewCanvasEl);
  useEffect(() => {
    if (sceneContainer && editorCanvas && camViewCanvas && tab === "3D") {
      // DO NOTHING if another useEffect already created one and hasn't been removed
      if (activeEditorRef.current) {
        return;
      }

      const newEditor = createEditor();
      console.warn("Creating new Editor instance", newEditor);
      activeEditorRef.current = newEditor;

      // Check if we have a cached state
      const cacheString = tabStore.getTabData("3D") as string;

      newEditor.initialize({
        sceneToken: sceneToken || "",
        sceneContainerEl: sceneContainer,
        editorCanvasEl: editorCanvas,
        camViewCanvasEl: camViewCanvas,
        cacheJsonString: cacheString,
      });
      setEditor(newEditor);
      setActiveEditor(newEditor);
    } else if (tab !== "3D") {
      if (!activeEditorRef.current) {
        return;
      }

      // If the tab is changed, cache state, unmount the editor and clear all input params
      // This condition makes sure the editor saves a fully loaded scene so it doesn't lose data
      // If the load was incomplete, we'll preserve the last cache anyway.
      // FIX: Only save the JSON if the engine scene was loaded and has valid data to be saved
      if (activeEditorRef.current.isEngineDataLoaded()) {
        const sceneGenerationMetadata = getSceneGenerationMetaData(
          activeEditorRef.current,
        );
        const cacheJson = activeEditorRef.current.save_manager.getSceneJson({
          sceneGenerationMetadata: sceneGenerationMetadata,
        });
        const cacheString = JSON.stringify(cacheJson);
        tabStore.updateTabData("3D", cacheString);
      }

      // Unmount/Destructor flow
      activeEditorRef.current?.unmountEngine();
      activeEditorRef.current = null;
      setActiveEditor(null);
      const store = usePageSceneStore.getState();
      store.setSceneContainerEl(null);
      store.setEditorCanvasEl(null);
      store.setCamViewCanvasEl(null);
    }
  }, [sceneToken, editorCanvas, camViewCanvas, setEditor, sceneContainer, tab]);

  return (
    <EngineContext.Provider value={editor}>{children}</EngineContext.Provider>
  );
};
