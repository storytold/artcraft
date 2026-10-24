import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

type SoraLoginSuccessPayload = {
  // TODO
};

export function useSoraLoginListener(
  onSuccess: (payload: SoraLoginSuccessPayload) => void
) {
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    // FIX: cleanup can run before listen() resolves; without this flag the
    // late-resolving listener was never removed and leaked on every re-render.
    let cancelled = false;

    const setupListener = async () => {
      const stop = await listen<SoraLoginSuccessPayload>(
        "sora-login-success",
        (event) => {
          onSuccess(event.payload);
        }
      );
      if (cancelled) {
        stop();
      } else {
        unlisten = stop;
      }
    };

    setupListener();

    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, [onSuccess]);
}
