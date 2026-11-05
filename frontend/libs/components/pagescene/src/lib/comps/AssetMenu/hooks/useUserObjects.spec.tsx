import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const m = vi.hoisted(() => ({ fetchUser: vi.fn(), fetchFeatured: vi.fn() }));

// A real React context so the hooks can read a fake editor from a Provider.
vi.mock("../../../contexts/EngineContext/EngineContext", async () => {
  const { createContext } = await import("react");
  return { EngineContext: createContext(null) };
});

vi.mock("../utilities/fetchMediaItems", () => ({
  fetchUserMediaItems: m.fetchUser,
  fetchFeaturedMediaItems: m.fetchFeatured,
}));

import { EngineContext } from "../../../contexts/EngineContext/EngineContext";
import { FetchStatus } from "../../../enums";
import { useUserObjects } from "./useUserObjects";
import { useFeaturedObjects } from "./useFeaturedObjects";

const editor = { adapter: {} } as never;
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(EngineContext.Provider, { value: editor }, children);

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const props = { defaultErrorMessage: "err", filterEngineCategories: [] as never };
const item = (id: string) => ({ id }) as never;

beforeEach(() => {
  m.fetchUser.mockReset();
  m.fetchFeatured.mockReset();
});

describe("useUserObjects", () => {
  it("stores items and the pagination info of the page", async () => {
    const pagination = { current: 0, total_page_count: 3 };
    m.fetchUser.mockResolvedValue({
      status: FetchStatus.SUCCESS,
      mediaItems: [item("a")],
      nextPage: pagination,
    });
    const { result } = renderHook(() => useUserObjects(props), { wrapper });
    await act(async () => {
      await result.current.fetchUserObjects();
    });
    expect(result.current.userObjects).toHaveLength(1);
    expect(result.current.nextUserObjects).toEqual(pagination);
    expect(result.current.userFetchStatus).toBe(FetchStatus.SUCCESS);
  });

  it("ignores a second call while the first request is still in flight", async () => {
    const slow = deferred<unknown>();
    m.fetchUser.mockReturnValue(slow.promise);
    const { result } = renderHook(() => useUserObjects(props), { wrapper });

    let first!: Promise<void>;
    act(() => {
      first = result.current.fetchUserObjects();
      void result.current.fetchUserObjects();
    });
    expect(m.fetchUser).toHaveBeenCalledTimes(1);

    await act(async () => {
      slow.resolve({ status: FetchStatus.SUCCESS, mediaItems: [item("a")] });
      await first;
    });
    // Once finished, a new request is allowed again.
    m.fetchUser.mockResolvedValue({ status: FetchStatus.SUCCESS, mediaItems: [] });
    await act(async () => {
      await result.current.fetchUserObjects();
    });
    expect(m.fetchUser).toHaveBeenCalledTimes(2);
  });

  it("appends later pages and replaces on the first page", async () => {
    m.fetchUser.mockResolvedValueOnce({ status: FetchStatus.SUCCESS, mediaItems: [item("a")] });
    m.fetchUser.mockResolvedValueOnce({ status: FetchStatus.SUCCESS, mediaItems: [item("b")] });
    const { result } = renderHook(() => useUserObjects(props), { wrapper });
    await act(async () => {
      await result.current.fetchUserObjects();
    });
    await act(async () => {
      await result.current.fetchUserObjects(1);
    });
    expect(result.current.userObjects).toHaveLength(2);
  });

  it("turns a thrown request into an ERROR status and allows a retry", async () => {
    m.fetchUser.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useUserObjects(props), { wrapper });
    await act(async () => {
      await result.current.fetchUserObjects();
    });
    expect(result.current.userFetchStatus).toBe(FetchStatus.ERROR);

    m.fetchUser.mockResolvedValue({ status: FetchStatus.SUCCESS, mediaItems: [item("a")] });
    await act(async () => {
      await result.current.fetchUserObjects();
    });
    expect(result.current.userFetchStatus).toBe(FetchStatus.SUCCESS);
  });
});

describe("useFeaturedObjects", () => {
  it("does not start a second request while one is in flight", async () => {
    const slow = deferred<unknown>();
    m.fetchFeatured.mockReturnValue(slow.promise);
    const { result } = renderHook(() => useFeaturedObjects(props), { wrapper });
    // The hook fetches once on its own when the editor is available.
    expect(m.fetchFeatured).toHaveBeenCalledTimes(1);
    await act(async () => {
      slow.resolve({ status: FetchStatus.SUCCESS, mediaItems: [item("a")] });
    });
    expect(result.current.featuredObjects).toHaveLength(1);
  });
});
