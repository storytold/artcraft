// Mirrors the splash modal's visibility into the lib's PageSceneStore
// (`hostOverlayVisible`). The lib uses that flag to suppress in-editor
// affordances that would otherwise bleed through or behind the modal —
// e.g. Controls3D's empty-scene "Click + to add your first asset!"
// bouncing hint.
//
// Lives alongside the splash so the contract between webapp host and
// lib stays in one place.

import { useEffect } from "react";
import { usePageSceneStore } from "@storyteller/ui-pagescene";
import { useSceneSplashStore } from "./scene-splash-store";

export function useSceneSplashLibSync(): void {
  const isOpen = useSceneSplashStore((s) => s.isOpen);

  useEffect(() => {
    usePageSceneStore.getState().setHostOverlayVisible(isOpen);
    return () => {
      usePageSceneStore.getState().setHostOverlayVisible(false);
    };
  }, [isOpen]);
}
