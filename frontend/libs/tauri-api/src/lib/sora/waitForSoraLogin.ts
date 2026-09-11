import { listen } from "@tauri-apps/api/event";

export function waitForSoraLogin(): Promise<void> {
  return new Promise((resolve) => {
    let unlisten: () => void;
    listen("sora-login-success", () => {
      if (unlisten) unlisten();
      resolve();
    }).then((stop) => {
      unlisten = stop;
    });
  });
}
