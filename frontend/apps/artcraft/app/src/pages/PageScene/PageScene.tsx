// 3D editor route — mounted by MainApp's tab switch only when
// activeTabId === "3D". React mount/unmount drives the engine
// lifecycle: provider mounts → engine constructs once canvas refs
// are populated; provider unmounts → engine tears down via the
// EngineProvider cleanup. The host's tab cache (useTabStore) holds
// the serialized scene JSON across mount/unmount so we don't lose
// scene state when the user briefly visits another tab.

import { useEffect } from "react";
import {
  DragComponent,
  EditorLoadingBar,
  EngineProvider,
  PrecisionSelector,
  usePageSceneStore,
} from "@storyteller/ui-pagescene";
import { useTabStore } from "~/pages/Stores/TabState";
import { PageEditor } from "~/pages/PageScene/PageEditor";
import { useTauriPageSceneAdapter } from "./useTauriPageSceneAdapter";

export const PageScene = ({ sceneToken }: { sceneToken?: string }) => {
  // Tab-cache plumbing. The provider only knows about its own React
  // lifecycle; the host decides where the in-memory cache string
  // lives. Reading the current value once on render is fine — the
  // provider snapshots it on mount, and the cache is per-mount.
  const tabStore = useTabStore();
  const cacheJsonString = tabStore.getTabData("3D") as string | undefined;
  const onSceneSerialized = (json: string) => {
    tabStore.updateTabData("3D", json);
  };

  const adapter = useTauriPageSceneAdapter({
    initialSceneToken: sceneToken,
    cacheJsonString,
    onSceneSerialized,
  });

  // The 3D-page-mounted flag is read by the engine's remountEngine()
  // gate. With MainApp's tab switch, our React mount IS the signal —
  // no need for callers (TopBar, appMenu, ImageTo3DExperience) to
  // imperatively flip it.
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
      <PageEditor />
      <DragComponent />
      <PrecisionSelector />
      <EditorLoadingBar />
    </EngineProvider>
  );
};
