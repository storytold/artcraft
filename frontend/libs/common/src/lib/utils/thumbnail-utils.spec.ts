import { describe, expect, it } from "vitest";
import {
  THUMBNAIL_SIZES,
  addCorsParam,
  getContextImageThumbnail,
  getMediaStillThumbnail,
  getMediaThumbnail,
  getPlaceholderForMediaClass,
  getThumbnailUrl,
  is3DModelUrl,
} from "./thumbnail-utils";

describe("getThumbnailUrl", () => {
  const tpl = "https://cdn/x_{WIDTH}.webp";

  it("returns null for an empty template", () => {
    expect(getThumbnailUrl(null)).toBeNull();
    expect(getThumbnailUrl(undefined)).toBeNull();
    expect(getThumbnailUrl("")).toBeNull();
  });

  it("fills {WIDTH} with the medium size by default", () => {
    expect(getThumbnailUrl(tpl)).toBe("https://cdn/x_250.webp");
  });

  it("accepts a custom width and optional cors flag", () => {
    expect(getThumbnailUrl(tpl, { width: 512 })).toBe("https://cdn/x_512.webp");
    expect(getThumbnailUrl(tpl, { width: 128, addCors: true })).toBe("https://cdn/x_128.webp?cors=1");
  });
});

describe("addCorsParam", () => {
  it("returns null for empty input", () => {
    expect(addCorsParam(null)).toBeNull();
    expect(addCorsParam("")).toBeNull();
  });

  it("starts a query string when there is none", () => {
    expect(addCorsParam("https://cdn/a.png")).toBe("https://cdn/a.png?cors=1");
  });

  it("appends with & when a query string already exists", () => {
    expect(addCorsParam("https://cdn/a.png?v=2")).toBe("https://cdn/a.png?v=2&cors=1");
  });
});

describe("getMediaThumbnail", () => {
  const links = {
    maybe_thumbnail_template: "https://cdn/t_{WIDTH}.webp",
    cdn_url: "https://cdn/full.png",
    maybe_video_previews: { animated: "https://cdn/anim.gif" },
  };

  it("returns null without links", () => {
    expect(getMediaThumbnail(null, "image")).toBeNull();
  });

  it("never returns an image URL for audio", () => {
    expect(getMediaThumbnail(links, "audio")).toBeNull();
  });

  it("prefers the animated preview for video", () => {
    expect(getMediaThumbnail(links, "video")).toBe("https://cdn/anim.gif");
  });

  it("uses the sized template for images, then the CDN url", () => {
    expect(getMediaThumbnail(links, "image", { size: THUMBNAIL_SIZES.LARGE })).toBe("https://cdn/t_512.webp");
    expect(getMediaThumbnail({ cdn_url: "https://cdn/full.png" }, "image")).toBe("https://cdn/full.png");
    expect(getMediaThumbnail({}, "image")).toBeNull();
  });

  it("adds the cors param when asked", () => {
    expect(getMediaThumbnail(links, "image", { addCors: true })).toBe("https://cdn/t_250.webp?cors=1");
  });
});

describe("getMediaStillThumbnail", () => {
  it("prefers the still template, then the still, then the regular template", () => {
    expect(
      getMediaStillThumbnail({
        maybe_video_previews: { still_thumbnail_template: "s_{WIDTH}", still: "still.jpg" },
        maybe_thumbnail_template: "t_{WIDTH}",
      }),
    ).toBe("s_250");
    expect(
      getMediaStillThumbnail({ maybe_video_previews: { still: "still.jpg" }, maybe_thumbnail_template: "t_{WIDTH}" }),
    ).toBe("still.jpg");
    expect(getMediaStillThumbnail({ maybe_thumbnail_template: "t_{WIDTH}" }, { size: 128 })).toBe("t_128");
    expect(getMediaStillThumbnail({})).toBeNull();
    expect(getMediaStillThumbnail(undefined)).toBeNull();
  });
});

describe("getContextImageThumbnail", () => {
  it("sizes small and extra-large from the template", () => {
    const out = getContextImageThumbnail({
      media_links: { maybe_thumbnail_template: "t_{WIDTH}", cdn_url: "full" },
    });
    expect(out).toEqual({ thumbnail: "t_128", fullSize: "t_1024" });
  });

  it("falls back to the CDN url without a template", () => {
    const out = getContextImageThumbnail({ media_links: { cdn_url: "full" } });
    expect(out).toEqual({ thumbnail: "full", fullSize: "full" });
  });

  it("uses the video still when there is no template", () => {
    const out = getContextImageThumbnail({
      media_links: {
        cdn_url: "video.mp4",
        maybe_video_previews: { still: "still.jpg", still_thumbnail_template: "s_{WIDTH}" },
      },
    });
    expect(out).toEqual({ thumbnail: "s_128", fullSize: "s_1024" });
  });
});

describe("getPlaceholderForMediaClass", () => {
  it("returns a placeholder for every class", () => {
    expect(getPlaceholderForMediaClass("video")).toContain("artcraft-logo-load");
    expect(getPlaceholderForMediaClass()).toContain("artcraft-logo-load");
  });
});

describe("is3DModelUrl", () => {
  it("recognises 3D asset extensions, case-insensitively", () => {
    expect(is3DModelUrl("https://cdn/a.glb")).toBe(true);
    expect(is3DModelUrl("https://cdn/A.GLTF")).toBe(true);
    expect(is3DModelUrl("https://cdn/a.spz")).toBe(true);
  });

  it("ignores a query string or fragment after the extension", () => {
    expect(is3DModelUrl("https://cdn/a.glb?token=1")).toBe(true);
    expect(is3DModelUrl("https://cdn/a.ply#x")).toBe(true);
  });

  it("rejects cover images and empty values", () => {
    expect(is3DModelUrl("https://cdn/cover.png")).toBe(false);
    expect(is3DModelUrl("https://cdn/scene.object.png")).toBe(false);
    expect(is3DModelUrl("https://cdn/a.png?file=x.glb")).toBe(false);
    expect(is3DModelUrl(null)).toBe(false);
    expect(is3DModelUrl("")).toBe(false);
  });
});
