// Click handlers for the splash cards. Keeping these out of the modal
// JSX means the modal stays presentation-only and the blank/example
// flows share one place to update when real example scenes ship.

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveEditor } from "@storyteller/ui-pagescene";
import { useSession } from "../../../lib/session";
import { useSceneSplashStore } from "./scene-splash-store";
import { markSplashSeen } from "./useSceneSplashAutoOpen";
import type { ExampleScene } from "./example-scenes";

const DEFAULT_TITLE = "Untitled New Scene";

export function useSceneSplashActions(currentSceneToken: string | undefined) {
  const close = useSceneSplashStore((s) => s.close);
  const { loggedIn } = useSession();
  const navigate = useNavigate();

  const pickBlank = useCallback(async () => {
    // Fresh visits (no token) already mount a blank stage, but calling
    // newScene is harmless and gives the File > New Scene path a single
    // code path with the "had a scene loaded" case.
    await getActiveEditor()?.newScene(DEFAULT_TITLE);
    if (currentSceneToken) navigate("/edit-3d");
    if (loggedIn) markSplashSeen();
    close();
  }, [close, loggedIn, navigate, currentSceneToken]);

  const pickExample = useCallback(
    (scene: ExampleScene) => {
      if (loggedIn) markSplashSeen();
      close();
      navigate(
        `/edit-3d/${scene.sceneToken}?output=${scene.outputToken}`,
      );
    },
    [close, loggedIn, navigate],
  );

  return { pickBlank, pickExample };
}
