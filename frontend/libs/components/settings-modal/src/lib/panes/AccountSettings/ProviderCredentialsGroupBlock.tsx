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
  hasCredentials: boolean;
}

const ApiKeyRow = ({
  label,
  credentialKey,
  initialRedactedValue,
  hasCredentials,
}: ApiKeyRowProps) => {
  const [value, setValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log(`[ProviderCredentials] onChange fired for ${credentialKey}: "${newValue}"`);
    setValue(newValue);

    if (newValue.trim() === "") {
      console.log(`[ProviderCredentials] Clearing ${credentialKey}...`);
      invoke("provider_clear_command", {
        request: { provider_credential: credentialKey },
      }).then(() => {
        console.log(`[ProviderCredentials] Cleared ${credentialKey}`);
      }).catch((e) => {
        console.error(`[ProviderCredentials] Error clearing ${credentialKey}:`, e);
      });
    } else {
      console.log(`[ProviderCredentials] Saving ${credentialKey}...`);
      invoke("provider_set_api_key_command", {
        request: { provider_credential: credentialKey, api_key: newValue },
      }).then(() => {
        console.log(`[ProviderCredentials] Saved ${credentialKey}`);
      }).catch((e) => {
        console.error(`[ProviderCredentials] Error saving ${credentialKey}:`, e);
      });
    }
  };

  return (
    <div>
      <label className="mb-1 block text-sm">{label}</label>
      <input
        type="password"
        value={value}
        onChange={handleChange}
        placeholder={hasCredentials ? initialRedactedValue : "Enter API Key"}
        className="h-10 w-full rounded-lg px-3 py-2.5 outline-none bg-ui-panel text-base-fg placeholder-base-fg/50 border border-ui-panel-border"
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
        console.log("[ProviderCredentials] Fetching provider list...");
        const result = (await invoke("provider_list_command")) as {
          payload: ProviderListResponse;
        };
        console.log("[ProviderCredentials] Got providers:", result.payload.providers);
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
        hasCredentials={falProvider?.has_credentials ?? false}
      />
      <ApiKeyRow
        label="Replicate API Key (optional)"
        credentialKey="replicate_api_key"
        initialRedactedValue={
          replicateProvider?.maybe_details?.maybe_key_start ?? ""
        }
        hasCredentials={replicateProvider?.has_credentials ?? false}
      />
    </div>
  );
};
