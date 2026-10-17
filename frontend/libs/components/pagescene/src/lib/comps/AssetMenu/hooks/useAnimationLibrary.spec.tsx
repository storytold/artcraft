import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const m = vi.hoisted(() => ({ fetchUser: vi.fn(), fetchFeatured: vi.fn() }));

vi.mock("../../../contexts/EngineContext/EngineContext", async () => {
  const { createContext } = await import("react");
  return { EngineContext: createContext(null) };
});
vi.mock("../utilities/fetchMediaItems", () => ({
  fetchUserMediaItems: m.fetchUser,
  fetchFeaturedMediaItems: m.fetchFeatured,
}));
vi.mock("../../../signals/demoAssets", () => ({
  demoAnimationItems: [{ media_id: "demo" }],
}));

import { EngineContext } from "../../../contexts/EngineContext/EngineContext";
import { FetchStatus } from "../../../enums";
import { useAnimationLibrary } from "./useAnimationLibrary";

const editor = { adapter: {} };
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(EngineContext.Provider, { value: editor as never }, children);

const media = (id: string) => ({ media_id: id }) as never;

// The animation store is module-level (shared for the whole session), so these
// tests run in order and build on each other: fail, retry, then load more.
describe("useAnimationLibrary", () => {
  it("a thrown request ends as ERROR (not stuck IN_PROGRESS) and the demo clips are the fallback", async () => {
    m.fetchFeatured.mockRejectedValue(new Error("boom"));
    m.fetchUser.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useAnimationLibrary(), { wrapper });
    await act(async () => {
      result.current.fetchUserAnimations();
    });
    expect(result.current.fetchStatuses).toEqual([FetchStatus.ERROR, FetchStatus.ERROR]);
    expect(result.current.defaultAnimations.map((a) => a.media_id)).toEqual(["demo"]);
  });

  it("retries after the failure; the user's clips lead, then the featured set", async () => {
    m.fetchFeatured.mockResolvedValue({ status: FetchStatus.SUCCESS, mediaItems: [media("f1")] });
    m.fetchUser.mockResolvedValue({
      status: FetchStatus.SUCCESS,
      mediaItems: [media("u1")],
      nextPage: { current: 0, total_page_count: 2 },
    });
    const { result } = renderHook(() => useAnimationLibrary(), { wrapper });
    await act(async () => {
      result.current.fetchUserAnimations();
    });
    expect(result.current.fetchStatuses).toEqual([FetchStatus.SUCCESS, FetchStatus.SUCCESS]);
    expect(result.current.allAnimations.map((a) => a.media_id)).toEqual(["u1", "f1"]);
    expect(result.current.hasMoreUserAnimations).toBe(true);
  });

  it("loads the next page and drops duplicates by media id", async () => {
    m.fetchUser.mockResolvedValue({
      status: FetchStatus.SUCCESS,
      mediaItems: [media("u1"), media("u2")],
      nextPage: { current: 1, total_page_count: 2 },
    });
    const { result } = renderHook(() => useAnimationLibrary(), { wrapper });
    await act(async () => {
      result.current.loadMoreUserAnimations();
    });
    expect(m.fetchUser).toHaveBeenLastCalledWith(
      expect.objectContaining({ nextPageIndex: 1 }),
      editor.adapter,
    );
    expect(result.current.userAnimations.map((a) => a.media_id)).toEqual(["u1", "u2"]);
    expect(result.current.hasMoreUserAnimations).toBe(false);
  });
});
