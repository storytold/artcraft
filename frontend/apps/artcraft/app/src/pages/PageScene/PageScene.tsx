// 3D editor route — mounted by MainApp's tab switch only when
// activeTabId === "3D". React mount/unmount drives the engine
// lifecycle: provider mounts → engine constructs once canvas refs
// are populated; provider unmounts → engine tears down via the
// EngineProvider cleanup. The host's tab cache (useTabStore) holds
// the serialized scene JSON across mount/unmount so we don't lose
// scene state when the user briefly visits another tab.

import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSignalEffect } from "@preact/signals-react/runtime";
import {
  DragComponent,
  EditorLoadingBar,
  EngineProvider,
  PrecisionSelector,
  usePageSceneStore,
} from "@storyteller/ui-pagescene";
import { useTabStore } from "~/pages/Stores/TabState";
import { authentication, scene } from "~/signals";
import { getCurrentLocationWithoutParams } from "~/utilities";
import { PageEditor } from "~/pages/PageScene/PageEditor";
import { useTauriPageSceneAdapter } from "./useTauriPageSceneAdapter";

export const PageScene = ({ sceneToken }: { sceneToken?: string }) => {
  // Route-aware bookkeeping — lifted out of ControlsTopButtons so the
  // lib stays router-agnostic. Keeps the URL in sync with the
  // currently loaded scene's token so a refresh / share preserves
  // the scene selection.
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
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

  // Mirror the host's authentication signal into the lib store so
  // lib-resident UI (ControlsTopButtons) can do ownership permission
  // checks without depending on the host's signal system.
  useSignalEffect(() => {
    usePageSceneStore
      .getState()
      .setCurrentUserToken(authentication.userInfo.value?.user_token);
  });

  // URL ↔ loaded scene sync. Mirrors the previous useSignalEffect
  // that lived inside ControlsTopButtons; lives here so the lib
  // doesn't need react-router-dom.
  useSignalEffect(() => {
    if (scene.value.isInitializing) return;
    const currentLocation = getCurrentLocationWithoutParams(
      location.pathname,
      params,
    );
    if (scene.value.token === undefined) {
      if (params.sceneToken) {
        history.pushState({}, "", currentLocation);
      }
      navigate(currentLocation, { replace: true });
    } else if (scene.value.token) {
      if (params.sceneToken && scene.value.token !== params.sceneToken) {
        history.pushState({}, "", currentLocation + scene.value.token);
      }
      navigate(currentLocation + scene.value.token, { replace: true });
    }
  });

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
