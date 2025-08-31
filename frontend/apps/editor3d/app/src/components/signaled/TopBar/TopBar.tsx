import { useRef, useState } from "react";
import {
  faGear,
  faImages,
  faCube,
  faFilm,
  faPaintbrush,
  faImage,
  faPenNib,
  faGem,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faWindowRestore,
  faSquare,
  faXmark,
  faDash,
} from "@fortawesome/pro-regular-svg-icons";
import { Button } from "@storyteller/ui-button";
import { AuthButtons } from "./AuthButtons";
import { SceneTitleInput } from "./SceneTitleInput";
import { Activity } from "~/pages/PageEnigma/comps/GenerateModals/Activity";
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
import { usePricingModalStore } from "@storyteller/ui-pricing-modal";
// import { ProgressCircle } from "@storyteller/ui-progress"; // Uncomment this for Credits indicator - BFlat

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
const appMenuTabs: MenuIconItem<TabId>[] = [
  {
    id: "IMAGE",
    label: "Text to Image",
    icon: <FontAwesomeIcon icon={faImage} />,
  },
  {
    id: "VIDEO",
    label: "Image to Video",
    icon: <FontAwesomeIcon icon={faFilm} />,
  },
  {
    id: "EDIT",
    label: "Edit Image",
    icon: <FontAwesomeIcon icon={faPenNib} />,
    imageSrc: "/resources/gifs/INPAINT_CANVAS_DEMO.gif",
    description: "Modify your image with AI",
    large: true,
  },
  {
    id: "2D",
    label: "2D Canvas",
    icon: <FontAwesomeIcon icon={faPaintbrush} />,
    imageSrc: "/resources/gifs/2D_CANVAS_DEMO.gif",
    description: "Easy edits. Great for graphic design.",
    large: true,
  },
  {
    id: "3D",
    label: "3D Editor",
    icon: <FontAwesomeIcon icon={faCube} />,
    imageSrc: "/resources/gifs/3D_CANVAS_DEMO.gif",
    description: "Precision control. Great for AI film.",
    large: true,
  },
];

export const topNavMediaId = signal<string>("");
export const topNavMediaUrl = signal<string>("");

export const TopBar = ({ pageName, loginSignUpPressed }: Props) => {
  useSignals();

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsSection, setSettingsSection] =
    useState<SettingsSection>("general");

  // Credit state (replace with real data fetch)
  const [credits, setCredits] = useState({
    used: 800,
    total: 1000,
  });

  const creditsRemaining = credits.total - credits.used;
  const creditsRemainingPercentage = (creditsRemaining / credits.total) * 100;
  const isLowCredit = creditsRemainingPercentage < 20; // Less than 20% credits remaining

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
      default:
        return "Artcraft";
    }
  };

  const pageTitle = getPageTitle();

  const { toggleModal } = usePricingModalStore();

  return (
    <>
      <header
        className="fixed left-0 top-0 z-[60] w-full border-b border-white/5 bg-ui-background"
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
                src="/resources/images/artcraft-logo-3.png"
                alt="Logo ArtCraft"
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

                // Disable 3d engine to prevent memory leak.
                if (tabId === "3D") {
                  set3DPageMounted(true);
                } else {
                  set3DPageMounted(false);
                }
                useTabStore.getState().setActiveTab(tabId);
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
              <h1 data-tauri-drag-region>{pageTitle}</h1>
            )}
          </div>

          <div className="flex justify-end gap-2" data-tauri-drag-region>
            <div className="no-drag flex items-center gap-1.5">
              {/* Uncomment this for Credits indicator - BFlat */}
              {/* <Tooltip
                content={`${creditsRemaining}/${credits.total} credits remaining`}
                position="bottom"
                delay={300}
              >
                <Button
                  variant="ghost"
                  className="h-[30px] px-2 ps-1.5"
                  onClick={handleOpenBillingSettings}
                >
                  <ProgressCircle
                    value={creditsRemainingPercentage}
                    isLow={isLowCredit}
                    size="small"
                  />
                  <span className="whitespace-nowrap text-sm font-medium">
                    {creditsRemaining} Credits
                  </span>
                </Button>
              </Tooltip> */}

              <Button
                variant="primary"
                icon={faGem}
                onClick={toggleModal}
                className="h-[38px] shadow-md shadow-primary-500/50 transition-all duration-300 hover:shadow-md hover:shadow-primary-500/75"
              >
                Upgrade Now
              </Button>

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
                <span className="hidden whitespace-nowrap xl:block">
                  My Library
                </span>
              </Button>

              <Activity />
            </div>
            <div className="no-drag">
              <AuthButtons loginSignUpPressed={loginSignUpPressed} />
            </div>
            {isDesktop && platform !== "macos" && (
              <div className="no-drag flex items-center">
                <Button
                  variant="secondary"
                  className="h-[32px] w-[44px] rounded-none bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={minimize}
                >
                  <FontAwesomeIcon icon={faDash} className="text-xs" />
                </Button>
                <Button
                  variant="secondary"
                  className="h-[32px] w-[44px] rounded-none bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={toggleMaximize}
                >
                  <FontAwesomeIcon
                    icon={isMaximized ? faWindowRestore : faSquare}
                    className="text-xs"
                  />
                </Button>
                <Button
                  variant="secondary"
                  className="h-[32px] w-[44px] rounded-none bg-transparent text-white/70 hover:bg-red/40 hover:text-white"
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
      />

      <ProviderSetupModal />
      <ProviderBillingModal />
    </>
  );
};
