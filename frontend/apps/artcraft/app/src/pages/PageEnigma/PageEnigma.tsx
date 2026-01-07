import { DragComponent } from "~/pages/PageEnigma/comps/DragComponent/DragComponent";
import { EngineProvider } from "./contexts/EngineContext";
import { useActiveJobs } from "~/hooks/useActiveJobs";
import { useBackgroundLoadingMedia } from "~/hooks/useBackgroundLoadingMedia";
import { useQueueHandler } from "./hooks/useQueueHandler";
import { ErrorDialog } from "~/components";
import { GenerateModals } from "~/pages/PageEnigma/comps/GenerateModals/GenerateModals";
import { toast, Toaster } from "@storyteller/ui-toaster";
import { EditorLoadingBar } from "./comps/EditorLoadingBar";
import { useSignals } from "@preact/signals-react/runtime";
import { useEffect, useState } from "react";
import * as gpu from "detect-gpu";
import { UsersApi } from "~/Classes/ApiManager";
import { PrecisionSelector } from "./comps/PrecisionSelector/PrecisionSelector";
import {
  precisionSelectedValue,
  precisionSelectorMenuCoords,
  precisionSelectorValues,
  showPrecisionSelector,
} from "./signals/precisionSelectorMenu";
import { InstallSounds } from "~/pages/PageEnigma/InstallSounds";
import { PageEditor } from "~/pages/PageEnigma/PageEditor";
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
import { useFlashFileDownloadErrorEvent, useFlashUserInputErrorEvent } from "@storyteller/tauri-events";
import { useGenerationCompleteEvent } from "@storyteller/tauri-events";
import { useGenerationEnqueueFailureEvent } from "@storyteller/tauri-events";
import { useGenerationEnqueueSuccessEvent } from "@storyteller/tauri-events";

import { useGenerationFailedEvent } from "@storyteller/tauri-events";
import { useTextToImageGenerationCompleteEvent } from "@storyteller/tauri-events";
import { useTextToImageStore } from "~/pages/PageImage/TextToImageStore";

export const PageEnigma = ({ sceneToken }: { sceneToken?: string }) => {
  useSignals();
  useActiveJobs();
  useBackgroundLoadingMedia();
  useQueueHandler();

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

  useEffect(() => {
    console.log("installing event listeners");
    InstallSounds();
  });

  const currentReminderModalProps = actionReminderProps.value;

  return (
    <EngineProvider sceneToken={sceneToken}>
      <PageEditor />
      <DragComponent />
      <GalleryDragComponent />
      <PrecisionSelector
        showSignal={showPrecisionSelector}
        coordSignal={precisionSelectorMenuCoords}
        valuesSignal={precisionSelectorValues}
        selectedValueSignal={precisionSelectedValue}
      />
      <GenerateModals />
      <ErrorDialog />

      <EditorLoadingBar />
      <Toaster offsetTop={70} offsetRight={12} />

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
