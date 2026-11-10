import { useEffect, useState } from "react";
import { ClearWaveSpeedApiKey, HasWaveSpeedApiKey, SetWaveSpeedApiKey } from "@storyteller/tauri-api";
import { Button } from "@storyteller/ui-button";
import { WaveSpeedSubmissionRecovery } from "./WaveSpeedSubmissionRecovery";

export function WaveSpeedAccountBlock() {
  const [apiKey, setApiKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    HasWaveSpeedApiKey()
      .then((value) => { if (active) setConnected(value); })
      .catch(() => { if (active) setError("Could not load WaveSpeed credentials."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  async function save() {
    setBusy(true);
    setError("");
    try {
      await SetWaveSpeedApiKey(apiKey);
      setApiKey("");
      setConnected(true);
    } catch {
      setError("Could not save your WaveSpeed API key. Unlock your system keychain or Secret Service, then try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError("");
    try {
      await ClearWaveSpeedApiKey();
      setApiKey("");
      setConnected(false);
    } catch {
      setError("Could not remove your WaveSpeed API key. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span>WaveSpeed {connected ? "(API key saved)" : ""}</span>
        {connected && <Button variant="secondary" disabled={busy} onClick={disconnect}>Disconnect</Button>}
      </div>
      <p className="text-sm text-base-fg/60">
        Use your WaveSpeed credits for supported image and video models. Get an API key at{" "}
        <a href="https://wavespeed.ai/accesskey" target="_blank" rel="noreferrer" className="underline">wavespeed.ai</a>.
      </p>
      <div className="flex gap-2">
        <input
          aria-label="WaveSpeed API key"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={connected ? "Replace API key" : "Enter WaveSpeed API key"}
          disabled={busy}
          className="min-w-0 flex-1 rounded border border-ui-panel-border bg-transparent px-3 py-2 text-base-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        />
        <Button disabled={busy || !apiKey.trim()} onClick={save}>Save key</Button>
      </div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <WaveSpeedSubmissionRecovery />
    </div>
  );
}
