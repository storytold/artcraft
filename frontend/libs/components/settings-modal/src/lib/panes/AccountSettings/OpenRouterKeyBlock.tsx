import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { useEffect, useState } from "react";
import {
  ClearProviderCredential,
  GetProviderCredential,
  ProviderCredentialKey,
  SetProviderApiKey,
} from "@storyteller/tauri-api";
import { LoaderCircleIcon } from "lucide-react";
import { useRefreshAccountStateEvent } from "@storyteller/tauri-events";
import { toast } from "react-hot-toast";

// The user's own OpenRouter key: image models run on their OpenRouter account, billed there.
export const OpenRouterKeyBlock = () => {
  const [maybeKeyStart, setMaybeKeyStart] = useState<string | undefined>(undefined);
  const [draftKey, setDraftKey] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const fetchKey = async () => {
    setIsBusy(true);
    try {
      const entry = await GetProviderCredential(ProviderCredentialKey.OpenRouterApiKey);
      setMaybeKeyStart(entry?.maybe_details?.maybe_key_start ?? undefined);
    } catch (e) {
      console.error("Error fetching OpenRouter API key", e);
      setMaybeKeyStart(undefined);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    fetchKey();
  }, []);

  useRefreshAccountStateEvent(async () => {
    fetchKey();
  });

  const saveKey = async () => {
    setIsBusy(true);
    try {
      await SetProviderApiKey(ProviderCredentialKey.OpenRouterApiKey, draftKey);
      setDraftKey("");
      toast.success("OpenRouter API key saved");
    } catch (e) {
      console.error("Error saving OpenRouter API key", e);
      toast.error("Failed to save API key");
    } finally {
      await fetchKey();
    }
  };

  const removeKey = async () => {
    setIsBusy(true);
    try {
      await ClearProviderCredential(ProviderCredentialKey.OpenRouterApiKey);
    } catch (e) {
      console.error("Error clearing OpenRouter API key", e);
      toast.error("Failed to clear provider credential");
    } finally {
      await fetchKey();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
            OpenRouter API key
          </p>
          <p className="truncate text-sm font-medium text-base-fg/80">
            {maybeKeyStart || "Not set"}
          </p>
        </div>
        {maybeKeyStart && (
          <Button
            variant="destructive"
            className="h-9 shrink-0 px-3"
            onClick={removeKey}
            disabled={isBusy}
          >
            {isBusy ? <LoaderCircleIcon className="animate-spin text-sm" /> : "Remove"}
          </Button>
        )}
      </div>
      {!maybeKeyStart && (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (draftKey.trim()) {
              saveKey();
            }
          }}
        >
          <Input
            className="flex-1"
            type="password"
            autoComplete="off"
            aria-label="OpenRouter API key"
            placeholder="Paste your OpenRouter API key"
            value={draftKey}
            onChange={(e) => setDraftKey(e.target.value)}
          />
          <Button
            type="submit"
            variant="secondary"
            className="h-10 shrink-0 px-4"
            disabled={isBusy || !draftKey.trim()}
          >
            Save
          </Button>
        </form>
      )}
    </div>
  );
};
