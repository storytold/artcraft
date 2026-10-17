import { describe, expect, it } from "vitest";
import { getMediaTypeFromFile, mediaSupportsAudio } from "./media-utils";

const file = (type: string) => ({ type }) as File;

describe("getMediaTypeFromFile", () => {
  it("infers the kind from the MIME prefix", () => {
    expect(getMediaTypeFromFile({ file: file("image/png") })).toBe("image");
    expect(getMediaTypeFromFile({ file: file("video/mp4") })).toBe("video");
    expect(getMediaTypeFromFile({ file: file("audio/mpeg") })).toBe("audio");
  });

  it("returns null for unknown or empty types", () => {
    expect(getMediaTypeFromFile({ file: file("application/pdf") })).toBeNull();
    expect(getMediaTypeFromFile({ file: file("") })).toBeNull();
  });
});

describe("mediaSupportsAudio", () => {
  it("is true for audio and video assets only", () => {
    expect(mediaSupportsAudio({ media: { type: "audio" } as never })).toBe(true);
    expect(mediaSupportsAudio({ media: { type: "video" } as never })).toBe(true);
    expect(mediaSupportsAudio({ media: { type: "image" } as never })).toBe(false);
  });

  it("is false when there is no media", () => {
    expect(mediaSupportsAudio({ media: null })).toBe(false);
    expect(mediaSupportsAudio({ media: undefined })).toBe(false);
  });
});
