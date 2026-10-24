import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

// Fake API: one mock per endpoint so tests can control each response.
const m = vi.hoisted(() => ({ mesh: vi.fn(), splat: vi.fn() }));

vi.mock("@storyteller/api", () => ({
  MediaFilesApi: class {
    ListSessionMeshMediaFiles = m.mesh;
    ListSessionSplatMediaFiles = m.splat;
  },
}));

import { useSessionMediaByClass } from "./useSessionMediaByClass";

// A promise we resolve by hand, to simulate a slow in-flight request.
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const page = (token: string) => ({
  success: true,
  data: [{ token, media_class: "mesh", created_at: "2026-01-01" }],
  pagination: { maybe_next: null },
});

beforeEach(() => {
  m.mesh.mockReset();
  m.splat.mockReset();
});

describe("useSessionMediaByClass", () => {
  it("loads the first page for the chosen class", async () => {
    m.mesh.mockResolvedValue(page("m1"));
    const { result } = renderHook(() =>
      useSessionMediaByClass({ mediaClass: "mesh", enabled: true }),
    );
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].id).toBe("m1");
    expect(m.splat).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("does not call the API when disabled and stops the spinner", async () => {
    const { result } = renderHook(() =>
      useSessionMediaByClass({ mediaClass: "mesh", enabled: false }),
    );
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(m.mesh).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasMore).toBe(false);
  });

  it("drops a mesh response that arrives after switching to splat", async () => {
    const slowMesh = deferred<ReturnType<typeof page>>();
    m.mesh.mockReturnValue(slowMesh.promise);
    m.splat.mockResolvedValue({
      success: true,
      data: [{ token: "s1", media_class: "splat", created_at: "2026-01-01" }],
      pagination: { maybe_next: null },
    });

    const { result, rerender } = renderHook(
      ({ c }: { c: "mesh" | "splat" }) =>
        useSessionMediaByClass({ mediaClass: c, enabled: true }),
      { initialProps: { c: "mesh" as "mesh" | "splat" } },
    );

    rerender({ c: "splat" });
    await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual(["s1"]));

    // The old mesh request finally finishes: it must not leak into the splat feed.
    await act(async () => {
      slowMesh.resolve(page("m-late"));
    });
    expect(result.current.items.map((i) => i.id)).toEqual(["s1"]);
  });

  it("drops the response of a request superseded by refresh()", async () => {
    const first = deferred<ReturnType<typeof page>>();
    m.mesh.mockReturnValueOnce(first.promise).mockResolvedValueOnce(page("fresh"));

    const { result } = renderHook(() =>
      useSessionMediaByClass({ mediaClass: "mesh", enabled: true }),
    );
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual(["fresh"]));

    await act(async () => {
      first.resolve(page("stale"));
    });
    expect(result.current.items.map((i) => i.id)).toEqual(["fresh"]);
  });

  it("removeItem removes by id", async () => {
    m.mesh.mockResolvedValue(page("m1"));
    const { result } = renderHook(() =>
      useSessionMediaByClass({ mediaClass: "mesh", enabled: true }),
    );
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    act(() => result.current.removeItem("m1"));
    expect(result.current.items).toHaveLength(0);
  });
});
