import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted so the vi.mock factory below can hand ProcessMediaAssets a fake
// video reader whose reported frame rate each test controls.
const { readVideoFileMock } = vi.hoisted(() => ({
  readVideoFileMock: vi.fn(),
}));

// Replace the real mediabunny reader (needs real codecs) with the fake.
vi.mock("./mediabunny", () => ({
  readVideoFile: readVideoFileMock,
}));

import { processMediaAssets } from "./processing";
import { floatToFrameRate } from "../fps/utils";

// Minimal stand-ins for the two host adapters processMediaAssets talks to.
function buildAdapters() {
  const toast = { error: vi.fn(), success: vi.fn(), info: vi.fn() };
  const mediaSource = {
    uploadLocalFile: vi.fn(async () => ({ id: "handle-1" })),
    resolveMedia: vi.fn(async () => ({ url: "blob:video" })),
  };
  return { toast, mediaSource };
}

// Runs one fake .mp4 through the processor with a given detected frame rate.
async function importVideoWithFps(fps: number) {
  readVideoFileMock.mockResolvedValue({
    duration: 10,
    width: 1920,
    height: 1080,
    fps,
    hasAudio: false,
    codec: "avc",
    canDecode: true,
    thumbnailUrl: null,
  });
  const { toast, mediaSource } = buildAdapters();
  const file = new File(["x"], "clip.mp4", { type: "video/mp4" });
  const [asset] = await processMediaAssets({
    files: [file],
    toast: toast as never,
    mediaSource: mediaSource as never,
  });
  return asset;
}

describe("processMediaAssets frame rate", () => {
  beforeEach(() => {
    readVideoFileMock.mockReset();
  });

  it("keeps a 29.97 fps video's fractional rate so it snaps to NTSC 30000/1001", async () => {
    const asset = await importVideoWithFps(29.97);

    // Old code rounded to 30 here, so the project became 30/1 and drifted
    // ~3.6 s per hour against the source footage.
    expect(floatToFrameRate(asset.fps as number)).toEqual({
      numerator: 30_000,
      denominator: 1_001,
    });
  });

  it("keeps a 23.976 fps video's fractional rate", async () => {
    const asset = await importVideoWithFps(23.976);

    expect(floatToFrameRate(asset.fps as number)).toEqual({
      numerator: 24_000,
      denominator: 1_001,
    });
  });

  it("still stores whole-number rates unchanged", async () => {
    const asset = await importVideoWithFps(25);

    expect(asset.fps).toBe(25);
  });

  it("leaves fps undefined when the detected rate is not finite", async () => {
    const asset = await importVideoWithFps(Number.NaN);

    expect(asset.fps).toBeUndefined();
  });
});
