// Artcraft Tauri-specific 3D editor route. Mounts the lib's Stage3D
// with a Tauri-built adapter; manages tab-cache and the URL ↔ scene
// token sync (both are host-platform concerns the lib stays out of).
//
// The website host mounts the same Stage3D with a web-built adapter
// and its own router-flavored equivalents of these effects.

import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSignalEffect } from "@preact/signals-react/runtime";
import { Stage3D, usePageSceneStore } from "@storyteller/ui-pagescene";
import { galleryDragHidesImmediately } from "@storyteller/ui-gallery-modal";
import { useTabStore } from "~/pages/Stores/TabState";
import { authentication, scene } from "~/signals";
import { getCurrentLocationWithoutParams } from "~/utilities";
import { useTauriPageSceneAdapter } from "./useTauriPageSceneAdapter";

export const PageScene = ({ sceneToken }: { sceneToken?: string }) => {
  // Tab-cache plumbing. Stage3D is single-instance and tab-agnostic;
  // the host decides where the in-memory cache string lives.
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

  // Mirror the host's authentication signal into the lib store so
  // ControlsTopButtons can do ownership permission checks reactively.
  useSignalEffect(() => {
    usePageSceneStore
      .getState()
      .setCurrentUserToken(authentication.userInfo.value?.user_token);
  });

  // On the 3D editor the primary drop target is the scene behind the gallery
  // modal, so dragging an asset should hide the gallery immediately (rather than
  // only once the cursor leaves the modal). PageScene mounts/unmounts with the
  // 3D tab, so flip the flag back off on leave.
  useEffect(() => {
    galleryDragHidesImmediately.value = true;
    return () => {
      galleryDragHidesImmediately.value = false;
    };
  }, []);

  // URL ↔ loaded scene sync. Lives in the host wrapper so the lib
  // stays router-agnostic.
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
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

  // Sized container for Stage3D. The lib fills its parent; the
  // Tauri host's TopBar lives outside this box, so we reserve space
  // here. 56px matches the `.topbar-spacer` height in base.css.
  return (
    <div className="w-screen" style={{ height: "calc(100vh - 56px)" }}>
      <Stage3D
        adapter={adapter}
        sceneToken={sceneToken}
        cacheJsonString={cacheJsonString}
        onSceneSerialized={onSceneSerialized}
        modelSelectorPlacement="prompt-box"
      />
    </div>
  );
};
