import { useEffect, useMemo, useState } from "react";
import { Modal } from "@storyteller/ui-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faUser, faKey } from "@fortawesome/pro-solid-svg-icons";
import { Switch } from "@storyteller/ui-switch";
import { USER_FEATURE_FLAGS } from "@storyteller/api";
import { twMerge } from "tailwind-merge";
import { useEnterToGenerateStore } from "../../lib/enter-to-generate-store";
import { useSession } from "../../lib/session";
import { AccountSection } from "./AccountSection";
import { ApiKeySection } from "./ApiKeySection";

type Tab = "general" | "account" | "apiKeys";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BASE_TABS: { id: Tab; label: string; icon: typeof faCog }[] = [
  { id: "general", label: "General", icon: faCog },
  { id: "account", label: "Account", icon: faUser },
];

const API_KEYS_TAB: { id: Tab; label: string; icon: typeof faCog } = {
  id: "apiKeys",
  label: "API Keys",
  icon: faKey,
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useSession();
  const [tab, setTab] = useState<Tab>("general");

  const hasApiKeyFlag = !!user?.maybe_feature_flags?.includes(
    USER_FEATURE_FLAGS.API_KEY,
  );

  const tabs = useMemo(
    () => (hasApiKeyFlag ? [...BASE_TABS, API_KEYS_TAB] : BASE_TABS),
    [hasApiKeyFlag],
  );

  useEffect(() => {
    if (isOpen) setTab("general");
  }, [isOpen]);

  // If the only-conditional tab disappears (e.g. flag revoked while open),
  // fall back to a visible tab.
  useEffect(() => {
    if (!tabs.some((t) => t.id === tab)) setTab("general");
  }, [tabs, tab]);

  const activeLabel = tabs.find((t) => t.id === tab)?.label ?? "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl"
      childPadding={false}
    >
      <div className="h-[100dvh] sm:h-[560px]">
        <div className="flex h-full flex-col sm:grid sm:grid-cols-12 sm:gap-3">
          <div className="relative shrink-0 border-b border-ui-panel-border p-4 sm:col-span-4 sm:border-b-0 sm:p-3 sm:pt-2 sm:after:absolute sm:after:right-0 sm:after:top-0 sm:after:h-full sm:after:w-px sm:after:bg-ui-panel-border">
            <div className="hidden items-center gap-2.5 py-0.5 sm:flex">
              <h2 className="text-[18px] font-semibold opacity-80">Settings</h2>
            </div>
            <hr className="my-2 hidden w-full border-ui-panel-border sm:block" />
            <div className="flex gap-2 overflow-x-auto pe-10 sm:block sm:space-y-1 sm:overflow-visible sm:pe-0">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={twMerge(
                    "h-9 shrink-0 rounded-lg px-3 text-left transition-colors sm:w-full sm:px-2",
                    tab === t.id ? "bg-[#63636B]/20" : "hover:bg-white/[0.04]",
                  )}
                >
                  <div className="flex items-center gap-2.5 whitespace-nowrap text-sm">
                    <FontAwesomeIcon icon={t.icon} />
                    {t.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto sm:col-span-8 sm:h-full">
            <div className="w-full border-b border-ui-panel-border px-4 py-2.5 sm:px-0">
              <h2 className="text-[18px] font-semibold">{activeLabel}</h2>
            </div>
            <div className="h-full p-4 text-sm sm:p-3 sm:ps-0">
              {tab === "general" && <GeneralPanel />}
              {tab === "account" && <AccountPanel />}
              {tab === "apiKeys" && <ApiKeysPanel />}
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
            When on, pressing Enter submits the prompt and Shift+Enter adds a
            new line. When off (default), both Enter and Shift+Enter add a new
            line, use the button to submit.
          </p>
        </div>
        <Switch
          enabled={enterToGenerate}
          setEnabled={setEnterToGenerate}
          offClassName="bg-white/20"
        />
      </div>
    </div>
  );
}

function AccountPanel() {
  const { user, authChecked, passwordNotSet } = useSession();

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
      <AccountSection user={user} passwordNotSet={passwordNotSet} />
    </div>
  );
}

function ApiKeysPanel() {
  const { user, authChecked } = useSession();

  if (!authChecked) {
    return <div className="pt-3 text-xs opacity-60">Loading API keys...</div>;
  }

  if (!user) {
    return (
      <div className="pt-3 text-xs opacity-60">
        You need to be signed in to manage API keys.
      </div>
    );
  }

  return (
    <div className="pt-3">
      <ApiKeySection user={user} />
    </div>
  );
}
