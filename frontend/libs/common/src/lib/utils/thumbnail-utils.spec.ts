import { addCorsParam, getThumbnailUrl, getMediaThumbnail } from "./thumbnail-utils";

describe("CORS media URL query parameters", () => {
  it.each([
    ["https://cdn.example/audio.mp3?token=a%2Bb", "a+b"],
    ["/media/video.jpg?frame=1", null],
  ])("adds a separate cors parameter to %s", (input, token) => {
    const result = new URL(addCorsParam(input)!, "https://app.example");
    expect(result.searchParams.get("cors")).toBe("1");
    if (token !== null) expect(result.searchParams.get("token")).toBe(token);
    else expect(result.searchParams.get("frame")).toBe("1");
  });

  it("keeps fragments after the query, where they cannot swallow cors", () => {
    const result = new URL(addCorsParam("https://cdn.example/image.jpg#preview")!);
    expect(result.searchParams.get("cors")).toBe("1");
    expect(result.hash).toBe("#preview");
  });

  it("preserves signed query bytes and avoids duplicate enabled cors", () => {
    expect(addCorsParam("https://cdn.example/a?token=a%2Bb&cors=1#preview"))
      .toBe("https://cdn.example/a?token=a%2Bb&cors=1#preview");
  });

  it.each(["https://cdn.example/a?cors=0&token=a%2Bb", "https://cdn.example/a?token=a%2Bb&cors"])("enables an existing cors flag without changing other query bytes: %s", (url) => {
    expect(addCorsParam(url)).toBe(url.replace(/cors(?:=0)?/, "cors=1"));
  });

  it.each([
    ["https://cdn.example/image&cors=old.png#preview", "https://cdn.example/image&cors=old.png?cors=1#preview"],
    ["https://cdn.example/image&cors=old.png?frame=1#preview", "https://cdn.example/image&cors=old.png?frame=1&cors=1#preview"],
    ["https://cdn.example/image&cors=old.png?cors=0&token=a%2Bb#preview", "https://cdn.example/image&cors=old.png?cors=1&token=a%2Bb#preview"],
  ])("preserves ampersands in the path of %s", (url, expected) => {
    const result = addCorsParam(url)!;
    expect(result).toBe(expected);
    const parsed = new URL(result);
    expect(parsed.pathname).toBe(new URL(url).pathname);
    expect(parsed.searchParams.get("cors")).toBe("1");
  });

  it("constructs valid CORS URLs through thumbnail callers", () => {
    const template = "https://cdn.example/{WIDTH}.jpg?frame=1#preview";
    const thumbnail = getThumbnailUrl(template, { width: 512, addCors: true });
    const media = getMediaThumbnail({ maybe_video_previews: { animated: template } }, "video", { addCors: true });
    expect(new URL(thumbnail!).searchParams.get("cors")).toBe("1");
    expect(new URL(thumbnail!).pathname).toBe("/512.jpg");
    expect(new URL(media!).searchParams.get("cors")).toBe("1");
  });

  it("preserves ordinary URLs and empty input behavior", () => {
    expect(addCorsParam("https://cdn.example/a.jpg")).toBe("https://cdn.example/a.jpg?cors=1");
    expect(addCorsParam(null)).toBeNull();
    expect(addCorsParam(undefined)).toBeNull();
    expect(addCorsParam("")).toBeNull();
  });
});
