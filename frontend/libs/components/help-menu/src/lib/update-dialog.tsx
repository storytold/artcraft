import { useEffect, useRef, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { CheckForUpdates, InstallUpdate, OpenUrl, type UpdateInfo } from "@storyteller/tauri-api";
import { Button } from "@storyteller/ui-button";
import { Modal } from "@storyteller/ui-modal";

const RELEASES = "https://github.com/storytold/artcraft/releases";

export function UpdateDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const pendingCheck = useRef<Promise<UpdateInfo> | null>(null);
  const desktop = isTauri();

  const check = async () => {
    setChecking(true);
    setError(null);
    setInfo(null);
    try {
      // StrictMode or a repeated click must share one native background check.
      const pending = pendingCheck.current ?? CheckForUpdates();
      pendingCheck.current = pending;
      setInfo(await pending);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      pendingCheck.current = null;
      setChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen && desktop) void check();
    // A check is manual: reopening this dialog is the only automatic trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, desktop]);

  const install = async () => {
    if (!info?.can_install || installing) return;
    setInstalling(true);
    setError(null);
    try {
      await InstallUpdate();
      // Success closes the application through its normal native exit path.
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setInstalling(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!installing) onClose(); }}
      title="Check for Updates"
      accessibleTitle="Check for Updates"
      className="max-w-lg"
      showClose={!installing}
      closeOnEsc={!installing}
      closeOnOutsideClick={!installing}
    >
      <div className="flex flex-col gap-4 text-base-fg">
        <p>ArtCraft{info ? ` ${info.current_version}` : ""}</p>
        <div role="status" aria-live="polite">
          {!desktop ? "The web app updates when you reload. Open Releases to get the desktop app."
            : installing ? "Downloading and verifying the update… ArtCraft will restart when it is ready."
              : checking ? "Checking for updates…"
                : info?.maybe_available_version ? `${info.maybe_available_version} is available.`
                  : info ? "You're up to date." : null}
        </div>
        {error && <p role="alert">{error}</p>}
        {info?.maybe_available_version && (
          <p className="text-sm text-base-fg/70">
            {info.tasks_running ? "Finish or cancel running tasks, then check again before updating."
              : info.can_install ? "Save your work before updating. ArtCraft will close and restart."
                : "Use Releases or your package manager to update this installation."}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="action" disabled={installing} onClick={() => OpenUrl(info?.releases_url ?? RELEASES)}>Releases</Button>
          {desktop && <Button variant="action" disabled={checking || installing} onClick={() => void check()}>Check again</Button>}
          {info?.maybe_available_version && <Button variant="primary" disabled={!info.can_install || checking || installing} onClick={() => void install()}>Update and restart</Button>}
          {!installing && <Button variant="action" onClick={onClose}>Cancel</Button>}
        </div>
      </div>
    </Modal>
  );
}
