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
  faHouse,
  faImages,
  faCalculator,
  faExclamation,
  faCheck,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { getCreatorIcon, ModelCreator } from "@storyteller/model-list";
import { useCreditsState, type CreditsIconStatus } from "@storyteller/credits";
import { gtagEvent } from "@storyteller/google-analytics";
import { ProviderBillingModal } from "@storyteller/provider-billing-modal";
import { ProviderSetupModal } from "@storyteller/provider-setup-modal";
import { useSubscriptionState } from "@storyteller/subscription";
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
import { GalleryViewToggle } from "@storyteller/ui-generation-list";
import { SettingsModal } from "@storyteller/ui-settings-modal";
import { Tooltip } from "@storyteller/ui-tooltip";
import { useEffect, useRef, useState } from "react";
import { APP_DESCRIPTORS, goToApp } from "~/config/appMenu";
import {
  applyMakeVideoFromImage,
  applyRecreateFromPromptData,
  downloadMediaFileToDisk,
} from "~/components/generation-feed/desktopMediaActions";
import { useStoryboardStore } from "~/pages/PageStoryboard";
import { useSceneStore } from "@storyteller/ui-pagedraw";
import { usePageSceneStore } from "@storyteller/ui-pagescene";
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

// NB: See `TabState` for the default tab. The Apps ("More") entry is first so
// it's the landing tab and leftmost in the switcher.
const appMenuTabs: MenuIconItem[] = [
  {
    id: "APPS",
    label: "Home",
    icon: <FontAwesomeIcon icon={faHouse} />,
    description: "Explore all apps and miniapps",
    large: true,
    tooltipContent: <AppsQuickMenu />,
    tooltipInteractive: true,
    tooltipPosition: "bottom",
  },
  ...APP_DESCRIPTORS.map((d) => ({
    id: d.id,
    label: d.label,
    icon: <FontAwesomeIcon icon={d.icon} />,
    imageSrc: d.imageSrc,
    description: d.description,
    large: d.large,
  })),
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

  const is3DSceneReady = usePageSceneStore((s) => s.is3DSceneLoaded);
  const is3DEditorReady = usePageSceneStore((s) => s.is3DEditorInitialized);
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

  const downloadFile = downloadMediaFileToDisk;

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

  const handleTurnIntoVideoFromGallery = applyMakeVideoFromImage;

  const handleRecreateFromGallery = applyRecreateFromPromptData;

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
        return "Create Image";
      case "VIDEO":
        return "Create Video";
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
        return "ArtCraft";
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
                  useTabStore.getState().setActiveTab("APPS");
                  setTimeout(() => {
                    switcherThrottle.current = false;
                    setDisableSwitcher(false);
                  }, SWITCHER_THROTTLE_TIME);
                  return;
                }

                // PageScene's mount/unmount in MainApp drives the
                // engine lifecycle now — no manual flag flips needed.
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
              {(tabStore.activeTabId === "IMAGE" ||
                tabStore.activeTabId === "VIDEO") && <GalleryViewToggle />}
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
                  className="transition-all duration-300"
                >
                  Upgrade
                </Button>
              )}

              <UploadImagesButton className="h-[34px] w-[34px]" />

              <Tooltip content="Settings" position="bottom" delay={300}>
                <Button
                  variant="secondary"
                  icon={faGear}
                  className="h-[34px] w-[34px]"
                  onClick={() => {
                    setSettingsSection("general");
                    setIsSettingsModalOpen(true);
                    gtagEvent("open_settings_modal");
                  }}
                />
              </Tooltip>

              <Button
                variant="secondary"
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
