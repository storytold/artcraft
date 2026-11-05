import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMergedGalleryEntries } from "./useGalleryEntries";

// Minimal stand-ins; only the fields the merge reads are filled in.
const job = (id: string, createdAt: string) => ({ id, createdAt }) as never;
const item = (id: string, createdAt: string) => ({ id, createdAt }) as never;

const base = {
  inProgressJobs: [],
  failedJobs: [],
  newlyCompletedItems: [],
  galleryItems: [],
  newlyCompletedTokens: new Set<string>(),
};

describe("useMergedGalleryEntries", () => {
  it("returns an empty feed for empty input", () => {
    const { result } = renderHook(() => useMergedGalleryEntries(base));
    expect(result.current).toEqual([]);
  });

  it("merges all four streams newest first with the right kinds and keys", () => {
    const { result } = renderHook(() =>
      useMergedGalleryEntries({
        ...base,
        inProgressJobs: [job("p", "2026-01-04T00:00:00Z")],
        failedJobs: [job("f", "2026-01-02T00:00:00Z")],
        newlyCompletedItems: [item("n", "2026-01-03T00:00:00Z")],
        galleryItems: [item("g", "2026-01-01T00:00:00Z")],
      }),
    );
    expect(result.current.map((e) => [e.kind, e.key])).toEqual([
      ["pending", "p"],
      ["gallery", "new-n"],
      ["failed", "f"],
      ["gallery", "g"],
    ]);
  });

  it("hides a gallery item that is also shown as newly completed", () => {
    const { result } = renderHook(() =>
      useMergedGalleryEntries({
        ...base,
        newlyCompletedItems: [item("x", "2026-01-02T00:00:00Z")],
        galleryItems: [item("x", "2026-01-02T00:00:00Z"), item("y", "2026-01-01T00:00:00Z")],
        newlyCompletedTokens: new Set(["x"]),
      }),
    );
    expect(result.current.map((e) => e.key)).toEqual(["new-x", "y"]);
  });
});
