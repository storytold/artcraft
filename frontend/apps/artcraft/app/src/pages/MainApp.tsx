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

import { lazy, Suspense, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";

import { TopBar , ErrorDialog } from "~/components";
import type { UserInfo } from "~/models";
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
import { DomLevels, usePageSceneStore } from "@storyteller/ui-pagescene";

import { useActiveJobs } from "~/hooks/useActiveJobs";
import { useBackgroundLoadingMedia } from "~/hooks/useBackgroundLoadingMedia";
import { UsersApi } from "~/Classes/ApiManager";
import { authentication } from "~/signals";
import { AUTH_STATUS } from "~/enums";
import { useTabStore } from "./Stores/TabState";
import { useTextToImageStore } from "./PageImage/TextToImageStore";

import { AppsIndexPage } from "./PageApps/AppsIndexPage";
import PageDraw from "./PageDraw/PageDraw";
import {
  topNavMediaId,
  topNavMediaUrl,
} from "~/components/signaled/TopBar/TopBar";

// Load editors when selected, keeping their code off the launch path. Drawing
// stays eager: its shared store/UI is already needed by the shell, so deferring
// its small host adapter adds first-open latency for very little byte saving.
// Declare lazy components once so navigating does not recreate their identity.
const TextToImage = lazy(() => import("./PageImage/TextToImage"));
const ImageToVideo = lazy(() => import("./PageVideo/ImageToVideo"));
const CreateAudio = lazy(() => import("./PageAudio/CreateAudio"));
const VideoFrameExtractor = lazy(() =>
  import("./PageVideoFrameExtractor").then((m) => ({ default: m.VideoFrameExtractor })),
);
const VideoWatermarkRemover = lazy(() =>
  import("./PageVideoWatermarkRemover").then((m) => ({ default: m.VideoWatermarkRemover })),
);
const ImageWatermarkRemover = lazy(() =>
  import("./PageImageWatermarkRemover").then((m) => ({ default: m.ImageWatermarkRemover })),
);
const ImageTo3DObject = lazy(() =>
  import("./PageImageTo3DObject").then((m) => ({ default: m.ImageTo3DObject })),
);
const ImageTo3DWorld = lazy(() =>
  import("./PageImageTo3DWorld").then((m) => ({ default: m.ImageTo3DWorld })),
);
const RemoveBackground = lazy(() =>
  import("./PageRemoveBackground").then((m) => ({ default: m.RemoveBackground })),
);
const Angles = lazy(() =>
  import("./PageAngles").then((m) => ({ default: m.Angles })),
);
const Storyboard = lazy(() =>
  import("./PageStoryboard").then((m) => ({ default: m.Storyboard })),
);
const PageBackgroundChange = lazy(() =>
  import("./PageBackgroundChange").then((m) => ({ default: m.PageBackgroundChange })),
);
const PageScene = lazy(() =>
  import("./PageScene").then((m) => ({ default: m.PageScene })),
);
const PageVideoEditor = lazy(() =>
  import("./PageVideoEditor").then((m) => ({ default: m.PageVideoEditor })),
);
const PageMoodboard = lazy(() =>
  import("./PageMoodboard").then((m) => ({ default: m.PageMoodboard })),
);

// sceneToken: optional id of a saved 3D scene, taken from the /$sceneToken route; only the 3D page uses it.
interface Props {
  sceneToken?: string;
}

/**
 * The app shell, mounted by routes/_index.tsx (no scene) and routes/$sceneToken.tsx (opens a saved scene).
 * It renders the always-on chrome (TopBar, login/pricing/credits modals, toaster, error dialog) and registers
 * the Tauri event listeners and background hooks, then lets TabBody show the page for the active tab.
 */
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

  // When Rust reports a finished text-to-image batch, hand its images to the Text-to-Image page store (matched by the subscriber id it sent).
  const completeBatch = useTextToImageStore((s) => s.completeBatch);
  useTextToImageGenerationCompleteEvent(async (event) => {
    completeBatch(
      event.generated_images || [],
      event.maybe_frontend_subscriber_id,
    );
  });

  // Rust-side problems are surfaced as toasts here, because this component is mounted on every tab.
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

  // Session probe (runs once per shell mount).
  useEffect(() => {
    const usersApi = new UsersApi();
    usersApi.GetSession().then((result) => {
      console.log(
        `User Info | Username: ${result.data?.user?.username}, Token: ${result.data?.user?.user_token}`,
      );
    });
  }, []);

  // Store hooks for the modals: the login modal re-check trigger, the credits modal open flag, and the 3D page hotkey switches.
  const { triggerRecheck } = useLoginModalStore();
  const { isOpen: isCreditsOpen, closeModal: closeCreditsModal } =
    useCreditsModalStore();
  const disableHotkeyInput = usePageSceneStore((s) => s.disableHotkeyInput);
  const enableHotkeyInput = usePageSceneStore((s) => s.enableHotkeyInput);

  // A signal holding the props of the pending action-reminder popup (null = none); reading .value inside a useSignals() component re-renders when it changes.
  const currentReminderModalProps = actionReminderProps.value;

  // Layout, top to bottom: TopBar and LoginModal (always), the active page inside Suspense (shows "Loading..." while a lazy
  // page chunk downloads), then global overlays. Toaster offsets are in pixels; the TopBar is 56 px tall.
  // The LoginModal open/close callback turns the scene editor's keyboard shortcuts off while the dialog is open.
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
        onArtCraftAuthSuccess={(userInfo: UserInfo) => {
          authentication.status.value = AUTH_STATUS.LOGGED_IN;
          authentication.userInfo.value = userInfo;
        }}
      />

      <Suspense
        fallback={
          <div
            role="status"
            className="flex h-[calc(100vh-56px)] items-center justify-center text-base-fg/60"
          >
            Loading…
          </div>
        }
      >
        <TabBody sceneToken={sceneToken} />
      </Suspense>

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

/**
 * Shows the page for the tab selected in the TabState store. Props: sceneToken is passed to the 3D page.
 * Most pages are wrapped in a plain <div> (the 3D page is not); the pages are lazy-loaded so their code is only fetched on first visit.
 */
const TabBody = ({ sceneToken }: { sceneToken?: string }) => {
  const activeTabId = useTabStore((s) => s.activeTabId);
  const storyboardPageEnabled = useStoryboardPageEnabled();

  // The 3D case stays unwrapped because Stage3DBody (lib) already
  // returns a <div> wrapper. Every other page is a fragment whose
  // top-level children may use position: fixed (e.g. PageDraw); the
  // wrapping <div> scopes them so they don't stack as siblings of
  // the TopBar at the MainApp root.
  switch (activeTabId) {
    case "3D":
      return <PageScene sceneToken={sceneToken} />;
    case "APPS":
      return (
        <div>
          <AppsIndexPage />
        </div>
      );
    case "2D":
      return (
        <div>
          <PageDrawWithGalleryDrop />
        </div>
      );
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
      return (
        <div>
          <ImageToVideo />
        </div>
      );
    case "AUDIO":
      return (
        <div>
          <CreateAudio />
        </div>
      );
    case "VIDEO_FRAME_EXTRACTOR":
      return (
        <div>
          <VideoFrameExtractor />
        </div>
      );
    case "VIDEO_WATERMARK_REMOVAL":
      return (
        <div>
          <VideoWatermarkRemover />
        </div>
      );
    case "IMAGE_WATERMARK_REMOVAL":
      return (
        <div>
          <ImageWatermarkRemover />
        </div>
      );
    case "IMAGE_TO_3D_OBJECT":
      return (
        <div>
          <ImageTo3DObject />
        </div>
      );
    case "IMAGE_TO_3D_WORLD":
      return (
        <div>
          <ImageTo3DWorld />
        </div>
      );
    case "REMOVE_BACKGROUND":
      return (
        <div>
          <RemoveBackground />
        </div>
      );
    case "ANGLES":
      return (
        <div>
          <Angles />
        </div>
      );
    // Hidden unless the Storyboard feature is switched on in settings.
    case "STORYBOARD":
      return storyboardPageEnabled ? (
        <div>
          <Storyboard />
        </div>
      ) : null;
    case "BACKGROUND_CHANGE":
      return (
        <div>
          <PageBackgroundChange />
        </div>
      );
    case "VIDEO_EDITOR":
      return (
        <div className="h-[calc(100vh-3rem)] w-full">
          <PageVideoEditor />
        </div>
      );
    case "MOODBOARD":
      // The TopBar is fixed and 56px tall, so the board sits below it and fills
      // the rest of the viewport. h-screen + pt-[56px] (border-box) makes the
      // board area exactly viewport-minus-topbar, and overflow-hidden keeps
      // sub-pixel 100vh rounding from spawning page scrollbars (which w-screen
      // ancestors would turn into a horizontal scrollbar via the Windows
      // scrollbar gutter).
      return (
        <div className="h-[calc(100vh-56px)] w-full overflow-hidden">
          <PageMoodboard />
        </div>
      );
    default:
      return null;
  }
};

// Bridges gallery-modal's onImageDrop into PageDraw's existing
// `gallery-2d-drop` window-event listener. Lives here (rather than
// inside the pagedraw lib) so we don't have to add a gallery-modal
// dep there. Mounted only when the 2D tab is active, so it doesn't
// race the 3D-tab gallery handler.
/**
 * The 2D (drawing) tab: PageDraw plus a bridge for images dragged out of the gallery modal. No props.
 */
const PageDrawWithGalleryDrop = () => {
  // On mount, listen for gallery drops; on unmount, stop listening. A drop only counts if it lands inside the
  // first <canvas> on the page; the position is converted to canvas-relative pixels before it is re-sent as a window event.
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
