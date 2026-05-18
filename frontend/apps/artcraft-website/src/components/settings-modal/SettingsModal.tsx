import { useEffect, useState } from "react";
import { Modal } from "@storyteller/ui-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faUser } from "@fortawesome/pro-solid-svg-icons";
import { Switch } from "@storyteller/ui-switch";
import { twMerge } from "tailwind-merge";
import { useEnterToGenerateStore } from "../../lib/enter-to-generate-store";
import { useSession } from "../../lib/session";
import { AccountSection } from "./AccountSection";

type Tab = "general" | "account";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABS: { id: Tab; label: string; icon: typeof faCog }[] = [
  { id: "general", label: "General", icon: faCog },
  { id: "account", label: "Account", icon: faUser },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>("general");

  useEffect(() => {
    if (isOpen) setTab("general");
  }, [isOpen]);

  const activeLabel = TABS.find((t) => t.id === tab)?.label ?? "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl" childPadding={false}>
      <div className="h-[560px]">
        <div className="grid h-full grid-cols-12 gap-3">
          <div className="relative col-span-4 p-3 pt-2 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-ui-panel-border">
            <div className="flex items-center gap-2.5 py-0.5">
              <h2 className="text-[18px] font-semibold opacity-80">Settings</h2>
            </div>
            <hr className="my-2 w-full border-ui-panel-border" />
            <div className="space-y-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={twMerge(
                    "h-9 w-full rounded-lg p-2 text-left transition-colors",
                    tab === t.id ? "bg-[#63636B]/20" : "hover:bg-white/[0.04]",
                  )}
                >
                  <div className="flex items-center gap-2.5 text-sm">
                    <FontAwesomeIcon icon={t.icon} />
                    {t.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-8 flex h-full flex-col overflow-y-auto relative">
            <div className="w-full border-b border-ui-panel-border py-2.5 ps-0">
              <h2 className="text-[18px] font-semibold">{activeLabel}</h2>
            </div>
            <div className="p-3 ps-0 text-sm h-full">
              {tab === "general" && <GeneralPanel />}
              {tab === "account" && <AccountPanel />}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function GeneralPanel() {
  const enterToGenerate = useEnterToGenerateStore((s) => s.enabled);
  const setEnterToGenerate = useEnterToGenerateStore((s) => s.setEnabled);

  return (
    <div className="space-y-4 text-base-fg">
      <div className="flex flex-col gap-2 pt-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">Enter to generate</p>
          <p className="text-xs opacity-70">
            When on, pressing Enter submits the prompt and Shift+Enter
            adds a new line. When off (default), both Enter and
            Shift+Enter add a new line, use the button to submit.
          </p>
        </div>
        <Switch enabled={enterToGenerate} setEnabled={setEnterToGenerate} offClassName="bg-white/20" />
      </div>
    </div>
  );
}

function AccountPanel() {
  const { user, authChecked } = useSession();

  if (!authChecked) {
    return (
      <div className="pt-3 text-xs opacity-60">Loading account details...</div>
    );
  }

  if (!user) {
    return (
      <div className="pt-3 text-xs opacity-60">
        You need to be signed in to manage account settings.
      </div>
    );
  }

  return (
    <div className="pt-3">
      <AccountSection user={user} />
    </div>
  );
}
