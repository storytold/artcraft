import { describe, expect, it, vi } from "vitest";

// MediaTime is a branded number; use plain numbers and skip the wasm module.
vi.mock("../../wasm", () => ({
  addMediaTime: ({ a, b }: { a: number; b: number }) => a + b,
  roundFrameTime: ({ time }: { time: number }) => time,
}));

import {
  findBookmarkIndex,
  getBookmarkAtTime,
  getBookmarksActiveAtTime,
  isBookmarkAtTime,
  moveBookmarkInArray,
  removeBookmarkFromArray,
  toggleBookmarkInArray,
  updateBookmarkInArray,
} from "./utils";

// Times are plain numbers here; cast once to the branded type.
const t = (n: number) => n as never;
const bm = (time: number, extra: Record<string, unknown> = {}) => ({ time: t(time), ...extra }) as never;

describe("find / is / get", () => {
  const list = [bm(10), bm(20)];

  it("matches by exact time", () => {
    expect(findBookmarkIndex({ bookmarks: list, frameTime: t(20) })).toBe(1);
    expect(findBookmarkIndex({ bookmarks: list, frameTime: t(21) })).toBe(-1);
    expect(isBookmarkAtTime({ bookmarks: list, frameTime: t(10) })).toBe(true);
    expect(isBookmarkAtTime({ bookmarks: list, frameTime: t(11) })).toBe(false);
    expect(getBookmarkAtTime({ bookmarks: list, frameTime: t(10) })).toBe(list[0]);
    expect(getBookmarkAtTime({ bookmarks: list, frameTime: t(11) })).toBeNull();
  });
});

describe("toggleBookmarkInArray", () => {
  it("adds in sorted order without mutating the input", () => {
    const input = [bm(10), bm(30)];
    const out = toggleBookmarkInArray({ bookmarks: input, frameTime: t(20) });
    expect(out.map((b) => b.time)).toEqual([10, 20, 30]);
    expect(input).toHaveLength(2);
  });

  it("removes when one already exists at that time", () => {
    const out = toggleBookmarkInArray({ bookmarks: [bm(10), bm(20)], frameTime: t(10) });
    expect(out.map((b) => b.time)).toEqual([20]);
  });
});

describe("removeBookmarkFromArray", () => {
  it("removes only the matching time", () => {
    expect(removeBookmarkFromArray({ bookmarks: [bm(1), bm(2)], frameTime: t(2) }).map((b) => b.time)).toEqual([1]);
    expect(removeBookmarkFromArray({ bookmarks: [bm(1)], frameTime: t(9) })).toHaveLength(1);
  });
});

describe("updateBookmarkInArray", () => {
  it("merges fields into the matching bookmark and keeps the time", () => {
    const input = [bm(10, { note: "a" }), bm(20)];
    const out = updateBookmarkInArray({ bookmarks: input, frameTime: t(10), updates: { note: "b" } as never });
    expect(out[0]).toMatchObject({ time: 10, note: "b" });
    expect(input[0]).toMatchObject({ note: "a" });
  });

  it("returns the same array when nothing matches", () => {
    const input = [bm(10)];
    expect(updateBookmarkInArray({ bookmarks: input, frameTime: t(99), updates: {} })).toBe(input);
  });
});

describe("moveBookmarkInArray", () => {
  it("moves and re-sorts", () => {
    const out = moveBookmarkInArray({ bookmarks: [bm(10), bm(20)], fromTime: t(10), toTime: t(30) });
    expect(out.map((b) => b.time)).toEqual([20, 30]);
  });

  it("returns the same array when the source does not exist", () => {
    const input = [bm(10)];
    expect(moveBookmarkInArray({ bookmarks: input, fromTime: t(5), toTime: t(6) })).toBe(input);
  });

  it("does not create a duplicate when the target frame is already bookmarked", () => {
    const input = [bm(10), bm(20)];
    const out = moveBookmarkInArray({ bookmarks: input, fromTime: t(10), toTime: t(20) });
    expect(out).toBe(input);
    expect(out.map((b) => b.time)).toEqual([10, 20]);
  });

  it("allows moving a bookmark onto its own time", () => {
    const out = moveBookmarkInArray({ bookmarks: [bm(10)], fromTime: t(10), toTime: t(10) });
    expect(out.map((b) => b.time)).toEqual([10]);
  });
});

describe("getBookmarksActiveAtTime", () => {
  const list = [bm(10), bm(20, { duration: 5 }), bm(40, { duration: 0 })];

  it("treats a point bookmark as active only at its own time", () => {
    expect(getBookmarksActiveAtTime({ bookmarks: list, time: t(10) })).toHaveLength(1);
    expect(getBookmarksActiveAtTime({ bookmarks: list, time: t(11) })).toHaveLength(0);
    expect(getBookmarksActiveAtTime({ bookmarks: list, time: t(40) })).toHaveLength(1);
  });

  it("treats a ranged bookmark as active across [start, start + duration] inclusive", () => {
    expect(getBookmarksActiveAtTime({ bookmarks: list, time: t(20) })).toHaveLength(1);
    expect(getBookmarksActiveAtTime({ bookmarks: list, time: t(25) })).toHaveLength(1);
    expect(getBookmarksActiveAtTime({ bookmarks: list, time: t(26) })).toHaveLength(0);
  });
});
