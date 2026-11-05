import { describe, expect, it, vi } from "vitest";

// MediaTime is a branded number; use plain numbers and skip the wasm module.
vi.mock("../wasm", () => ({ ZERO_MEDIA_TIME: 0 }));
vi.mock("./creation", () => ({ DEFAULT_NEW_ELEMENT_DURATION: 5 }));
vi.mock("../effects", () => ({
  buildDefaultEffectInstance: ({ effectType }: { effectType: string }) => ({
    type: effectType,
    params: { intensity: 1 },
  }),
}));
vi.mock("../graphics", () => ({
  buildDefaultGraphicInstance: ({ definitionId }: { definitionId: string }) => ({
    definitionId,
    params: { color: "red", size: 2 },
  }),
}));
vi.mock("../params/registry", () => ({
  getBuiltInElementParams: ({ type }: { type: string }) => type,
  buildDefaultParamValues: (type: string) => ({ base: type, size: 1 }),
}));

import {
  buildElementFromMedia,
  buildEffectElement,
  buildGraphicElement,
  buildLibraryAudioElement,
  buildStickerElement,
  buildTextElement,
  canElementHaveAudio,
  getElementFontFamilies,
  getElementsAtTime,
  hasElementEffects,
  hasMediaId,
  requiresMediaId,
} from "./element-utils";

const t = (n: number) => n as never;
const el = (type: string, extra: Record<string, unknown> = {}) => ({ type, ...extra }) as never;

describe("type guards", () => {
  it("only audio and video can have audio", () => {
    expect(canElementHaveAudio(el("audio"))).toBe(true);
    expect(canElementHaveAudio(el("video"))).toBe(true);
    expect(canElementHaveAudio(el("image"))).toBe(false);
  });

  it("hasMediaId checks for the property, not its value type", () => {
    expect(hasMediaId(el("video", { mediaId: "m" }))).toBe(true);
    expect(hasMediaId(el("text"))).toBe(false);
  });

  it("requiresMediaId is true for video, image and uploaded audio only", () => {
    expect(requiresMediaId({ element: el("video") })).toBe(true);
    expect(requiresMediaId({ element: el("image") })).toBe(true);
    expect(requiresMediaId({ element: el("audio", { sourceType: "upload" }) })).toBe(true);
    expect(requiresMediaId({ element: el("audio", { sourceType: "library" }) })).toBe(false);
    expect(requiresMediaId({ element: el("text") })).toBe(false);
  });

  it("hasElementEffects needs a visual element with a non-empty effects list", () => {
    expect(hasElementEffects({ element: el("video", { effects: [{}] }) })).toBe(true);
    expect(hasElementEffects({ element: el("video", { effects: [] }) })).toBe(false);
    expect(hasElementEffects({ element: el("video") })).toBe(false);
    expect(hasElementEffects({ element: el("audio", { effects: [{}] }) })).toBe(false);
  });
});

describe("builders", () => {
  it("buildTextElement applies defaults and lets raw values win", () => {
    const out = buildTextElement({ raw: { params: { size: 9 } as never }, startTime: t(3) }) as never as Record<string, unknown>;
    expect(out).toMatchObject({ type: "text", duration: 5, startTime: 3, trimStart: 0, trimEnd: 0 });
    expect(out.params).toEqual({ base: "text", size: 9 });
  });

  it("buildTextElement honours a given name and duration", () => {
    const out = buildTextElement({ raw: { name: "Hi", duration: t(2) }, startTime: t(0) });
    expect(out).toMatchObject({ name: "Hi", duration: 2 });
  });

  it("buildEffectElement names the element after the capitalized effect type", () => {
    const out = buildEffectElement({ effectType: "blur", startTime: t(1) });
    expect(out).toMatchObject({ type: "effect", name: "Blur", effectType: "blur", duration: 5, params: { intensity: 1 } });
    expect(buildEffectElement({ effectType: "blur", startTime: t(1), duration: t(7) }).duration).toBe(7);
  });

  it("buildStickerElement derives its name from the id", () => {
    expect(buildStickerElement({ stickerId: "pack:big-star", startTime: t(0) }).name).toBe("big star");
    expect(buildStickerElement({ stickerId: "plain", startTime: t(0) }).name).toBe("plain");
    expect(buildStickerElement({ stickerId: "pack:x", name: "Mine", startTime: t(0) }).name).toBe("Mine");
  });

  it("buildGraphicElement merges overrides but ignores undefined ones", () => {
    const out = buildGraphicElement({
      definitionId: "circle",
      startTime: t(0),
      params: { size: 10, color: undefined } as never,
    });
    expect(out.name).toBe("Circle");
    expect(out.params).toEqual({ base: "graphic", size: 10, color: "red" });
  });

  it("buildElementFromMedia picks the right element type", () => {
    const base = { mediaId: "m", name: "n", duration: t(4), startTime: t(1) };
    expect(buildElementFromMedia({ ...base, mediaType: "video" })).toMatchObject({ type: "video", sourceDuration: 4, isSourceAudioEnabled: true });
    expect(buildElementFromMedia({ ...base, mediaType: "image" })).toMatchObject({ type: "image", hidden: false });
    expect(buildElementFromMedia({ ...base, mediaType: "audio" })).toMatchObject({ type: "audio", sourceType: "upload", mediaId: "m" });
  });

  it("only attaches an audio buffer when one is given", () => {
    const buffer = {} as AudioBuffer;
    const base = { sourceUrl: "u", name: "n", duration: t(1), startTime: t(0) };
    expect("buffer" in buildLibraryAudioElement(base)).toBe(false);
    expect(buildLibraryAudioElement({ ...base, buffer }).buffer).toBe(buffer);
  });
});

describe("getElementsAtTime", () => {
  const tracks = {
    overlay: [{ id: "o", elements: [{ id: "e1", startTime: 0, duration: 10 }] }],
    main: { id: "m", elements: [{ id: "e2", startTime: 10, duration: 10 }] },
    audio: [{ id: "a", elements: [{ id: "e3", startTime: 5, duration: 10 }] }],
  } as never;

  it("returns elements in overlay, main, audio order", () => {
    expect(getElementsAtTime({ tracks, time: 7 })).toEqual([
      { trackId: "o", elementId: "e1" },
      { trackId: "a", elementId: "e3" },
    ]);
  });

  it("excludes both exact boundaries", () => {
    expect(getElementsAtTime({ tracks, time: 10 }).map((r) => r.elementId)).toEqual(["e3"]);
    expect(getElementsAtTime({ tracks, time: 0 })).toEqual([]);
  });
});

describe("getElementFontFamilies", () => {
  it("collects unique fonts from text elements and text masks", () => {
    const tracks = {
      overlay: [
        {
          id: "o",
          elements: [
            { type: "text", params: { fontFamily: "Inter" } },
            { type: "text", params: { fontFamily: "Inter" } },
            { type: "text", params: {} },
            { type: "video", masks: [{ type: "text", params: { fontFamily: "Lora" } }, { type: "box", params: {} }] },
          ],
        },
      ],
      main: { id: "m", elements: [] },
      audio: [],
    } as never;
    expect(getElementFontFamilies({ tracks }).sort()).toEqual(["Inter", "Lora"]);
  });
});
