import { ReactNode, useEffect, useRef, useState } from "react";
import { EngineContext, setActiveEditor } from "./EngineContext";

import Editor from "~/pages/PageScene/engine/editor";
import { getSceneGenerationMetaData } from "../../sceneMetadata";
import { usePageSceneStore } from "~/pages/PageScene/PageSceneStore";

interface Props {
  sceneToken?: string;
  // In-memory restore: if provided, the engine deserializes this on
  // mount instead of fetching the scene by token. Host-supplied (e.g.
  // artcraft sources it from useTabStore so tab switches preserve the
  // scene without an HTTP roundtrip).
  cacheJsonString?: string;
  // In-memory save: called on unmount with the serialized scene JSON.
  // The host stashes it wherever it likes (tabStore, localStorage,
  // nowhere) — the lib stays storage-agnostic.
  onSceneSerialized?: (json: string) => void;
  children: ReactNode;
}

// Drives the Editor lifecycle from React mount/unmount + the
// availability of the canvas DOM nodes. No tab knowledge — the host
// decides when this provider is mounted (e.g. only when the 3D tab is
// active). When the canvases unmount, callback refs nulled in
// PageSceneStore drive the cleanup branch of this effect.
export const EngineProvider = ({
  sceneToken,
  cacheJsonString,
  onSceneSerialized,
  children,
}: Props) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const activeEditorRef = useRef<Editor | null>(null);
  // Hold the latest cache + serialize callback in refs so the engine
  // lifecycle effect can read them in cleanup without re-running on
  // every prop change.
  const cacheRef = useRef(cacheJsonString);
  cacheRef.current = cacheJsonString;
  const onSerializeRef = useRef(onSceneSerialized);
  onSerializeRef.current = onSceneSerialized;

  const sceneContainer = usePageSceneStore((s) => s.sceneContainerEl);
  const editorCanvas = usePageSceneStore((s) => s.editorCanvasEl);
  const camViewCanvas = usePageSceneStore((s) => s.camViewCanvasEl);

  useEffect(() => {
    // Engine construction happens once all three DOM nodes are
    // available; callback refs in SceneContainer / EditorCanvas /
    // CameraViewCanvas drive this by setting their nodes (and clearing
    // them to null on unmount).
    if (!sceneContainer || !editorCanvas || !camViewCanvas) return;
    if (activeEditorRef.current) return;

    const newEditor = new Editor();
    activeEditorRef.current = newEditor;

    newEditor.initialize({
      sceneToken: sceneToken || "",
      sceneContainerEl: sceneContainer,
      editorCanvasEl: editorCanvas,
      camViewCanvasEl: camViewCanvas,
      cacheJsonString: cacheRef.current,
    });
    setEditor(newEditor);
    setActiveEditor(newEditor);

    return () => {
      const live = activeEditorRef.current;
      if (!live) return;

      // Snapshot scene to host-managed cache so we can restore it on
      // remount. Skip if the scene never finished loading; the host's
      // last-known-good cache is preserved on its side.
      if (live.isEngineDataLoaded()) {
        const sceneGenerationMetadata = getSceneGenerationMetaData(live);
        const cacheJson = live.save_manager.getSceneJson({
          sceneGenerationMetadata,
        });
        onSerializeRef.current?.(JSON.stringify(cacheJson));
      }

      live.unmountEngine();
      activeEditorRef.current = null;
      setEditor(null);
      setActiveEditor(null);
    };
  }, [sceneToken, sceneContainer, editorCanvas, camViewCanvas]);

  return (
    <EngineContext.Provider value={editor}>{children}</EngineContext.Provider>
  );
};
