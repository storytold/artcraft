import { describe, expect, it } from "vitest";
import type { GalleryItem } from "@storyteller/ui-generation-list";
import { galleryItemQuickActions } from "./galleryItemQuickActions";

const LOCAL_ID = "local_file_3f2a9c1e_4b7d_4e8a_9c2f_1a2b3c4d5e6f";
const LIBRARY_ID = "m_abc123";

describe("galleryItemQuickActions", () => {
  it("offers only download for an image kept on this computer", () => {
    expect(galleryItemQuickActions(item(LOCAL_ID, "image"), { promptToken: "prompt_1", enableMakeVideo: true })).toEqual({
      recreateMediaClass: null,
      makeVideo: false,
      share: false,
      download: true,
    });
  });

  it("offers every action for a library image", () => {
    expect(galleryItemQuickActions(item(LIBRARY_ID, "image"), { promptToken: "prompt_1", enableMakeVideo: true })).toEqual({
      recreateMediaClass: "image",
      makeVideo: true,
      share: true,
      download: true,
    });
  });

  it("keeps recreate off without a prompt and make-video off for videos and audio", () => {
    expect(galleryItemQuickActions(item(LIBRARY_ID, "video"), { enableMakeVideo: true })).toEqual({
      recreateMediaClass: null,
      makeVideo: false,
      share: true,
      download: true,
    });
    expect(galleryItemQuickActions(item(LIBRARY_ID, "audio"), { promptToken: "prompt_1", enableMakeVideo: true })).toEqual({
      recreateMediaClass: null,
      makeVideo: false,
      share: true,
      download: true,
    });
  });
});

function item(id: string, mediaClass: string): GalleryItem {
  return {
    id,
    label: "item",
    thumbnail: "https://example.com/t.png",
    fullImage: "https://example.com/f.png",
    createdAt: "2026-10-15T00:00:00Z",
    mediaClass,
  };
}
