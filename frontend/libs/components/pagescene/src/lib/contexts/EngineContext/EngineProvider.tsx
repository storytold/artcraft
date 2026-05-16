import { ReactNode, useEffect, useRef, useState } from "react";
import { EngineContext, setActiveEditor } from "./EngineContext";

import Editor from "../../engine/editor";
import type { PageSceneAdapter } from "../../adapter";
import { getSceneGenerationMetaData } from "../../sceneMetadata";
import { usePageSceneStore } from "../../PageSceneStore";

interface Props {
  sceneToken?: string;
  // The platform-abstraction surface the lib's Editor needs. Built by
  // the artcraft wrapper from Tauri APIs (FetchProxy, GenerateImage,
  // MediaFilesApi, useTabStore for tab cache, etc.) and threaded down.
  adapter: PageSceneAdapter;
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
  adapter,
  cacheJsonString,
  onSceneSerialized,
  children,
}: Props) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  // Hold the latest cache + serialize callback in refs so the engine
  // lifecycle effect can read them in cleanup without re-running on
  // every prop change. (The editor itself doesn't need a mirror ref —
  // closure capture of the local `newEditor` handles cleanup.)
  const cacheRef = useRef(cacheJsonString);
  cacheRef.current = cacheJsonString;
  const onSerializeRef = useRef(onSceneSerialized);
  onSerializeRef.current = onSceneSerialized;
  // Adapter is read at engine-construction time only; ref guards
  // against host-side identity changes triggering unwanted rebuilds.
  const adapterRef = useRef(adapter);
  adapterRef.current = adapter;

  const sceneContainer = usePageSceneStore((s) => s.sceneContainerEl);
  const editorCanvas = usePageSceneStore((s) => s.editorCanvasEl);
  const camViewCanvas = usePageSceneStore((s) => s.camViewCanvasEl);

  useEffect(() => {
    // Engine construction happens once all three DOM nodes are
    // available; callback refs in SceneContainer / EditorCanvas /
    // CameraViewCanvas drive this by setting their nodes (and clearing
    // them to null on unmount).
    if (!sceneContainer || !editorCanvas || !camViewCanvas) return;

    const newEditor = new Editor(adapterRef.current);
    newEditor.initialize({
      sceneToken: sceneToken || "",
      sceneContainerEl: sceneContainer,
      editorCanvasEl: editorCanvas,
      camViewCanvasEl: camViewCanvas,
      cacheJsonString: cacheRef.current,
    });
    setEditor(newEditor);
    setActiveEditor(newEditor);

    // Capture the serialize callback NOW, before any subsequent render
    // can re-point onSerializeRef.current. Hosts typically rebuild this
    // callback whenever sceneToken changes (closing over the new token
    // for the cache write); on an A→B navigation, refs are mutated
    // during the B render BEFORE this effect's cleanup runs. Reading
    // through the ref at cleanup time would call the B-bound callback
    // with A's JSON, writing scene A's content under cache[B] — which
    // surfaces as "wrong scene loaded" on the next revisit to B.
    const onSerializeForThisScene = onSerializeRef.current;

    return () => {
      // Snapshot scene to host-managed cache so we can restore it on
      // remount. Skip if the scene never finished loading; the host's
      // last-known-good cache is preserved on its side.
      if (newEditor.isEngineDataLoaded()) {
        const sceneGenerationMetadata = getSceneGenerationMetaData(newEditor);
        const cacheJson = newEditor.save_manager.getSceneJson({
          sceneGenerationMetadata,
        });
        onSerializeForThisScene?.(JSON.stringify(cacheJson));
      }

      newEditor.unmountEngine();
      setEditor(null);
      setActiveEditor(null);
    };
  }, [sceneToken, sceneContainer, editorCanvas, camViewCanvas]);

  return (
    <EngineContext.Provider value={editor}>{children}</EngineContext.Provider>
  );
};
