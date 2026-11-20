import { beforeEach, expect, it, vi } from "vitest";
import {
  ThemeController,
  THEME_STORAGE_KEY,
  type AppTheme,
} from "../../../../../libs/components/settings-modal/src/lib/themes/theme-controller";
import {
  PALETTE_FIELDS,
  paletteProperties,
  validatePalette,
  type Palette,
} from "../../../../../libs/components/settings-modal/src/lib/themes/palette";
import type { ThemeUpdate } from "../../../../../libs/components/settings-modal/src/lib/themes/desktop-theme";
import { readFileSync } from "node:fs";
const baseCss = readFileSync(__dirname + "/../styles/base.css", "utf8");

const PALETTE: Palette = {
  background: "#112233",
  surface: "#223344",
  border: "#334455",
  text: "#eeeeee",
  textDim: "#aabbcc",
  accent: "#00ff00",
  accentText: "#000000",
  danger: "#ff0000",
  warning: "#ffaa00",
};
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

beforeEach(() => {
  document.documentElement.className = "unrelated";
  document.documentElement.removeAttribute("style");
  localStorage.clear();
});

it("restores Custom at startup and applies a live palette without another selection", async () => {
  localStorage.setItem(THEME_STORAGE_KEY, "custom");
  const { controller, watch, emit } = setup();
  const stop = controller.start();
  expect(watch).toHaveBeenCalledTimes(1);
  expect(controller.getSnapshot().theme).toBe("custom");
  emit({ status: "ready", palette: PALETTE });
  expect(document.documentElement.style.getPropertyValue("--st-bg")).toBe(
    PALETTE.background,
  );
  emit({ status: "ready", palette: { ...PALETTE, background: "#abcdef" } });
  expect(document.documentElement.style.getPropertyValue("--st-bg")).toBe(
    "#abcdef",
  );
  await flush();
  stop();
});

it("persists selection and restores it in a new controller", async () => {
  const first = setup();
  const stop = first.controller.start();
  first.controller.select("custom");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("custom");
  expect(setup().controller.getSnapshot().theme).toBe("custom");
  await flush();
  stop();
});

it.each(["gray", "light", "black", "aurora", "sunset"] as AppTheme[])(
  "clears every custom override when switching to %s",
  async (theme) => {
    const { controller, emit, unwatch } = setup();
    const stop = controller.start();
    controller.select("custom");
    emit({ status: "ready", palette: PALETTE });
    await flush();
    controller.select(theme);
    expect(unwatch).toHaveBeenCalledTimes(1);
    expect(document.documentElement.className).toBe(`unrelated theme-${theme}`);
    expect(document.documentElement.style.length).toBe(0);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(theme);
    emit({ status: "ready", palette: PALETTE });
    expect(document.documentElement.style.length).toBe(0);
    stop();
  },
);

it.each([
  [" light ", "light"],
  ["gray", "gray"],
  ["black", "black"],
  ["aurora", "aurora"],
  ["sunset", "sunset"],
  ["gradient", "aurora"],
  ["invalid", "gray"],
  ["", "gray"],
])(
  "restores saved %j as %s without watching local files",
  (saved, expected) => {
    localStorage.setItem(THEME_STORAGE_KEY, saved);
    const { controller, watch } = setup();
    const stop = controller.start();
    expect(controller.getSnapshot().theme).toBe(expected);
    expect(
      document.documentElement.classList.contains(`theme-${expected}`),
    ).toBe(true);
    expect(watch).not.toHaveBeenCalled();
    stop();
  },
);

it("uses Default in a browser without invoking desktop IPC", () => {
  localStorage.setItem(THEME_STORAGE_KEY, "custom");
  const { controller, watch } = setup(false);
  const stop = controller.start();
  expect(watch).not.toHaveBeenCalled();
  expect(document.documentElement.classList.contains("theme-gray")).toBe(true);
  expect(controller.getSnapshot().message).toContain("desktop app");
  stop();
});

it.each([
  "missing",
  "invalid",
  "tooLarge",
  "unreadable",
  "watchError",
] as const)(
  "falls back safely for %s, retaining the last valid palette after a bad save",
  async (reason) => {
    const { controller, emit } = setup();
    const stop = controller.start();
    controller.select("custom");
    emit({ status: "error", reason });
    expect(controller.getSnapshot().message).toContain("Using Default");
    expect(document.documentElement.style.length).toBe(0);
    emit({ status: "ready", palette: PALETTE });
    emit({ status: "error", reason });
    expect(controller.getSnapshot().message).toContain(
      "Keeping the last valid palette",
    );
    expect(document.documentElement.style.getPropertyValue("--st-bg")).toBe(
      PALETTE.background,
    );
    emit({ status: "ready", palette: { ...PALETTE, background: "#abcdef" } });
    expect(controller.getSnapshot().message).toContain("Custom theme loaded");
    await flush();
    stop();
  },
);

it("rejects invalid IPC palettes atomically", async () => {
  const { controller, emit } = setup();
  const stop = controller.start();
  controller.select("custom");
  emit({
    status: "ready",
    palette: { ...PALETTE, text: "#123456; background:url(evil)" },
  });
  expect(document.documentElement.style.length).toBe(0);
  expect(controller.getSnapshot().message).toContain("#RRGGBB");
  await flush();
  stop();
});

it("handles a failed subscription without an unhandled rejection", async () => {
  const controller = new ThemeController({
    root: document.documentElement,
    storage: localStorage,
    isDesktop: () => true,
    watch: vi.fn().mockRejectedValue(new Error("IPC unavailable")),
  });
  const stop = controller.start();
  controller.select("custom");
  await flush();
  expect(controller.getSnapshot().message).toContain("Cannot load or monitor");
  stop();
});

it("cleans up delayed subscriptions, ignores stale callbacks, and supports StrictMode remount", async () => {
  localStorage.setItem(THEME_STORAGE_KEY, "custom");
  const resolvers: ((stop: () => void) => void)[] = [];
  const callbacks: ((update: ThemeUpdate) => void)[] = [];
  const watch = vi.fn((callback: (update: ThemeUpdate) => void) => {
    callbacks.push(callback);
    return new Promise<() => void>((resolve) => resolvers.push(resolve));
  });
  const controller = new ThemeController({
    root: document.documentElement,
    storage: localStorage,
    isDesktop: () => true,
    watch,
  });
  const stopFirst = controller.start();
  stopFirst();
  const stopSecond = controller.start();
  const firstUnwatch = vi.fn(),
    secondUnwatch = vi.fn();
  resolvers[0](firstUnwatch);
  resolvers[1](secondUnwatch);
  await flush();
  expect(firstUnwatch).toHaveBeenCalledTimes(1);
  callbacks[0]({ status: "ready", palette: PALETTE });
  expect(document.documentElement.style.length).toBe(0);
  callbacks[1]({ status: "ready", palette: PALETTE });
  expect(document.documentElement.style.getPropertyValue("--st-bg")).toBe(
    PALETTE.background,
  );
  stopFirst();
  expect(secondUnwatch).not.toHaveBeenCalled();
  stopSecond();
  expect(secondUnwatch).toHaveBeenCalledTimes(1);
  expect(document.documentElement.style.length).toBe(0);
});

it("shares one watcher across owners and does not restart on repeated selections", async () => {
  const { controller, watch, unwatch } = setup();
  const first = controller.start(),
    second = controller.start();
  controller.select("custom");
  controller.select("custom");
  expect(watch).toHaveBeenCalledTimes(1);
  await flush();
  first();
  expect(unwatch).not.toHaveBeenCalled();
  second();
  expect(unwatch).toHaveBeenCalledTimes(1);
});

it("does not rewrite CSS or notify subscribers for equivalent updates", async () => {
  const { controller, emit } = setup();
  const stop = controller.start();
  controller.select("custom");
  emit({ status: "ready", palette: PALETTE });
  const listener = vi.fn();
  controller.subscribe(listener);
  const setProperty = vi.spyOn(document.documentElement.style, "setProperty");
  emit({ status: "ready", palette: { ...PALETTE, textDim: "#AABBCC" } });
  expect(setProperty).not.toHaveBeenCalled();
  expect(listener).not.toHaveBeenCalled();
  setProperty.mockRestore();
  await flush();
  stop();
});

it("restores preexisting inline values and priorities during cleanup", async () => {
  document.documentElement.style.setProperty("--st-bg", "#010203", "important");
  document.documentElement.style.setProperty("--unrelated", "preserved");
  const { controller, emit } = setup();
  const stop = controller.start();
  controller.select("custom");
  emit({ status: "ready", palette: PALETTE });
  controller.select("light");
  expect(document.documentElement.style.getPropertyValue("--st-bg")).toBe(
    "#010203",
  );
  expect(document.documentElement.style.getPropertyPriority("--st-bg")).toBe(
    "important",
  );
  expect(document.documentElement.style.getPropertyValue("--unrelated")).toBe(
    "preserved",
  );
  await flush();
  stop();
});

it("keeps selection usable when browser storage is disabled", () => {
  const storage = {
    getItem: () => {
      throw new Error("disabled");
    },
    setItem: () => {
      throw new Error("disabled");
    },
  };
  const controller = new ThemeController({
    root: document.documentElement,
    storage,
    isDesktop: () => false,
    watch: vi.fn(),
  });
  const stop = controller.start();
  expect(controller.getSnapshot().theme).toBe("gray");
  controller.select("light");
  expect(document.documentElement.classList.contains("theme-light")).toBe(true);
  stop();
});

it("maps exact RGB and HSL values consistently, including achromatic colors", () => {
  const properties = paletteProperties(PALETTE);
  expect(properties["--st-controls-rgb"]).toBe("34 51 68");
  expect(properties["--st-fg-rgb"]).toBe("238 238 238");
  expect(properties["--st-accent-rgb"]).toBe("0 255 0");
  expect(properties["--primary"]).toBe("120.000 100.000% 50.000%");
  expect(properties["--primary-foreground"]).toBe("0.000 0.000% 0.000%");
  expect(properties["--foreground"]).toBe("0.000 0.000% 93.333%");
  expect(properties["--destructive"]).toBe("0.000 100.000% 50.000%");
  expect(properties["--warning"]).toBe("40.000 100.000% 50.000%");
  expect(properties["--muted-foreground"]).toBe("210.000 25.000% 73.333%");
  expect(properties["--st-color-scheme"]).toBe("dark");
  expect(
    paletteProperties({ ...PALETTE, background: "#ffffff" })[
      "--st-color-scheme"
    ],
  ).toBe("light");
});

it("ignores unknown properties but rejects missing fields, arrays and unsafe colors", () => {
  expect(validatePalette({ ...PALETTE, unknown: "url(evil)" })).toEqual(
    PALETTE,
  );
  for (const field of PALETTE_FIELDS) {
    const partial = { ...PALETTE };
    delete (partial as Partial<Palette>)[field];
    expect(validatePalette(partial)).toBeUndefined();
    for (const color of [
      "#abc",
      "#12345678",
      "#12345g",
      "#123456\n",
      "red",
      "#123456; color:red",
      null,
      42,
    ]) {
      expect(validatePalette({ ...PALETTE, [field]: color })).toBeUndefined();
    }
  }
  expect(validatePalette([])).toBeUndefined();
  expect(validatePalette(null)).toBeUndefined();
});

it("keeps each of the five built-in palette declarations unchanged", () => {
  const blocks = baseCss.match(
    /:root \{\n {2}--st-bg:[\s\S]*?\n\}|\.theme-(?:light|gray|black|aurora|sunset)[^{]*\{\n {2}--st-bg:[\s\S]*?\n\}/g,
  );
  expect(blocks).toHaveLength(6);
  // Keep values readable in the snapshot so changes can be reviewed as colors.
  const names = ["root", "light", "gray", "black", "aurora", "sunset"];
  const palettes = blocks?.map((block, index) => [
    names[index],
    Object.fromEntries(
      Array.from(block.matchAll(/(--[\w-]+):\s*([^;]+);/g))
        .filter(
          ([, key]) => !key.startsWith("--ease-") && !key.startsWith("--dur-"),
        )
        .map(([, key, value]) => [key, value.replace(/\s+/g, " ").trim()]),
    ),
  ]);
  expect(Object.fromEntries(palettes ?? [])).toMatchSnapshot();
});

function setup(desktop = true) {
  let callback: (update: ThemeUpdate) => void = () => undefined;
  const unwatch = vi.fn();
  const watch = vi.fn(async (onChange: (update: ThemeUpdate) => void) => {
    callback = onChange;
    return unwatch;
  });
  const controller = new ThemeController({
    root: document.documentElement,
    storage: localStorage,
    isDesktop: () => desktop,
    watch,
  });
  return {
    controller,
    watch,
    unwatch,
    emit: (update: ThemeUpdate) => callback(update),
  };
}
