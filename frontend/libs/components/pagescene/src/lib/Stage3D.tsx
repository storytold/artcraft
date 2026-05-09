// Public top-level component for the 3D editor. Hosts mount this
// inside their route/tab and pass a PageSceneAdapter; everything
// else (engine lifecycle, body composition, controls) is lib-owned.
//
// Usage (artcraft Tauri):
//   <Stage3D adapter={tauriAdapter} sceneToken={params.sceneToken} />
//
// Usage (artcraft-website):
//   <Stage3D adapter={webAdapter} sceneToken={params.sceneToken} />

import { useEffect } from "react";
import type { PageSceneAdapter } from "./adapter";
import { EngineProvider } from "./contexts/EngineContext/EngineProvider";
import { DragComponent } from "./comps/DragComponent/DragComponent";
import { EditorLoadingBar } from "./comps/EditorLoadingBar";
import { PrecisionSelector } from "./comps/PrecisionSelector/PrecisionSelector";
import { Stage3DBody } from "./Stage3DBody";
import { usePageSceneStore } from "./PageSceneStore";

export interface Stage3DProps {
  adapter: PageSceneAdapter;
  sceneToken?: string;
  /** In-memory restore — host stashes serialized scene JSON across
   *  remount and supplies it here. The lib snapshots on mount only. */
  cacheJsonString?: string;
  /** Called on unmount with the serialized scene JSON. The host
   *  decides where to put it (tab store, localStorage, nowhere). */
  onSceneSerialized?: (json: string) => void;
}

export const Stage3D = ({
  adapter,
  sceneToken,
  cacheJsonString,
  onSceneSerialized,
}: Stage3DProps) => {
  // Engine's remountEngine() gate reads is3DPageMounted. With Stage3D
  // mounting only when the host's tab/route puts us on screen, the
  // React lifecycle IS the signal — host code shouldn't need to flip
  // the flag manually.
  useEffect(() => {
    usePageSceneStore.getState().set3DPageMounted(true);
    return () => {
      usePageSceneStore.getState().set3DPageMounted(false);
    };
  }, []);

  return (
    <EngineProvider
      sceneToken={sceneToken}
      adapter={adapter}
      cacheJsonString={cacheJsonString}
      onSceneSerialized={onSceneSerialized}
    >
      <Stage3DBody />
      <DragComponent />
      <PrecisionSelector />
      <EditorLoadingBar />
    </EngineProvider>
  );
};
