import { IsDesktopApp } from "@storyteller/tauri-utils";

export type ThemeUpdate =
  | { status: "ready"; palette: unknown }
  | {
      status: "error";
      reason: "missing" | "invalid" | "tooLarge" | "unreadable" | "watchError";
    };

interface ThemeEvent {
  subscriptionId: string;
  update: ThemeUpdate;
}

// Serialize lifecycle commands; stale cleanup is additionally guarded by its ID
// in Rust, so a late StrictMode cleanup cannot tear down a newer subscription.
let commands: Promise<unknown> = Promise.resolve();
const enqueue = <T>(command: () => Promise<T>): Promise<T> => {
  const next = commands.then(command);
  commands = next.catch(() => undefined);
  return next;
};

export const isDesktop = IsDesktopApp;

export async function watchDesktopTheme(
  onChange: (update: ThemeUpdate) => void,
): Promise<() => void> {
  if (!IsDesktopApp()) return () => undefined;
  return enqueue(async () => {
    const [{ invoke }, { listen }] = await Promise.all([
      import("@tauri-apps/api/core"),
      import("@tauri-apps/api/event"),
    ]);
    const subscriptionId = crypto.randomUUID();
    let active = true;
    // Subscribe before starting so the initial snapshot cannot race the listener.
    const unlisten = await listen<ThemeEvent>(
      "artcraft-custom-theme",
      ({ payload }) => {
        if (active && payload.subscriptionId === subscriptionId)
          onChange(payload.update);
      },
    );
    const releaseListener = () => {
      // Tauri types this as void, but its implementation returns an IPC promise.
      void Promise.resolve(unlisten()).catch(() => undefined);
    };
    try {
      await invoke("watch_custom_theme_command", { subscriptionId });
    } catch (error) {
      active = false;
      releaseListener();
      throw error;
    }
    return () => {
      if (!active) return;
      active = false;
      releaseListener();
      void enqueue(() =>
        invoke("unwatch_custom_theme_command", { subscriptionId }),
      ).catch(() => undefined);
    };
  });
}
