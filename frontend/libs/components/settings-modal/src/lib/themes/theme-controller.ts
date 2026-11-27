import { paletteProperties, validatePalette } from "./palette";
import type { ThemeUpdate } from "./desktop-theme";

export type AppTheme =
  | "gray"
  | "light"
  | "black"
  | "aurora"
  | "sunset"
  | "custom";
export const THEME_STORAGE_KEY = "st-theme";
const THEMES: AppTheme[] = [
  "gray",
  "light",
  "black",
  "aurora",
  "sunset",
  "custom",
];

export interface ThemeSnapshot {
  theme: AppTheme;
  message: string;
}

interface ThemeEnvironment {
  root: HTMLElement;
  storage: Pick<Storage, "getItem" | "setItem">;
  isDesktop: () => boolean;
  watch: (onChange: (update: ThemeUpdate) => void) => Promise<() => void>;
}

export class ThemeController {
  private snapshot: ThemeSnapshot;
  private listeners = new Set<() => void>();
  private owners = 0;
  private generation = 0;
  private stopWatching?: () => void;
  private overrides: Record<string, string> = {};
  private previousInline = new Map<string, [string, string]>();

  constructor(private readonly env: ThemeEnvironment) {
    let stored = "gray";
    try {
      stored = env.storage.getItem(THEME_STORAGE_KEY)?.trim() || "gray";
    } catch {
      /* storage can be disabled */
    }
    if (stored === "gradient") stored = "aurora";
    const theme = THEMES.find((theme) => theme === stored) ?? "gray";
    this.snapshot = { theme, message: "" };
  }

  getSnapshot = (): ThemeSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  start = (): (() => void) => {
    if (this.owners++ === 0) this.apply();
    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      if (--this.owners === 0) {
        this.cancelWatch();
        this.clearOverrides();
      }
    };
  };

  select = (theme: AppTheme): void => {
    if (theme === this.snapshot.theme) return;
    this.snapshot = { theme, message: "" };
    try {
      this.env.storage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* keep the selection usable */
    }
    this.apply();
  };

  private apply(): void {
    this.cancelWatch();
    this.clearOverrides();
    const { root, isDesktop, watch } = this.env;
    for (const name of Array.from(root.classList)) {
      if (name.startsWith("theme-")) root.classList.remove(name);
    }
    const { theme } = this.snapshot;
    // Custom starts with the existing default palette until a full valid file arrives.
    root.classList.add(`theme-${theme === "custom" ? "gray" : theme}`);
    this.setMessage("");
    this.notify();
    if (theme !== "custom") return;
    if (!isDesktop()) {
      this.setMessage(
        "Custom themes are available in the desktop app. Using Default.",
      );
      return;
    }
    if (this.owners === 0) return;
    this.setMessage("Loading theme.json…");
    const generation = this.generation;
    void watch((update) => {
      if (this.generation !== generation) return;
      if (update.status === "ready") {
        const palette = validatePalette(update.palette);
        if (palette) {
          this.applyOverrides(paletteProperties(palette));
          this.setMessage(
            "Custom theme loaded. Changes to theme.json apply automatically.",
          );
          return;
        }
      }
      const reason = update.status === "error" ? update.reason : "invalid";
      const messages = {
        missing:
          "theme.json was not found. Create it to load your custom colors.",
        invalid:
          "theme.json must contain all nine palette fields as #RRGGBB colors.",
        tooLarge: "theme.json exceeds the 16 KiB size limit.",
        unreadable:
          "Cannot read theme.json. Check that it is a readable regular file.",
        watchError:
          "Cannot monitor theme.json. Select another theme, then Custom to retry.",
      };
      const fallback = Object.keys(this.overrides).length
        ? " Keeping the last valid palette."
        : " Using Default.";
      this.setMessage(messages[reason] + fallback);
    })
      .then((stop) => {
        if (this.generation !== generation) stop();
        else this.stopWatching = stop;
      })
      .catch(() => {
        if (this.generation === generation) {
          this.setMessage(
            "Cannot load or monitor theme.json. Check configuration directory permissions, then select another theme and Custom to retry. Using Default.",
          );
        }
      });
  }

  private cancelWatch(): void {
    this.generation++;
    this.stopWatching?.();
    this.stopWatching = undefined;
  }

  private setMessage(message: string): void {
    // Always publish a changed selection, but never rerender for identical updates.
    if (this.snapshot.message === message) return;
    this.snapshot = { ...this.snapshot, message };
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  private applyOverrides(properties: Record<string, string>): void {
    const { root } = this.env;
    for (const [key, value] of Object.entries(properties)) {
      if (this.overrides[key] === value) continue;
      if (!this.previousInline.has(key)) {
        this.previousInline.set(key, [
          root.style.getPropertyValue(key),
          root.style.getPropertyPriority(key),
        ]);
      }
      root.style.setProperty(key, value);
    }
    this.overrides = properties;
    if (!root.classList.contains("theme-custom"))
      root.classList.add("theme-custom");
    root.classList.toggle(
      "theme-custom-light",
      properties["--st-color-scheme"] === "light",
    );
  }

  private clearOverrides(): void {
    for (const [key, [value, priority]] of this.previousInline) {
      if (value) this.env.root.style.setProperty(key, value, priority);
      else this.env.root.style.removeProperty(key);
    }
    this.previousInline.clear();
    this.overrides = {};
    this.env.root.classList.remove("theme-custom", "theme-custom-light");
  }
}
