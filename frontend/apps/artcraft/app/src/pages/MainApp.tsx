// Top-level shell for the artcraft app. Always-mounted chrome
// (TopBar, login + pricing modals, toaster, Tauri event listeners,
// background refresh hooks) lives here, and a single tab-driven
// switch picks the active page below it.
//
// The 3D editor (PageScene) is one of the 13 tab branches — it
// genuinely mounts/unmounts as the user moves on/off the "3D" tab,
// so the Three.js engine constructs on entry and tears down on exit
// via the EngineProvider's React lifecycle. Other pages render as
// siblings, never wrapped by EngineProvider, so they have no
// dependency on the 3D engine being present.

import { useEffect, useState } from "react";
import * as gpu from "detect-gpu";
import { useSignals } from "@preact/signals-react/runtime";

import { TopBar } from "~/components";
import { ErrorDialog } from "~/components";
import { LoginModal, useLoginModalStore } from "@storyteller/ui-login-modal";
import { toast, Toaster } from "@storyteller/ui-toaster";
import {
  GalleryDragComponent,
  GalleryItem,
  onImageDrop,
  removeImageDropListener,
} from "@storyteller/ui-gallery-modal";
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
import {
  useFlashFileDownloadErrorEvent,
  useFlashUserInputErrorEvent,
  useGenerationCompleteEvent,
  useGenerationEnqueueFailureEvent,
  useGenerationEnqueueSuccessEvent,
  useGenerationFailedEvent,
  useMediaFileDeletedEvent,
  useTextToImageGenerationCompleteEvent,
} from "@storyteller/tauri-events";
import { SoundManager } from "@storyteller/soundboard";
import { useStoryboardPageEnabled } from "@storyteller/ui-settings-modal";
import {
  DomLevels,
  usePageSceneStore,
} from "@storyteller/ui-pagescene";

import { useActiveJobs } from "~/hooks/useActiveJobs";
import { useBackgroundLoadingMedia } from "~/hooks/useBackgroundLoadingMedia";
import { UsersApi } from "~/Classes/ApiManager";
import { authentication } from "~/signals";
import { AUTH_STATUS } from "~/enums";
import { useTabStore } from "./Stores/TabState";
import { useTextToImageStore } from "./PageImage/TextToImageStore";

import { AppsIndexPage } from "./PageApps/AppsIndexPage";
import PageDraw from "./PageDraw/PageDraw";
import TextToImage from "./PageImage/TextToImage";
import ImageToVideo from "./PageVideo/ImageToVideo";
import { VideoFrameExtractor } from "./PageVideoFrameExtractor";
import { VideoWatermarkRemover } from "./PageVideoWatermarkRemover";
import { ImageWatermarkRemover } from "./PageImageWatermarkRemover";
import { ImageTo3DObject } from "./PageImageTo3DObject";
import { ImageTo3DWorld } from "./PageImageTo3DWorld";
import { RemoveBackground } from "./PageRemoveBackground";
import { Angles } from "./PageAngles";
import { Storyboard } from "./PageStoryboard";
import { PageBackgroundChange } from "./PageBackgroundChange";
import { PageScene } from "./PageScene";
import { PageVideoEditor } from "./PageVideoEditor";
import {
  topNavMediaId,
  topNavMediaUrl,
} from "~/components/signaled/TopBar/TopBar";

interface Props {
  sceneToken?: string;
}

export const MainApp = ({ sceneToken }: Props) => {
  useSignals();

  // Background plumbing — should keep running regardless of which tab
  // is active.
  useActiveJobs();
  useBackgroundLoadingMedia();

  // Tauri event listeners. Must always be mounted so generation/upload
  // completions are surfaced no matter which tab the user is on.
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

  // Session probe (runs once per shell mount) and GPU detection.
  // Both are app-wide concerns, not 3D-only.
  useEffect(() => {
    const usersApi = new UsersApi();
    usersApi.GetSession().then((result) => {
      console.log(
        `User Info | Username: ${result.data?.user?.username}, Token: ${result.data?.user?.user_token}`,
      );
    });
  }, []);

  const [, setValidGpu] = useState("unknown");
  useEffect(() => {
    const { getGPUTier } = gpu;
    getGPUTier().then((gpuTier) => {
      console.log("GPU tier", gpuTier);
      let isValid = false;
      const fps = gpuTier.fps || 0;
      if (gpuTier.tier > 1) isValid = true;
      if (fps > 15) isValid = true;
      if (gpuTier.gpu === "apple gpu (Apple GPU)") isValid = true;
      setValidGpu(isValid ? "valid" : "error");
    });
  }, []);

  const { triggerRecheck } = useLoginModalStore();
  const { isOpen: isCreditsOpen, closeModal: closeCreditsModal } =
    useCreditsModalStore();
  const disableHotkeyInput = usePageSceneStore((s) => s.disableHotkeyInput);
  const enableHotkeyInput = usePageSceneStore((s) => s.enableHotkeyInput);

  const currentReminderModalProps = actionReminderProps.value;

  return (
    <div className="w-screen">
      <TopBar
        loginSignUpPressed={() => {
          console.log("PRESSED");
          triggerRecheck();
        }}
        pageName="Edit Scene"
      />
      <LoginModal
        videoSrc2D="/resources/videos/artcraft-canvas-demo.mp4"
        videoSrc3D="/resources/videos/artcraft-3d-demo.mp4"
        onOpenChange={(isOpen: boolean) => {
          if (isOpen) {
            disableHotkeyInput(DomLevels.DIALOGUE);
          } else {
            enableHotkeyInput(DomLevels.DIALOGUE);
          }
        }}
        onArtCraftAuthSuccess={(userInfo: any) => {
          authentication.status.value = AUTH_STATUS.LOGGED_IN;
          authentication.userInfo.value = userInfo;
        }}
      />

      <TabBody sceneToken={sceneToken} />

      <GalleryDragComponent />
      <ErrorDialog />
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
    </div>
  );
};

const TabBody = ({ sceneToken }: { sceneToken?: string }) => {
  const tabStore = useTabStore();
  const storyboardPageEnabled = useStoryboardPageEnabled();

  // The 3D case stays unwrapped because Stage3DBody (lib) already
  // returns a <div> wrapper. Every other page is a fragment whose
  // top-level children may use position: fixed (e.g. PageDraw); the
  // wrapping <div> scopes them so they don't stack as siblings of
  // the TopBar at the MainApp root.
  switch (tabStore.activeTabId) {
    case "3D":
      return <PageScene sceneToken={sceneToken} />;
    case "APPS":
      return <div><AppsIndexPage /></div>;
    case "2D":
      return <div><PageDrawWithGalleryDrop /></div>;
    case "IMAGE":
      return (
        <div>
          <TextToImage
            imageMediaId={topNavMediaId.value}
            imageUrl={topNavMediaUrl.value}
          />
        </div>
      );
    case "VIDEO":
      return <div><ImageToVideo /></div>;
    case "VIDEO_FRAME_EXTRACTOR":
      return <div><VideoFrameExtractor /></div>;
    case "VIDEO_WATERMARK_REMOVAL":
      return <div><VideoWatermarkRemover /></div>;
    case "IMAGE_WATERMARK_REMOVAL":
      return <div><ImageWatermarkRemover /></div>;
    case "IMAGE_TO_3D_OBJECT":
      return <div><ImageTo3DObject /></div>;
    case "IMAGE_TO_3D_WORLD":
      return <div><ImageTo3DWorld /></div>;
    case "REMOVE_BACKGROUND":
      return <div><RemoveBackground /></div>;
    case "ANGLES":
      return <div><Angles /></div>;
    case "STORYBOARD":
      return storyboardPageEnabled ? <div><Storyboard /></div> : null;
    case "BACKGROUND_CHANGE":
      return <div><PageBackgroundChange /></div>;
    case "VIDEO_EDITOR":
      return <div className="h-[calc(100vh-3rem)] w-full"><PageVideoEditor /></div>;
    default:
      return null;
  }
};

// Bridges gallery-modal's onImageDrop into PageDraw's existing
// `gallery-2d-drop` window-event listener. Lives here (rather than
// inside the pagedraw lib) so we don't have to add a gallery-modal
// dep there. Mounted only when the 2D tab is active, so it doesn't
// race the 3D-tab gallery handler.
const PageDrawWithGalleryDrop = () => {
  useEffect(() => {
    const handler = onImageDrop(
      (item: GalleryItem, position: { x: number; y: number }) => {
        const canvasElement = document.querySelectorAll("canvas")[0];
        if (!canvasElement) return;
        const rect = canvasElement.getBoundingClientRect();
        const canvasX = position.x - rect.left;
        const canvasY = position.y - rect.top;
        if (
          canvasX < 0 ||
          canvasY < 0 ||
          canvasX > rect.width ||
          canvasY > rect.height
        ) {
          return;
        }
        window.dispatchEvent(
          new CustomEvent("gallery-2d-drop", {
            detail: { item, canvasPosition: { x: canvasX, y: canvasY } },
          }),
        );
      },
    );
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (handler) removeImageDropListener(handler as any);
    };
  }, []);
  return <PageDraw />;
};
