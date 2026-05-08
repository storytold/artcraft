import { DragComponent } from "~/pages/PageScene/comps/DragComponent/DragComponent";
import { EngineProvider } from "./contexts/EngineContext";
import { useTabStore } from "~/pages/Stores/TabState";
import { useActiveJobs } from "~/hooks/useActiveJobs";
import { useBackgroundLoadingMedia } from "~/hooks/useBackgroundLoadingMedia";
import { ErrorDialog } from "~/components";
import { toast, Toaster } from "@storyteller/ui-toaster";
import { EditorLoadingBar } from "./comps/EditorLoadingBar";
import { useSignals } from "@preact/signals-react/runtime";
import { useEffect, useState } from "react";
import * as gpu from "detect-gpu";
import { UsersApi } from "~/Classes/ApiManager";
import { PrecisionSelector } from "./comps/PrecisionSelector/PrecisionSelector";
import { PageEditor } from "~/pages/PageScene/PageEditor";
import { GalleryDragComponent } from "@storyteller/ui-gallery-modal";
import {
  PricingModal,
  CreditsModal,
  useCreditsModalStore,
} from "@storyteller/ui-pricing-modal";
import {
  isActionReminderOpen,
  actionReminderProps,
  ActionReminderModal,
} from "@storyteller/ui-action-reminder-modal";
import { useFlashFileDownloadErrorEvent, useFlashUserInputErrorEvent, useMediaFileDeletedEvent } from "@storyteller/tauri-events";
import { useGenerationCompleteEvent } from "@storyteller/tauri-events";
import { useGenerationEnqueueFailureEvent } from "@storyteller/tauri-events";
import { useGenerationEnqueueSuccessEvent } from "@storyteller/tauri-events";

import { useGenerationFailedEvent } from "@storyteller/tauri-events";
import { useTextToImageGenerationCompleteEvent } from "@storyteller/tauri-events";
import { useTextToImageStore } from "~/pages/PageImage/TextToImageStore";
import { SoundManager } from "@storyteller/soundboard";
import { useTauriPageSceneAdapter } from "./useTauriPageSceneAdapter";

export const PageScene = ({ sceneToken }: { sceneToken?: string }) => {
  useSignals();
  useActiveJobs();
  useBackgroundLoadingMedia();

  // Tab-cache plumbing lives at this layer (not inside EngineProvider).
  // The provider only knows about its own React lifecycle; the host
  // decides where the in-memory cache string lives. Reading the
  // current value once on render is fine — the provider snapshots it
  // on mount, and the cache is per-mount, not per-render.
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

  // Credits modal state (must be before any early returns)
  const { isOpen: isCreditsOpen, closeModal: closeCreditsModal } =
    useCreditsModalStore();

  const [validGpu, setValidGpu] = useState("unknown");

  useEffect(() => {
    const usersApi = new UsersApi();
    const sessionResponse = usersApi.GetSession();
    sessionResponse.then((result) => {
      console.log(
        `User Info | Username: ${result.data?.user?.username}, Token: ${result.data?.user?.user_token}`,
      );
    });
  });

  useEffect(() => {
    const { getGPUTier } = gpu;
    getGPUTier().then((gpuTier) => {
      console.log("GPU tier", gpuTier);

      let isValid = false;

      const fps = gpuTier.fps || 0;

      if (gpuTier.tier > 1) {
        isValid = true;
      }

      if (fps > 15) {
        isValid = true;
      }

      switch (gpuTier.gpu) {
        case "apple gpu (Apple GPU)":
          isValid = true;
          break;
        default:
          break;
      }

      setValidGpu(isValid ? "valid" : "error");
    });
  });

  useGenerationEnqueueSuccessEvent();
  useGenerationEnqueueFailureEvent();
  useGenerationCompleteEvent();

  useGenerationFailedEvent();

  const completeBatch = useTextToImageStore((s) => s.completeBatch);
  useTextToImageGenerationCompleteEvent(async (event) => {
    completeBatch(
      event.generated_images || [],
      event.maybe_frontend_subscriber_id,
    );
  });

  useFlashUserInputErrorEvent(async (event) => {
    console.log("Flash user input error event received:", event);
    toast.error(event.message);
  });

  useFlashFileDownloadErrorEvent(async (event) => {
    console.log("Flash file download error event received:", event);
    toast.error(event.message || "File download failed");
  });

  useMediaFileDeletedEvent(async (event) => {
    console.log("Media file deleted event received:", event);
    await SoundManager.playFileDeleted();
    toast.error("File deleted.");
  });

  const currentReminderModalProps = actionReminderProps.value;

  return (
    <EngineProvider
      sceneToken={sceneToken}
      adapter={adapter}
      cacheJsonString={cacheJsonString}
      onSceneSerialized={onSceneSerialized}
    >
      <PageEditor />
      <DragComponent />
      <GalleryDragComponent />
      <PrecisionSelector />
      <ErrorDialog />

      <EditorLoadingBar />
      <Toaster offsetTop={70} offsetRight={12} zIndex={9999} />

      {currentReminderModalProps && (
        <ActionReminderModal
          isOpen={isActionReminderOpen.value}
          onClose={currentReminderModalProps.onClose}
          reminderType={currentReminderModalProps.reminderType}
          onPrimaryAction={currentReminderModalProps.onPrimaryAction}
          title={currentReminderModalProps.title}
          message={currentReminderModalProps.message}
          primaryActionText={currentReminderModalProps.primaryActionText}
          secondaryActionText={currentReminderModalProps.secondaryActionText}
          onSecondaryAction={currentReminderModalProps.onSecondaryAction}
          isLoading={currentReminderModalProps.isLoading}
          openAiLogo={currentReminderModalProps.openAiLogo}
          primaryActionIcon={currentReminderModalProps.primaryActionIcon}
          primaryActionBtnClassName={
            currentReminderModalProps.primaryActionBtnClassName
          }
        />
      )}

      <PricingModal />
      <CreditsModal isOpen={isCreditsOpen} onClose={closeCreditsModal} />
    </EngineProvider>
  );
};
