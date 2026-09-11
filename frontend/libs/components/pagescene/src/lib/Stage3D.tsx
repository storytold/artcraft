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
  /** Show the bottom-right "Costs" cost-calculator button. Defaults
   *  to true so existing hosts (Tauri) keep their current chrome;
   *  hosts can opt out (e.g. the webapp suppresses it). */
  showCostCalculator?: boolean;
  /** Show the top-bar "Create 3D model from image" magic-wand
   *  shortcut. Defaults to true; hosts without an Image-to-3D
   *  destination (e.g. the webapp) can hide it. */
  showImageTo3DButton?: boolean;
  /** Show the bottom-right help menu button. Defaults to true; hosts
   *  whose help menu wiring isn't yet plumbed (e.g. the webapp) can
   *  hide it. */
  showHelpMenu?: boolean;
  /** Where to render the model picker. `"bottom-left"` (default) keeps
   *  the floating ClassyModelSelector that Tauri uses; `"prompt-box"`
   *  hides it and renders a compact selector inside the prompt-box
   *  toolbar instead, matching the webapp's other prompt-box chrome. */
  modelSelectorPlacement?: "bottom-left" | "prompt-box";
  /** Optional content rendered just above the promptbox stack (image
   *  row + glass card + toolbar), inside the lib's `bottom-4` anchor.
   *  Tauri leaves this unset; the webapp uses it for the demo-mode
   *  "See other demo scenes" affordance so the button stacks above
   *  the prompt input instead of floating loose over the canvas. */
  promptboxAboveStackSlot?: React.ReactNode;
  /** Optional content rendered in the top toolbar's left cluster, right
   *  after the File/Outliner/Shortcuts buttons. Tauri leaves this unset;
   *  the webapp uses it for the editable scene title. */
  topBarStartSlot?: React.ReactNode;
  /** Optional content rendered in the top toolbar's right cluster
   *  (before the anonymous hint chip). Tauri leaves this unset; the
   *  webapp uses it to host the relocated nav actions (pricing, credits,
   *  task queue, profile) since its global header is hidden here. */
  topBarEndSlot?: React.ReactNode;
}

export const Stage3D = ({
  adapter,
  sceneToken,
  cacheJsonString,
  onSceneSerialized,
  showCostCalculator = true,
  showImageTo3DButton = true,
  showHelpMenu = true,
  modelSelectorPlacement = "bottom-left",
  promptboxAboveStackSlot,
  topBarStartSlot,
  topBarEndSlot,
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
      <Stage3DBody
        showCostCalculator={showCostCalculator}
        showImageTo3DButton={showImageTo3DButton}
        showHelpMenu={showHelpMenu}
        modelSelectorPlacement={modelSelectorPlacement}
        promptboxAboveStackSlot={promptboxAboveStackSlot}
        topBarStartSlot={topBarStartSlot}
        topBarEndSlot={topBarEndSlot}
      />
      <DragComponent />
      <PrecisionSelector />
      <EditorLoadingBar />
    </EngineProvider>
  );
};
