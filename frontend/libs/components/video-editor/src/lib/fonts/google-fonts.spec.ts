import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearFontAtlasCache, loadFullFont } from "./google-fonts";

// loadFullFont appends a Google Fonts <link> and waits for it to load. If the
// stylesheet request fails (the desktop app is offline, the CDN is unreachable)
// the font must NOT be remembered as loaded, or choosing that font again in the
// font picker does nothing for the rest of the session: the picker's own
// try/catch comment says a failure "falls back to the system default", but a
// swallowed failure that was cached as a success never gets a second chance.
//
// jsdom never fetches stylesheets (no load/error events) and has no
// `document.fonts`, so the spec fires the events and stubs the font set itself.

const fontsLoad = vi.fn();

function stylesheetLinks(): HTMLLinkElement[] {
  return Array.from(
    document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
  );
}

beforeEach(() => {
  clearFontAtlasCache();
  fontsLoad.mockReset();
  fontsLoad.mockResolvedValue([]);
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { load: fontsLoad },
  });
});

afterEach(() => {
  for (const link of stylesheetLinks()) link.remove();
});

describe("loadFullFont", () => {
  it("loads a font once and remembers it", async () => {
    const first = loadFullFont({ family: "Roboto" });
    const [link] = stylesheetLinks();
    expect(link.href).toContain("family=Roboto");
    link.dispatchEvent(new Event("load"));
    await first;

    expect(fontsLoad).toHaveBeenCalledTimes(2); // weights 400 and 700

    // Already loaded: no second stylesheet, no second font-set load.
    await loadFullFont({ family: "Roboto" });
    expect(stylesheetLinks()).toHaveLength(1);
    expect(fontsLoad).toHaveBeenCalledTimes(2);
  });

  it("tries again after the stylesheet failed to load", async () => {
    const first = loadFullFont({ family: "Lobster" });
    const [failedLink] = stylesheetLinks();
    failedLink.dispatchEvent(new Event("error")); // offline
    await first;

    // Back online: choosing the font again must request the stylesheet again.
    // (Old code remembered the failed load as a success, so it returned at
    // once, left the dead <link> in <head> and never asked a second time.)
    const second = loadFullFont({ family: "Lobster" });
    const links = stylesheetLinks();
    expect(links).toHaveLength(1);
    expect(links[0]).not.toBe(failedLink);

    links[0].dispatchEvent(new Event("load"));
    await second;

    // The retry succeeded, so now it is remembered.
    await loadFullFont({ family: "Lobster" });
    expect(stylesheetLinks()).toHaveLength(1);
  });
});
