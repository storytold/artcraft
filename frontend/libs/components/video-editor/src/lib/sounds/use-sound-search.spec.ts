import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => ({ search: vi.fn() }));

// The store file pulls in the editor core, wasm and timeline builders; none of
// them matter for search, so stub them.
vi.mock("../core", () => ({
  EditorCore: {
    getInstance: () => ({ adapters: { soundsAdapter: { searchSounds: m.search } } }),
  },
}));
vi.mock("../timeline/element-utils", () => ({ buildLibraryAudioElement: vi.fn() }));
vi.mock("../wasm", () => ({ mediaTimeFromSeconds: vi.fn() }));

import { useSoundsStore } from "./sounds-store";
import { useSoundSearch } from "./use-sound-search";

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const sound = (id: number) => ({ id, name: `s${id}` }) as never;
const page = (ids: number[], hasNextPage: boolean) => ({
  results: ids.map(sound),
  hasNextPage,
  totalCount: 10,
});

beforeEach(() => {
  m.search.mockReset();
  useSoundsStore.setState({
    searchResults: [],
    topSoundEffects: [],
    lastSearchQuery: "",
    currentPage: 1,
    hasNextPage: false,
    totalCount: 0,
    isLoadingMore: false,
    isSearching: false,
    searchError: null,
  });
});

describe("useSoundSearch", () => {
  it("does not search for an empty query", async () => {
    const { result } = renderHook(() => useSoundSearch({ query: "  ", commercialOnly: true }));
    await act(async () => {});
    expect(m.search).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
  });

  it("searches after the debounce and stores the first page", async () => {
    m.search.mockResolvedValue(page([1, 2], true));
    const { result } = renderHook(() => useSoundSearch({ query: "cat", commercialOnly: true }));
    await waitFor(() => expect(result.current.results).toHaveLength(2));
    expect(m.search).toHaveBeenCalledWith({ query: "cat", page: 1, commercialOnly: true });
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.totalCount).toBe(10);
  });

  it("surfaces a failed search as an error", async () => {
    m.search.mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useSoundSearch({ query: "cat", commercialOnly: true }));
    await waitFor(() => expect(result.current.error).toBe("down"));
    expect(result.current.isLoading).toBe(false);
  });

  it("appends the next page for the same query", async () => {
    m.search.mockResolvedValueOnce(page([1], true));
    const { result } = renderHook(() => useSoundSearch({ query: "cat", commercialOnly: true }));
    await waitFor(() => expect(result.current.results).toHaveLength(1));

    m.search.mockResolvedValueOnce(page([2], false));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.results).toHaveLength(2);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("drops a load-more page that finishes after the query changed", async () => {
    m.search.mockResolvedValueOnce(page([1], true));
    const { result, rerender } = renderHook(
      ({ q }: { q: string }) => useSoundSearch({ query: q, commercialOnly: true }),
      { initialProps: { q: "cat" } },
    );
    await waitFor(() => expect(result.current.results).toHaveLength(1));

    const slow = deferred<ReturnType<typeof page>>();
    m.search.mockReturnValueOnce(slow.promise);
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.loadMore();
    });

    m.search.mockResolvedValueOnce(page([100], false));
    rerender({ q: "dog" });
    await waitFor(() =>
      expect(useSoundsStore.getState().searchResults.map((s) => s.id)).toEqual([100]),
    );

    await act(async () => {
      slow.resolve(page([999], false)); // late page of the "cat" search
      await pending;
    });
    expect(useSoundsStore.getState().searchResults.map((s) => s.id)).toEqual([100]);
  });
});
