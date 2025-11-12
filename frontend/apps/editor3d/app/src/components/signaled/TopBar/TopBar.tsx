import { useEffect, useRef, useState } from "react";
import {
  faGear,
  faImages,
  faGem,
  faCoinFront,
  faGrid2,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faWindowRestore,
  faSquare,
  faXmark,
  faDash,
} from "@fortawesome/pro-regular-svg-icons";
import { Button } from "@storyteller/ui-button";
import { PopoverMenu } from "@storyteller/ui-popover";
import { SceneTitleInput } from "./SceneTitleInput";
import {
  GalleryModal,
  galleryModalVisibleViewMode,
  galleryModalVisibleDuringDrag,
  galleryModalLightboxVisible,
} from "@storyteller/ui-gallery-modal";
import { SettingsModal } from "@storyteller/ui-settings-modal";
import { Tooltip } from "@storyteller/ui-tooltip";
import { downloadFileFromUrl, FilterMediaClasses } from "@storyteller/api";
import {
  MenuIconSelector,
  MenuIconItem,
} from "@storyteller/ui-menu-icon-selector";
import { signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { setLogoutStates } from "~/signals/authentication/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TabId, useTabStore } from "~/pages/Stores/TabState";
import {
  is3DEditorInitialized,
  is3DSceneLoaded,
  set3DPageMounted,
} from "~/pages/PageEnigma/Editor/editor";
import toast from "react-hot-toast";
import { gtagEvent } from "@storyteller/google-analytics";
import {
  useTauriWindowControls,
  useTauriPlatform,
} from "@storyteller/tauri-utils";
import { useEditStore } from "../../../pages/PageEdit/stores/EditState";
import { BaseSelectorImage } from "../../../pages/PageEdit/BaseImageSelector";
import { ProviderSetupModal } from "@storyteller/provider-setup-modal";
import { ProviderBillingModal } from "@storyteller/provider-billing-modal";
import {
  usePricingModalStore,
  useCreditsModalStore,
} from "@storyteller/ui-pricing-modal";
import { useCreditsBalanceChangedEvent } from "@storyteller/tauri-events";
import { useSubscriptionPlanChangedEvent } from "@storyteller/tauri-events";
import { useCreditsState } from "@storyteller/credits";
import { useSubscriptionState } from "@storyteller/subscription";
import { UploadImagesButton } from "./UploadImagesButton";
import { TaskQueue } from "./TaskQueue";
import { usePromptVideoStore, RefImage } from "@storyteller/ui-promptbox";
import { APP_DESCRIPTORS } from "~/config/appMenu";
import { AppsQuickMenu } from "./AppsQuickMenu";

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

  const creditsStore = useCreditsState();
  const sumTotalCredits = creditsStore.totalCredits;

  // Just calling this function kills the app:
  const subscriptionStore = useSubscriptionState();
  const hasPaidPlan = subscriptionStore.hasPaidPlan();

  useEffect(() => {
    creditsStore.fetchFromServer();
    subscriptionStore.fetchFromServer();
  }, []);

  useCreditsBalanceChangedEvent(async () => {
    creditsStore.fetchFromServer();
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
      await downloadFileFromUrl(url);
      if (mediaClass === FilterMediaClasses.DIMENSIONAL) {
        toast.success(`Downloaded 3D model`);
      } else {
        toast.success(`Downloaded ${mediaClass}`);
      }
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const handleEditFromGallery = async (url: string, mediaId?: string) => {
    try {
      // Reset editor state
      useEditStore.getState().RESET();

      // Switch to EDIT tab
      useTabStore.getState().setActiveTab("EDIT");

      // Select the image for editing
      const baseImage: BaseSelectorImage = {
        url,
        mediaToken: mediaId || "",
      };

      // Add it to state history
      useEditStore.getState().addHistoryImageBundle({ images: [baseImage] });
      useEditStore.getState().setBaseImageInfo(baseImage);

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

  const getPageTitle = (): string => {
    switch (tabStore.activeTabId) {
      case "2D":
        return "Canvas";
      case "3D":
        return "3D Editor";
      case "IMAGE":
        return "Text to Image";
      case "VIDEO":
        return "Image to Video";
      case "EDIT":
        return "Edit Image";
      case "VIDEO_FRAME_EXTRACTOR":
        return "Video Frame Extractor";
      default:
        return "Artcraft";
    }
  };

  const pageTitle = getPageTitle();

  const { toggleModal: toggleSubscriptionModal } = usePricingModalStore();
  const { toggleModal: toggleCreditsModal } = useCreditsModalStore();

  // Pick logo based on current theme (light uses black logo; others use white)
  const [logoSrc, setLogoSrc] = useState<string>(
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
          <div className="flex items-center gap-3" data-tauri-drag-region>
            <div className="mr-2" data-tauri-drag-region>
              <span className="sr-only" data-tauri-drag-region>
                ArtCraft
              </span>
              <img
                className="h-[24px] w-auto"
                src={logoSrc}
                alt="ArtCraft Logo"
                data-tauri-drag-region
              />
            </div>
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
              <h1 className="text-base-fg" data-tauri-drag-region>
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
                  <FontAwesomeIcon
                    icon={faCoinFront}
                    className="text-primary"
                  />
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
                        icon={faCoinFront}
                        className="text-2xl text-primary"
                      />
                      {sumTotalCredits}
                    </div>
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
                        Upgrade
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
                  Upgrade
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
        globalAccountLogoutCallback={() => setLogoutStates()}
        initialSection={settingsSection}
      />

      <GalleryModal
        mode="view"
        onDownloadClicked={downloadFile}
        onEditClicked={handleEditFromGallery}
        onTurnIntoVideoClicked={handleTurnIntoVideoFromGallery}
      />

      <ProviderSetupModal />
      <ProviderBillingModal />
    </>
  );
};
