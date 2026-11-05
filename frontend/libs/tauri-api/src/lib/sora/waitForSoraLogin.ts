import { listen } from "@tauri-apps/api/event";

export function waitForSoraLogin(): Promise<void> {
  return new Promise((resolve) => {
    let unlisten: (() => void) | undefined;
    // FIX: the event can fire before listen()'s promise hands us `unlisten`;
    // remember that and unsubscribe as soon as it arrives instead of leaking.
    let done = false;
    listen("sora-login-success", () => {
      done = true;
      if (unlisten) unlisten();
      resolve();
    }).then((stop) => {
      if (done) {
        stop();
      } else {
        unlisten = stop;
      }
    });
  });
}
