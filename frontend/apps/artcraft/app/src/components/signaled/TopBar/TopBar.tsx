import {
  faDash,
  faSquare,
  faWindowRestore,
  faXmark,
} from "@fortawesome/pro-regular-svg-icons";
import {
  faCoins,
  faGear,
  faGem,
  faGrid2,
  faImages,
  faCalculator,
  faExclamation,
  faCheck,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import {
  FilterMediaClasses,
  downloadUrlToPath,
  promptDownloadLocationIfNeeded,
} from "@storyteller/api";
import {
  getCreatorIcon,
  ModelCreator,
  IMAGE_MODELS_BY_ID,
  VIDEO_MODELS_BY_ID,
  CommonAspectRatio,
  CommonResolution,
} from "@storyteller/model-list";
import {
  useClassyModelSelectorStore,
  ModelPage,
} from "@storyteller/ui-model-selector";
import { useCreditsState, type CreditsIconStatus } from "@storyteller/credits";
import { gtagEvent } from "@storyteller/google-analytics";
import { ProviderBillingModal } from "@storyteller/provider-billing-modal";
import { ProviderSetupModal } from "@storyteller/provider-setup-modal";
import { useSubscriptionState } from "@storyteller/subscription";
import { DownloadUrl } from "@storyteller/tauri-api";
import {
  useCreditsBalanceChangedEvent,
  useSubscriptionPlanChangedEvent,
} from "@storyteller/tauri-events";
import {
  useTauriPlatform,
  useTauriWindowControls,
} from "@storyteller/tauri-utils";
import { Button } from "@storyteller/ui-button";
import {
  GalleryModal,
  galleryModalLightboxVisible,
  galleryModalVisibleDuringDrag,
  galleryModalVisibleViewMode,
} from "@storyteller/ui-gallery-modal";
import {
  MenuIconItem,
  MenuIconSelector,
} from "@storyteller/ui-menu-icon-selector";
import { PopoverMenu } from "@storyteller/ui-popover";
import {
  useCreditsModalStore,
  usePricingModalStore,
  CostBreakdownModal,
  useCostBreakdownModalStore,
  CreditsModal,
} from "@storyteller/ui-pricing-modal";
import {
  RefImage,
  RefVideo,
  RefAudio,
  usePromptImageStore,
  usePromptVideoStore,
} from "@storyteller/ui-promptbox";
import type { Prompts } from "@storyteller/api";
import { SettingsModal } from "@storyteller/ui-settings-modal";
import { Tooltip } from "@storyteller/ui-tooltip";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { APP_DESCRIPTORS, goToApp } from "~/config/appMenu";
import { useStoryboardStore } from "~/pages/PageStoryboard";
import { useSceneStore } from "@storyteller/ui-pagedraw";
import {
  is3DEditorInitialized,
  is3DSceneLoaded,
  set3DPageMounted,
} from "~/pages/PageEnigma/Editor/editor";
import { useImageTo3DStore } from "~/pages/PageImageTo3DObject/ImageTo3DStore";
import { useImageTo3DWorldStore } from "~/pages/PageImageTo3DWorld/ImageTo3DWorldStore";
import { useRemoveBackgroundStore } from "~/pages/PageRemoveBackground/RemoveBackgroundStore";
import { TabId, useTabStore } from "~/pages/Stores/TabState";
import { AUTH_STATUS } from "~/enums";
import { authentication } from "~/signals";
import { setLogoutStates } from "~/signals/authentication/utilities";
import type { BaseSelectorImage } from "@storyteller/ui-pagedraw";
import {
  galleryModalDeleteMedia,
  galleryModalSubscribeToMediaEvents,
} from "~/Helpers/galleryModalTauriBindings";
import { AppsQuickMenu } from "./AppsQuickMenu";
import { SceneTitleInput } from "./SceneTitleInput";
import { TaskQueue } from "./TaskQueue";
import { UploadImagesButton } from "./UploadImagesButton";

interface Props {
  pageName: string;
  loginSignUpPressed: () => void;
}

// Settings section type to match the SettingsModal component
type SettingsSection =
  | "general"
  | "accounts"
  | "alerts"
  | "about"
  | "provider_priority"
  | "billing";

const SWITCHER_THROTTLE_TIME = 500; // milliseconds
const CREDITS_POLL_INTERVAL = 60_000; // milliseconds

// NB: See `TabState` for the default tab.
const appMenuTabs: MenuIconItem[] = [
  ...APP_DESCRIPTORS.map((d) => ({
    id: d.id,
    label: d.label,
    icon: <FontAwesomeIcon icon={d.icon} />,
    imageSrc: d.imageSrc,
    description: d.description,
    large: d.large,
  })),
  {
    id: "APPS",
    label: "More",
    icon: <FontAwesomeIcon icon={faGrid2} />,
    description: "Explore more apps and miniapps",
    large: true,
    tooltipContent: <AppsQuickMenu />,
    tooltipInteractive: true,
    tooltipPosition: "bottom",
  },
];

export const topNavMediaId = signal<string>("");
export const topNavMediaUrl = signal<string>("");

const CreditsCoinWithStatus = ({
  iconStatus,
}: {
  iconStatus: CreditsIconStatus;
}) => {
  const showBadge = iconStatus !== "hidden";

  const badgeColorClass =
    iconStatus === "failed"
      ? "bg-red text-white"
      : iconStatus === "recovered"
        ? "bg-emerald-500 text-white"
        : "bg-amber-400 text-black"; // 'slow'

  const badgeIconDef = iconStatus === "recovered" ? faCheck : faExclamation;

  const tooltipMessage =
    iconStatus === "failed"
      ? "Couldn't refresh your balance."
      : iconStatus === "recovered"
        ? "Balance up to date."
        : "Refreshing your balance — current amount may not be up to date.";

  const showRetry = iconStatus === "slow" || iconStatus === "failed";

  const handleRetry = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("TopBar: Retrying credits fetch");

    void useCreditsState.getState().fetchFromServer();
  };

  return (
    <Tooltip
      position="bottom"
      interactive
      disabled={!showBadge}
      content={
        <div className="flex max-w-[220px] flex-col gap-2 text-xs text-base-fg">
          <span>{tooltipMessage}</span>
          {showRetry && (
            <Button
              variant="secondary"
              className="h-7 self-start px-2 text-xs"
              onClick={handleRetry}
            >
              Retry
            </Button>
          )}
        </div>
      }
    >
      <span className="relative inline-flex">
        <FontAwesomeIcon icon={faCoins} className="text-primary" />
        {showBadge && (
          <span
            className={`absolute -right-1.5 -top-1.5 flex h-3 w-3 items-center justify-center rounded-full ring-1 ring-ui-background ${badgeColorClass}`}
          >
            <FontAwesomeIcon icon={badgeIconDef} className="text-[7px]" />
          </span>
        )}
      </span>
    </Tooltip>
  );
};

export const TopBar = ({ pageName }: Props) => {
  useSignals();

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsSection, setSettingsSection] =
    useState<SettingsSection>("general");

  const { isDesktop, isMaximized, minimize, toggleMaximize, close } =
    useTauriWindowControls();
  const platform = useTauriPlatform();

  const handleOpenGalleryModal = () => {
    galleryModalVisibleViewMode.value = true;
    galleryModalVisibleDuringDrag.value = true;
    gtagEvent("open_gallery_modal", { tab: tabStore.activeTabId });
  };

  // Force recreation of the modal when switching to billing
  const handleOpenBillingSettings = () => {
    setIsSettingsModalOpen(false);
    setTimeout(() => {
      setSettingsSection("billing");
      setIsSettingsModalOpen(true);
      gtagEvent("open_billing_settings");
    }, 50);
  };

  const tabStore = useTabStore();

  const is3DSceneReady = is3DSceneLoaded.value;
  const is3DEditorReady = is3DEditorInitialized.value;
  const [disableSwitcher, setDisableSwitcher] = useState(false);
  const switcherThrottle = useRef(false);

  const sumTotalCredits = useCreditsState((s) => s.totalCredits);
  const creditsIconStatus = useCreditsState((s) => s.iconStatus);

  // Just calling this function kills the app:
  const subscriptionStore = useSubscriptionState();
  const hasPaidPlan = subscriptionStore.hasPaidPlan();

  // Fetch credits + subscription on entering LOGGED_IN, then poll credits every
  // 60s. Reading via getState() inside the effect keeps the dep array honest
  // (the only real dep is the auth status). Earlier versions had a 1s setTimeout
  // band-aid to outrun intermediate auth states; gating on LOGGED_IN replaces it.
  const authStatus = authentication.status.value;
  useEffect(() => {
    if (authStatus !== AUTH_STATUS.LOGGED_IN) return;

    void useCreditsState.getState().fetchFromServer();
    void useSubscriptionState.getState().fetchFromServer();

    const interval = setInterval(() => {
      void useCreditsState.getState().fetchFromServer();
      console.log("TopBar: Polled credits");
    }, CREDITS_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [authStatus]);

  useCreditsBalanceChangedEvent(async () => {
    useCreditsState.getState().fetchFromServer();
  });

  useSubscriptionPlanChangedEvent(async () => {
    subscriptionStore.fetchFromServer();
  });

  const disableTabSwitcher = () => {
    return (
      disableSwitcher ||
      (useTabStore.getState().activeTabId === "3D" &&
        !is3DEditorReady &&
        !is3DSceneReady)
    );
  };

  const downloadFile = async (url: string, mediaClass?: string) => {
    try {
      const chosenPath = await promptDownloadLocationIfNeeded(url);
      if (chosenPath === null) {
        // User dismissed the picker.
        return;
      }
      if (typeof chosenPath === "string") {
        await downloadUrlToPath(url, chosenPath);
      } else {
        await DownloadUrl(url);
      }
      if (mediaClass === FilterMediaClasses.DIMENSIONAL) {
        toast.success(`Downloaded 3D model`);
      } else {
        toast.success(`Downloaded ${mediaClass}`);
      }
    } catch (error) {
      console.error(">>> Failed to download file:", error);
      // NB: Rust/Tauri should now flash a toast instead.
      //toast.error("Failed to download file");
    }
  };

  const handleEditFromGallery = async (url: string, mediaId?: string) => {
    try {
      // Reset editor state
      useSceneStore.getState().RESET();

      // Switch to EDIT tab
      useTabStore.getState().setActiveTab("2D");

      // Select the image for editing
      const baseImage: BaseSelectorImage = {
        url,
        mediaToken: mediaId || "",
      };

      // Add it to state history
      useSceneStore.getState().addHistoryImageBundle({ images: [baseImage] });
      useSceneStore.getState().setBaseImageInfo(baseImage);

      // Close gallery modal and lightbox if open
      galleryModalVisibleViewMode.value = false;
      galleryModalVisibleDuringDrag.value = false;
      galleryModalLightboxVisible.value = false;
    } catch (e) {
      // no-op
    }
  };

  const handleTurnIntoVideoFromGallery = async (
    url: string,
    mediaId?: string,
  ) => {
    try {
      const referenceImage: RefImage = {
        id: Math.random().toString(36).substring(7),
        url,
        file: new File([], "library-image"),
        mediaToken: mediaId || "",
      };
      // Update zustand store for Video directly
      usePromptVideoStore.getState().setReferenceImages([referenceImage]);
      useTabStore.getState().setActiveTab("VIDEO");
      galleryModalVisibleViewMode.value = false;
      galleryModalVisibleDuringDrag.value = false;
      galleryModalLightboxVisible.value = false;
    } catch (e) {
      // no-op
    }
  };

  const handleRecreateFromGallery = (data: {
    promptData: Prompts;
    mediaClass: string | undefined;
  }) => {
    try {
      const { promptData, mediaClass: recreateMediaClass } = data;
      const contextImages = promptData.maybe_context_images || [];

      // Partition context images by semantic type
      const imgRefs: RefImage[] = [];
      let endFrameImage: RefImage | undefined;
      const vidRefs: RefVideo[] = [];
      const audioRefs: RefAudio[] = [];

      for (const ci of contextImages) {
        const base = {
          id: Math.random().toString(36).substring(7),
          url: ci.media_links.cdn_url,
          mediaToken: ci.media_token,
        };

        switch (ci.semantic) {
          case "vid_end_frame":
            endFrameImage = { ...base, file: new File([], "recreate-ref") };
            break;
          case "vid_ref":
            vidRefs.push({
              ...base,
              file: new File([], "recreate-ref"),
              duration: 0,
            });
            break;
          case "audioref":
            audioRefs.push({
              ...base,
              file: new File([], "recreate-ref"),
              duration: 0,
            });
            break;
          default:
            // imgref, imgref_character, imgref_style, imgref_bg, imgsrc, vid_start_frame, imgmask
            imgRefs.push({ ...base, file: new File([], "recreate-ref") });
            break;
        }
      }

      // Determine input mode from generation_mode or context image semantics
      const hasKeyframeSemantics = contextImages.some(
        (ci) =>
          ci.semantic === "vid_start_frame" || ci.semantic === "vid_end_frame",
      );
      const inputMode: "keyframe" | "reference" =
        promptData.maybe_generation_mode === "keyframe" || hasKeyframeSemantics
          ? "keyframe"
          : promptData.maybe_generation_mode === "reference"
            ? "reference"
            : imgRefs.length > 0
              ? "reference"
              : "keyframe";

      const modelStore = useClassyModelSelectorStore.getState();

      if (recreateMediaClass === "video") {
        const videoStore = usePromptVideoStore.getState();

        // Set model first so the UI syncs sizeOptions / durationOptions
        const videoModel = promptData.maybe_model_type
          ? VIDEO_MODELS_BY_ID.get(promptData.maybe_model_type)
          : undefined;
        if (videoModel) {
          modelStore.setSelectedModel(ModelPage.ImageToVideo, videoModel);
        }

        if (promptData.maybe_positive_prompt) {
          videoStore.setPrompt(promptData.maybe_positive_prompt);
        }
        if (imgRefs.length > 0) videoStore.setReferenceImages(imgRefs);
        if (endFrameImage) videoStore.setEndFrameImage(endFrameImage);
        if (vidRefs.length > 0) videoStore.setReferenceVideos(vidRefs);
        if (audioRefs.length > 0) videoStore.setReferenceAudios(audioRefs);
        if (promptData.maybe_generate_audio !== null) {
          videoStore.setGenerateWithSound(promptData.maybe_generate_audio);
        }
        if (promptData.maybe_duration_seconds !== null) {
          videoStore.setDuration(promptData.maybe_duration_seconds);
        }

        // Map API aspect ratio (tauriValue like "wide_sixteen_by_nine") → textLabel (like "16:9")
        if (promptData.maybe_aspect_ratio && videoModel?.sizeOptions) {
          const match = videoModel.sizeOptions.find(
            (opt) => opt.tauriValue === promptData.maybe_aspect_ratio,
          );
          if (match) {
            videoStore.setAspectRatio(match.textLabel);
          }
        }

        // Map API resolution (like "one_k") → video store format (like "1080p")
        if (promptData.maybe_resolution && videoModel?.resolutionOptions) {
          const resolutionMap: Record<string, string> = {
            one_k: "1080p",
            two_k: "2k",
            three_k: "3k",
            four_k: "4k",
          };
          const mapped = resolutionMap[promptData.maybe_resolution];
          if (mapped && videoModel.resolutionOptions.includes(mapped)) {
            videoStore.setResolution(mapped);
          }
        }

        videoStore.setInputMode(inputMode);
        useTabStore.getState().setActiveTab("VIDEO");
      } else {
        // Default to image
        const imageStore = usePromptImageStore.getState();

        if (promptData.maybe_positive_prompt) {
          imageStore.setPrompt(promptData.maybe_positive_prompt);
        }
        if (imgRefs.length > 0) imageStore.setReferenceImages(imgRefs);
        if (promptData.maybe_aspect_ratio) {
          imageStore.setCommonAspectRatio(
            promptData.maybe_aspect_ratio as CommonAspectRatio,
          );
        }
        if (promptData.maybe_resolution) {
          imageStore.setCommonResolution(
            promptData.maybe_resolution as CommonResolution,
          );
        }

        if (promptData.maybe_model_type) {
          const model = IMAGE_MODELS_BY_ID.get(promptData.maybe_model_type);
          if (model) modelStore.setSelectedModel(ModelPage.TextToImage, model);
        }
        useTabStore.getState().setActiveTab("IMAGE");
      }

      galleryModalVisibleViewMode.value = false;
      galleryModalVisibleDuringDrag.value = false;
      galleryModalLightboxVisible.value = false;
    } catch (e) {
      // no-op
    }
  };

  const handleRemoveBackgroundFromGallery = async (url: string) => {
    try {
      useRemoveBackgroundStore.getState().setPendingExternalUrl(url);
      useTabStore.getState().setActiveTab("REMOVE_BACKGROUND");
      galleryModalVisibleViewMode.value = false;
      galleryModalVisibleDuringDrag.value = false;
      galleryModalLightboxVisible.value = false;
    } catch (e) {
      // no-op
    }
  };

  const handleMake3DObjectFromGallery = async (
    url: string,
    mediaId?: string,
  ) => {
    try {
      if (mediaId) {
        useImageTo3DStore.getState().setPendingExternalImage(url, mediaId);
      }
      useTabStore.getState().setActiveTab("IMAGE_TO_3D_OBJECT");
      galleryModalVisibleViewMode.value = false;
      galleryModalVisibleDuringDrag.value = false;
      galleryModalLightboxVisible.value = false;
    } catch (e) {
      // no-op
    }
  };

  const handleMake3DWorldFromGallery = async (
    url: string,
    mediaId?: string,
  ) => {
    try {
      if (mediaId) {
        useImageTo3DWorldStore.getState().setPendingExternalImage(url, mediaId);
      }
      useTabStore.getState().setActiveTab("IMAGE_TO_3D_WORLD");
      galleryModalVisibleViewMode.value = false;
      galleryModalVisibleDuringDrag.value = false;
      galleryModalLightboxVisible.value = false;
    } catch (e) {
      // no-op
    }
  };

  const getPageTitle = (): string => {
    switch (tabStore.activeTabId) {
      case "2D":
        return "Canvas";
      case "3D":
        return "3D Editor";
      case "IMAGE":
        return "Text to Image";
      case "VIDEO":
        return "Generate Video";
      case "EDIT":
        return "Edit Image";
      case "VIDEO_FRAME_EXTRACTOR":
        return "Video Frame Extractor";
      case "VIDEO_WATERMARK_REMOVAL":
        return "Video Watermark Remover";
      case "IMAGE_WATERMARK_REMOVAL":
        return "Image Watermark Remover";
      case "IMAGE_TO_3D_OBJECT":
        return "Image to 3D Object";
      case "IMAGE_TO_3D_WORLD":
        return "Image to 3D World";
      case "APPS":
        return "ArtCraft Apps";
      case "BACKGROUND_CHANGE":
        return "Background Change";
      default:
        return "Artcraft";
    }
  };

  const pageTitle = getPageTitle();

  const { toggleModal: toggleSubscriptionModal } = usePricingModalStore();
  const { toggleModal: toggleCreditsModal } = useCreditsModalStore();

  // Pick logo based on current theme (light uses black logo; others use white)
  const [_logoSrc, setLogoSrc] = useState<string>(
    "/resources/logo/artcraft-logo-color-white.svg",
  );
  useEffect(() => {
    const computeLogo = () => {
      const root = document.documentElement;
      const isLight = root.classList.contains("theme-light");
      setLogoSrc(
        isLight
          ? "/resources/logo/artcraft-logo-color-black.svg"
          : "/resources/logo/artcraft-logo-color-white.svg",
      );
    };
    computeLogo();
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "attributes" && m.attributeName === "class") {
          computeLogo();
          break;
        }
      }
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => mo.disconnect();
  }, []);

  return (
    <>
      <header
        className="fixed left-0 top-0 z-[60] w-full border-b border-ui-panel-border bg-ui-background"
        data-tauri-drag-region
      >
        <nav
          className="mx-auto grid h-[56px] w-screen grid-cols-3 items-center justify-between ps-3"
          aria-label="navigation"
          data-tauri-drag-region
        >
          <div
            className={`flex items-center gap-3 ${platform === "macos" ? "ml-14" : ""}`}
            data-tauri-drag-region
          >
            {/* <div className="mr-2" data-tauri-drag-region>
              <span className="sr-only" data-tauri-drag-region>
                ArtCraft
              </span>
              <img
                className="h-[24px] w-auto"
                src={logoSrc}
                alt="ArtCraft Logo"
                data-tauri-drag-region
              />
            </div> */}
            <MenuIconSelector
              menuItems={appMenuTabs}
              activeMenu={tabStore.activeTabId}
              disabled={disableTabSwitcher()}
              onMenuChange={(tabId) => {
                gtagEvent("switch_tab", { tab: tabId });

                // Prevent a second input if the switcher is throttled.
                if (switcherThrottle.current) {
                  return;
                }
                switcherThrottle.current = true;
                setDisableSwitcher(true);

                if (tabId === "APPS") {
                  set3DPageMounted(false);
                  useTabStore.getState().setActiveTab("APPS");
                  setTimeout(() => {
                    switcherThrottle.current = false;
                    setDisableSwitcher(false);
                  }, SWITCHER_THROTTLE_TIME);
                  return;
                }

                // Disable 3d engine to prevent memory leak.
                if (tabId === "3D") {
                  set3DPageMounted(true);
                } else {
                  set3DPageMounted(false);
                }
                useTabStore.getState().setActiveTab(tabId as TabId);
                setTimeout(() => {
                  // Clear the throttle
                  switcherThrottle.current = false;
                  // Trigger a new re-render (important)
                  setDisableSwitcher(false);
                }, SWITCHER_THROTTLE_TIME);
              }}
              className="no-drag w-fit"
            />
          </div>

          <div
            className={`${tabStore.activeTabId === "3D" ? "no-drag" : ""} flex items-center justify-center gap-2 font-medium`}
            data-tauri-drag-region
          >
            {tabStore.activeTabId === "3D" ? (
              <SceneTitleInput pageName={pageName} />
            ) : (
              <h1
                className="flex items-center gap-2.5 text-base-fg"
                data-tauri-drag-region
              >
                {getCreatorIcon(
                  ModelCreator.ArtCraft,
                  "h-5 w-5 icon-auto-contrast opacity-50",
                )}
                {pageTitle}
              </h1>
            )}
          </div>

          <div className="flex justify-end gap-2" data-tauri-drag-region>
            <div className="no-drag flex items-center gap-1.5">
              <PopoverMenu
                position="bottom"
                align="center"
                triggerIcon={
                  <CreditsCoinWithStatus iconStatus={creditsIconStatus} />
                }
                triggerLabel={
                  <span className="whitespace-nowrap text-sm font-medium">
                    {sumTotalCredits} Credits
                  </span>
                }
                buttonClassName="h-[30px] px-2 ps-1.5 bg-transparent hover:bg-ui-controls/30 border-0 shadow-none"
                panelClassName="mt-3 bg-ui-panel border border-ui-panel-border text-base-fg"
              >
                {(close) => (
                  <div className="w-72 p-2.5 text-base-fg">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-base-fg/80">
                        Your credit balance
                      </span>
                      <button
                        className="text-sm font-medium text-primary-400 transition-all hover:text-primary-300"
                        onClick={() => {
                          close();
                          toggleCreditsModal();
                        }}
                      >
                        Buy credits
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-4xl font-bold text-base-fg">
                      <FontAwesomeIcon
                        icon={faCoins}
                        className="text-2xl text-primary"
                      />
                      {sumTotalCredits}
                    </div>

                    <button
                      className="mt-2 flex items-center gap-1.5 text-xs text-base-fg/50 transition-colors hover:text-primary"
                      onClick={() => {
                        close();
                        useCostBreakdownModalStore.getState().openModal();
                      }}
                    >
                      <FontAwesomeIcon icon={faCalculator} />
                      Cost calculator
                    </button>

                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="action"
                        className="h-9 grow"
                        onClick={() => {
                          close();
                          handleOpenBillingSettings();
                        }}
                      >
                        See details
                      </Button>
                      <Button
                        variant="primary"
                        className="h-9 grow"
                        onClick={() => {
                          close();
                          toggleSubscriptionModal();
                        }}
                        icon={faGem}
                      >
                        Support
                      </Button>
                    </div>
                  </div>
                )}
              </PopoverMenu>

              {!hasPaidPlan && (
                <Button
                  variant="primary"
                  icon={faGem}
                  onClick={toggleSubscriptionModal}
                  className="h-[38px] shadow-md shadow-primary-500/50 transition-all duration-300 hover:shadow-md hover:shadow-primary-500/75"
                >
                  Support
                </Button>
              )}

              <UploadImagesButton className="h-[38px] w-[38px]" />

              <Tooltip content="Settings" position="bottom" delay={300}>
                <Button
                  variant="secondary"
                  icon={faGear}
                  className="h-[38px] w-[38px]"
                  onClick={() => {
                    setSettingsSection("general");
                    setIsSettingsModalOpen(true);
                    gtagEvent("open_settings_modal");
                  }}
                />
              </Tooltip>

              <Button
                variant="secondary"
                className="h-[38px]"
                icon={faImages}
                onClick={handleOpenGalleryModal}
              >
                <span className="hidden whitespace-nowrap text-base-fg xl:block">
                  My Library
                </span>
              </Button>

              {/* <Activity /> */}
              <TaskQueue />
            </div>

            <div className="no-drag">
              {/* TODO(bt,2025-09-12): This was the old auth buttons that didn't work. We need to remove this and clean up the DOM. */}
            </div>

            {isDesktop && platform !== "macos" && (
              <div className="no-drag flex items-center">
                <Button
                  variant="secondary"
                  className="h-[32px] w-[44px] rounded-none border-0 bg-transparent text-base-fg opacity-70 shadow-none hover:bg-ui-controls/20 hover:opacity-100"
                  onClick={minimize}
                >
                  <FontAwesomeIcon icon={faDash} className="text-xs" />
                </Button>
                <Button
                  variant="secondary"
                  className="h-[32px] w-[44px] rounded-none border-0 bg-transparent text-base-fg opacity-70 shadow-none hover:bg-ui-controls/20 hover:opacity-100"
                  onClick={toggleMaximize}
                >
                  <FontAwesomeIcon
                    icon={isMaximized ? faWindowRestore : faSquare}
                    className="text-xs"
                  />
                </Button>
                <Button
                  variant="secondary"
                  className="h-[32px] w-[44px] rounded-none border-0 bg-transparent text-base-fg opacity-70 shadow-none hover:bg-red/10 hover:text-red"
                  onClick={close}
                >
                  <FontAwesomeIcon icon={faXmark} className="text-lg" />
                </Button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        globalAccountLogoutCallback={() => {
          setIsSettingsModalOpen(false);
          setLogoutStates();
        }}
        onStoryboardPageDisable={() => {
          useStoryboardStore.getState().reset();
          goToApp("IMAGE");
        }}
        initialSection={settingsSection}
      />

      <GalleryModal
        mode="view"
        onDownloadClicked={downloadFile}
        onEditClicked={handleEditFromGallery}
        onTurnIntoVideoClicked={handleTurnIntoVideoFromGallery}
        onRemoveBackgroundClicked={handleRemoveBackgroundFromGallery}
        onMake3DObjectClicked={handleMake3DObjectFromGallery}
        onMake3DWorldClicked={handleMake3DWorldFromGallery}
        onRecreateClicked={handleRecreateFromGallery}
        onDeleteMedia={galleryModalDeleteMedia}
        subscribeToMediaEvents={galleryModalSubscribeToMediaEvents}
      />

      <ProviderSetupModal />
      <ProviderBillingModal isVideoPage={tabStore.activeTabId === "VIDEO"} />
      <CreditsModal />
      <CostBreakdownModal activeTabId={tabStore.activeTabId} />
    </>
  );
};
