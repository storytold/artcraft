import { Modal } from "@storyteller/ui-modal";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faCog,
  faVolumeHigh,
  faCircleInfo,
  faRoute,
  faCreditCard,
  faPalette,
} from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { MiscSettingsPane } from "./panes/MiscSettingsPane";
import { AudioSettingsPane } from "./panes/AudioSettingsPane";
import { AccountSettingsPane } from "./panes/AccountSettings/AccountSettingsPane";
import { AboutSettingsPane } from "./panes/AboutSettingsPane";
import { ProviderPrioritySettingsPane } from "./panes/ProviderPrioritySettingsPane";
import { gtagEvent } from "@storyteller/google-analytics";
import { BillingSettingsPane } from "./panes/BillingSettingsPane";
import { AppearanceSettingsPane } from "./panes/AppearanceSettingsPane";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalAccountLogoutCallback: () => void;
  initialSection?: SettingsSection;
}

type SettingsSection =
  | "general"
  | "appearance"
  | "accounts"
  | "alerts"
  | "about"
  | "provider_priority"
  | "billing";

export const SettingsModal = ({
  isOpen,
  onClose,
  globalAccountLogoutCallback,
  initialSection = "general",
}: SettingsModalProps) => {
  const [selectedSection, setSelectedSection] =
    useState<SettingsSection>(initialSection);

  // Sync the selected section with incoming prop when modal opens or prop changes
  useEffect(() => {
    if (isOpen) {
      setSelectedSection(initialSection);
    }
  }, [isOpen, initialSection]);

  const sections = [
    { id: "general" as const, label: "General", icon: faCog },

    { id: "accounts" as const, label: "Accounts", icon: faUser },
    { id: "billing" as const, label: "Plan & Credits", icon: faCreditCard },

    {
      id: "provider_priority" as const,
      label: "Provider Priority",
      icon: faRoute,
    },
    { id: "appearance" as const, label: "Appearance", icon: faPalette },
    { id: "alerts" as const, label: "Alerts", icon: faVolumeHigh },
    { id: "about" as const, label: "About", icon: faCircleInfo },
    //{ id: "video" as const, label: "Video", icon: faVideo },
    //{ id: "image" as const, label: "Image", icon: faImage },
  ];

  const renderContent = () => {
    switch (selectedSection) {
      case "appearance":
        return <AppearanceSettingsPane />;
      case "alerts":
        return <AudioSettingsPane />;
      case "general":
        return <MiscSettingsPane />;
      case "accounts":
        return (
          <AccountSettingsPane
            globalAccountLogoutCallback={globalAccountLogoutCallback}
          />
        );
      case "about":
        return <AboutSettingsPane />;
      case "provider_priority":
        return <ProviderPrioritySettingsPane />;
      case "billing":
        return <BillingSettingsPane />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl"
      childPadding={false}
    >
      <div className="h-[560px]">
        <div className="grid h-full grid-cols-12 gap-3">
          <div className="relative col-span-4 p-3 pt-2 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-ui-panel-border">
            <div className="flex items-center justify-between gap-2.5 py-0.5">
              <h2 className="text-[18px] font-semibold opacity-80">Settings</h2>
            </div>
            <hr className="my-2 w-full border-ui-panel-border" />
            <div className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  className={twMerge(
                    "h-9 w-full rounded-lg p-2 text-left transition-colors duration-100 hover:bg-[#63636B]/30",
                    section.id === selectedSection ? "bg-[#63636B]/20" : ""
                  )}
                  onClick={() => {
                    gtagEvent("switch_settings_section", {
                      section: section.id,
                    });
                    setSelectedSection(section.id);
                  }}
                >
                  <div className="flex items-center gap-2.5 text-sm">
                    <FontAwesomeIcon icon={section.icon} />
                    {section.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-8 flex h-full flex-col">
            <div className="w-full border-b border-ui-panel-border py-2.5 ps-0">
              <h2 className="text-[18px] font-semibold">
                {sections.find((s) => s.id === selectedSection)?.label}
              </h2>
            </div>
            <div className="p-3 ps-0 text-sm h-full">{renderContent()}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
