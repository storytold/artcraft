import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

// ── Types matching the Rust ProviderCredentialKey enum ──

type ProviderCredentialKey =
  | "fal_api_key"
  | "replicate_api_key"
  | "grok_web_login"
  | "higgsfield_web_login"
  | "midjourney_login"
  | "runway_web_login";

interface ProviderCredentialDetails {
  maybe_key_start: string | null;
  maybe_full_key: string | null;
  maybe_email_address: string | null;
  maybe_username: string | null;
}

interface ProviderListEntry {
  provider_credential: ProviderCredentialKey;
  credential_type: string;
  has_credentials: boolean;
  maybe_details: ProviderCredentialDetails | null;
}

interface ProviderListResponse {
  providers: ProviderListEntry[];
}

// ── API key input row ──

interface ApiKeyRowProps {
  label: string;
  credentialKey: ProviderCredentialKey;
  initialRedactedValue: string;
  initialFullKey: string;
}

const ApiKeyRow = ({
  label,
  credentialKey,
  initialRedactedValue,
  initialFullKey,
}: ApiKeyRowProps) => {
  // The actual key value (editable).
  const [fullKey, setFullKey] = useState(initialFullKey);
  // The redacted display value.
  const [redacted, setRedacted] = useState(initialRedactedValue);
  // Whether the input is focused (show real value vs redacted).
  const [isFocused, setIsFocused] = useState(false);
  // Track if user changed something since last save.
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setFullKey(newValue);
    setIsDirty(true);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);

    if (!isDirty) return;
    setIsDirty(false);

    const trimmed = fullKey.trim();

    if (trimmed === "") {
      invoke("provider_clear_command", {
        request: { provider_credential: credentialKey },
      }).then(() => {
        setFullKey("");
        setRedacted("");
        console.log(`[ProviderCredentials] Cleared ${credentialKey}`);
      }).catch((e) => {
        console.error(`[ProviderCredentials] Error clearing ${credentialKey}:`, e);
      });
    } else {
      invoke("provider_set_api_key_command", {
        request: { provider_credential: credentialKey, api_key: trimmed },
      }).then(() => {
        setFullKey(trimmed);
        setRedacted(
          trimmed.length > 6
            ? trimmed.substring(0, 6) + "********"
            : "********"
        );
        console.log(`[ProviderCredentials] Saved ${credentialKey}`);
      }).catch((e) => {
        console.error(`[ProviderCredentials] Error saving ${credentialKey}:`, e);
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const hasKey = isFocused ? fullKey.length > 0 : redacted.length > 0;

  return (
    <div>
      <label className="mb-1 block text-sm">{label}</label>
      <input
        type="text"
        value={isFocused ? fullKey : (redacted || "")}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Enter API Key"
        className="h-10 w-full rounded-lg px-3 py-2.5 outline-none bg-ui-panel text-base-fg placeholder-base-fg/50 border border-ui-panel-border transition-all duration-150 ease-in-out hover:border-primary/60 focus:border-primary"
        readOnly={!isFocused}
      />
    </div>
  );
};

// ── Main block ──

export const ProviderCredentialsGroupBlock = () => {
  const [providers, setProviders] = useState<ProviderListEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const result = (await invoke("provider_list_command")) as {
          payload: ProviderListResponse;
        };
        setProviders(result.payload.providers);
      } catch (e) {
        console.error("[ProviderCredentials] Error fetching provider list:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProviders();
  }, []);

  const findProvider = (key: ProviderCredentialKey) =>
    providers.find((p) => p.provider_credential === key);

  if (isLoading) {
    return null;
  }

  const falProvider = findProvider("fal_api_key");
  const replicateProvider = findProvider("replicate_api_key");

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-base-fg/60">API Keys</h3>
      <ApiKeyRow
        label="FAL API Key (optional)"
        credentialKey="fal_api_key"
        initialRedactedValue={
          falProvider?.maybe_details?.maybe_key_start ?? ""
        }
        initialFullKey={
          falProvider?.maybe_details?.maybe_full_key ?? ""
        }
      />
      <ApiKeyRow
        label="Replicate API Key (optional)"
        credentialKey="replicate_api_key"
        initialRedactedValue={
          replicateProvider?.maybe_details?.maybe_key_start ?? ""
        }
        initialFullKey={
          replicateProvider?.maybe_details?.maybe_full_key ?? ""
        }
      />
    </div>
  );
};
