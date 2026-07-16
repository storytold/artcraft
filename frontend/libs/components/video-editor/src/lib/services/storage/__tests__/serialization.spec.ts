import { describe, expect, test } from "vitest";

import { buildDefaultScene } from "../../../timeline/scenes";
import type { MediaAsset } from "../../../media/types";
import type { TProject } from "../../../project/types";
import type { AudioTrack } from "../../../timeline/types";
import { ZERO_MEDIA_TIME } from "../../../wasm";
import {
  deserializeProjectDocument,
  mediaAssetToData,
  serializeProjectDocument,
} from "../serialization";

const CREATED_AT = new Date("2026-07-01T10:00:00.000Z");
const UPDATED_AT = new Date("2026-07-02T12:30:00.000Z");

describe("project document serialization", () => {
  test("JSON round-trip preserves dates and media manifest", () => {
    const project = buildSampleProject();
    const media = [
      {
        id: "m_asset1",
        name: "clip.mp4",
        type: "video" as const,
        size: 1234,
        lastModified: 111,
        width: 1920,
        height: 1080,
        duration: 4.2,
        fps: 30,
        hasAudio: true,
      },
    ];

    const wire = JSON.parse(
      JSON.stringify(serializeProjectDocument({ project, media })),
    );
    const restored = deserializeProjectDocument(wire);

    expect(restored).not.toBeNull();
    expect(restored?.project.metadata.id).toBe(project.metadata.id);
    expect(restored?.project.metadata.createdAt).toEqual(CREATED_AT);
    expect(restored?.project.metadata.updatedAt).toEqual(UPDATED_AT);
    expect(restored?.project.scenes[0].createdAt).toBeInstanceOf(Date);
    expect(restored?.project.currentSceneId).toBe(project.currentSceneId);
    expect(restored?.media).toEqual(media);
  });

  test("accepts legacy raw TProject envelopes", () => {
    const project = buildSampleProject();

    const restored = deserializeProjectDocument(project);

    expect(restored).not.toBeNull();
    expect(restored?.project.metadata.name).toBe(project.metadata.name);
    expect(restored?.project.metadata.createdAt).toEqual(CREATED_AT);
    expect(restored?.media).toEqual([]);
  });

  test("rejects unrecognized payloads", () => {
    expect(deserializeProjectDocument(null)).toBeNull();
    expect(deserializeProjectDocument("nope")).toBeNull();
    expect(deserializeProjectDocument({ something: "else" })).toBeNull();
  });

  test("strips decoded AudioBuffers from audio elements", () => {
    const project = buildSampleProject();
    const audioTrack: AudioTrack = {
      id: "track-audio",
      name: "Audio",
      type: "audio",
      muted: false,
      elements: [
        {
          id: "elem-audio",
          type: "audio",
          sourceType: "upload",
          mediaId: "m_audio1",
          name: "voice.mp3",
          startTime: ZERO_MEDIA_TIME,
          duration: ZERO_MEDIA_TIME,
          trimStart: ZERO_MEDIA_TIME,
          trimEnd: ZERO_MEDIA_TIME,
          params: {},
          buffer: { fake: "audio-buffer" } as never,
        },
      ],
    };
    project.scenes[0].tracks.audio = [audioTrack];

    const document = serializeProjectDocument({ project, media: [] });

    const serialized = document.project.scenes[0].tracks.audio[0].elements[0];
    expect("buffer" in serialized).toBe(false);
  });

  test("mediaAssetToData pulls size from the File and drops thumbnails", () => {
    const file = new File(["abc"], "pic.png", {
      type: "image/png",
      lastModified: 42,
    });
    const asset: MediaAsset = {
      id: "m_img1",
      name: "pic.png",
      type: "image",
      file,
      url: "blob:runtime",
      thumbnailUrl: "data:image/png;base64,xyz",
      width: 640,
      height: 480,
    };

    const data = mediaAssetToData(asset);

    expect(data.size).toBe(3);
    expect(data.lastModified).toBe(42);
    expect(data.thumbnailUrl).toBeUndefined();
    expect(data).not.toHaveProperty("file");
    expect(data).not.toHaveProperty("url");
  });
});

function buildSampleProject(): TProject {
  const scene = buildDefaultScene({ name: "Main scene", isMain: true });
  return {
    metadata: {
      id: "proj-1",
      name: "Round trip",
      duration: ZERO_MEDIA_TIME,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    },
    scenes: [scene],
    currentSceneId: scene.id,
    settings: {
      fps: { numerator: 30, denominator: 1 } as never,
      canvasSize: { width: 1920, height: 1080 },
      background: { type: "color", color: "#000000" },
    },
    version: 1,
  };
}
