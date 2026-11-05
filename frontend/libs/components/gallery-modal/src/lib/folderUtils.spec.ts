import { describe, expect, it } from "vitest";
import { compareFolders, FOLDER_COLOR_PRESETS, resolveFolderThumb } from "./folderUtils";

describe("compareFolders", () => {
  it("puts starred folders first", () => {
    const folders = [{ name: "Alpha" }, { name: "Zed", hasStar: true }];
    expect([...folders].sort(compareFolders).map((f) => f.name)).toEqual(["Zed", "Alpha"]);
  });

  it("sorts alphabetically within a group, ignoring case", () => {
    const folders = [{ name: "banana" }, { name: "Apple" }, { name: "cherry" }];
    expect([...folders].sort(compareFolders).map((f) => f.name)).toEqual([
      "Apple",
      "banana",
      "cherry",
    ]);
  });

  it("treats a missing hasStar the same as false", () => {
    expect(compareFolders({ name: "a" }, { name: "a", hasStar: false })).toBe(0);
  });
});

describe("FOLDER_COLOR_PRESETS", () => {
  it("is a list of unique 6-digit hex colors", () => {
    expect(FOLDER_COLOR_PRESETS.length).toBeGreaterThan(0);
    for (const color of FOLDER_COLOR_PRESETS) expect(color).toMatch(/^#[0-9a-f]{6}$/);
    expect(new Set(FOLDER_COLOR_PRESETS).size).toBe(FOLDER_COLOR_PRESETS.length);
  });
});

describe("resolveFolderThumb", () => {
  it("returns null when there is no thumbnail", () => {
    expect(resolveFolderThumb(null, 100)).toBeNull();
    expect(resolveFolderThumb(undefined, 100)).toBeNull();
  });

  it("falls back to the raw cdn url for images without a resize template", () => {
    expect(
      resolveFolderThumb({ cdn_url: "https://cdn.example/a.png", media_class: "image" }, 100),
    ).toBe("https://cdn.example/a.png");
  });

  it("never returns a video file url, which cannot render inside an <img>", () => {
    expect(
      resolveFolderThumb({ cdn_url: "https://cdn.example/a.mp4", media_class: "video" }, 100),
    ).toBeNull();
  });
});
