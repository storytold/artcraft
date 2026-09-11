import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

type SoraLoginSuccessPayload = {
  // TODO
};

export function useSoraLoginListener(
  onSuccess: (payload: SoraLoginSuccessPayload) => void
) {
  useEffect(() => {
    let unlisten: () => void;

    const setupListener = async () => {
      const stop = await listen<SoraLoginSuccessPayload>(
        "sora-login-success",
        (event) => {
          onSuccess(event.payload);
        }
      );
      unlisten = stop;
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [onSuccess]);
}
