import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import {
  OpenUrl,
  ProviderClearCredential,
  ProviderListCredentials,
  ProviderSetApiKey,
  ProviderValidateBytePlusApiKey,
  type ProviderCredentialKey,
} from "@storyteller/tauri-api";

const BYTEPLUS_CONSOLE_URL = "https://console.byteplus.com/";
const SEED_AUDIO_CONSOLE_URL =
  "https://console.byteplus.com/voice/new/setting/activate?projectName=default";

// ModelArk model IDs the user has to activate before ArtCraft can use them with their key.
const MODELS_TO_ACTIVATE = [
  "dreamina-seedance-2-5-260628",
  "dreamina-seedance-2-0-260128",
  "dreamina-seedance-2-0-fast-260128",
  "dreamina-seedance-2-0-mini-260615",
  "dola-seedream-5-0-pro-260628",
  "seedream-5-0-260128",
  "seedream-4-5-251128",
  "seedream-4-0-250828",
  "seed-2-0-pro-260328",
  "hyper3d-gen2-260112",
  "hitem3d-2-0-251223",
];

// BytePlus uses one key for ModelArk and separate keys for Seed Audio and MediaKit.
export const BytePlusAccountBlock = () => {
  const [copied, setCopied] = useState(false);

  const copyModelList = async () => {
    try {
      await navigator.clipboard.writeText(MODELS_TO_ACTIVATE.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Error copying the BytePlus model list", e);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
          BytePlus ModelArk
        </p>
        <button
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-base-fg/55 hover:text-base-fg"
          onClick={() => void OpenUrl(BYTEPLUS_CONSOLE_URL)}
        >
          Open console
          <ExternalLinkIcon className="h-3 w-3" />
        </button>
      </div>

      <ApiKeyField
        label="ModelArk API key"
        hint="Seedance, Seedream, Seed 2.0 and 3D"
        credentialKey="byteplus_api_key"
        validateApiKey={validateBytePlusApiKey}
      />
      <ApiKeyField
        label="Seed Audio key"
        hint="Voice console"
        credentialKey="seed_audio_api_key"
        consoleUrl={SEED_AUDIO_CONSOLE_URL}
      />
      <ApiKeyField
        label="MediaKit key"
        hint="Video upscale"
        credentialKey="mediakit_api_key"
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-base-fg/55">
          Activate these models in ModelArk before using them.
        </p>
        <Button
          variant="secondary"
          className="h-8 shrink-0 px-3"
          icon={copied ? CheckIcon : CopyIcon}
          onClick={() => void copyModelList()}
        >
          {copied ? "Copied" : "Copy list"}
        </Button>
      </div>
    </div>
  );
};

interface ApiKeyFieldProps {
  label: string;
  hint: string;
  credentialKey: ProviderCredentialKey;
  consoleUrl?: string;
  // Resolves to a user-facing error, or null when the key is fine (or can't be checked offline).
  validateApiKey?: (apiKey: string) => Promise<string | null>;
}

type Status = { kind: "success" | "error"; text: string } | null;

const ApiKeyField = ({
  label,
  hint,
  credentialKey,
  consoleUrl,
  validateApiKey,
}: ApiKeyFieldProps) => {
  const [maybeSavedKeyStart, setMaybeSavedKeyStart] = useState<string | null>(
    null,
  );
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [value, setValue] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const loadSavedKey = async () => {
    try {
      const entries = await ProviderListCredentials();
      const entry = entries.find((e) => e.provider_credential === credentialKey);
      setHasSavedKey(!!entry?.has_credentials);
      setMaybeSavedKeyStart(entry?.maybe_details?.maybe_key_start ?? null);
    } catch (error) {
      setStatus({ kind: "error", text: (error as Error).message });
    }
  };

  useEffect(() => {
    void loadSavedKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentialKey]);

  const saveKey = async () => {
    const apiKey = value.trim();
    if (!apiKey || isBusy) return;
    setIsBusy(true);
    setStatus(null);
    try {
      const maybeValidationError = validateApiKey
        ? await validateApiKey(apiKey)
        : null;
      if (maybeValidationError) {
        setStatus({ kind: "error", text: maybeValidationError });
        return;
      }
      await ProviderSetApiKey(credentialKey, apiKey);
      setValue("");
      await loadSavedKey();
      setStatus({ kind: "success", text: "Saved" });
    } catch (error) {
      setStatus({ kind: "error", text: (error as Error).message });
    } finally {
      setIsBusy(false);
    }
  };

  const removeKey = async () => {
    setIsBusy(true);
    setStatus(null);
    try {
      await ProviderClearCredential(credentialKey);
      await loadSavedKey();
      setStatus({ kind: "success", text: "Removed" });
    } catch (error) {
      setStatus({ kind: "error", text: (error as Error).message });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-base-fg/55">
          {label} · {hint}
        </p>
        {consoleUrl && (
          <button
            className="flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-base-fg/55 hover:text-base-fg"
            onClick={() => void OpenUrl(consoleUrl)}
          >
            Console
            <ExternalLinkIcon className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          className="flex-1"
          inputClassName="h-9 font-mono text-xs"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder={
            hasSavedKey
              ? `${maybeSavedKeyStart ?? "Saved"} · paste a new key to replace it`
              : "Paste key"
          }
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void saveKey();
          }}
        />
        {value.trim() || !hasSavedKey ? (
          <Button
            className="h-9 shrink-0 px-3"
            onClick={() => void saveKey()}
            disabled={!value.trim()}
            loading={isBusy}
          >
            Save
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="h-9 shrink-0 px-3"
            onClick={() => void removeKey()}
            loading={isBusy}
          >
            Remove
          </Button>
        )}
      </div>

      {status && (
        <p
          role={status.kind === "error" ? "alert" : "status"}
          className={
            status.kind === "error"
              ? "font-mono text-[11px] text-red"
              : "font-mono text-[11px] text-emerald-400"
          }
        >
          {status.kind === "success" ? `✓ ${status.text}` : status.text}
        </p>
      )}
    </div>
  );
};

// Blocks saving keys BytePlus rejects; lets the key through when the check can't run (offline).
const validateBytePlusApiKey = async (
  apiKey: string,
): Promise<string | null> => {
  const result = await ProviderValidateBytePlusApiKey(apiKey);
  if (result.outcome === "invalid") {
    return result.maybe_message ?? "BytePlus rejected this API key.";
  }
  if (result.outcome === "unverified") {
    console.warn("Could not verify the BytePlus API key:", result.maybe_message);
  }
  return null;
};
