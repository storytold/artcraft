import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FilterMediaClasses } from "@storyteller/api";
import { useGalleryData } from "./useGalleryData";

let root: Root;
let container: HTMLDivElement;
let current: ReturnType<typeof useGalleryData>;
let requests: Array<{ url: URL; resolve: (response: Response) => void }>;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  requests = [];
  vi.stubGlobal("fetch", vi.fn((url: string) => new Promise<Response>((resolve) => {
    requests.push({ url: new URL(url), resolve });
  })));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

it("keeps the current username's history when an older request finishes last", async () => {
  await render("old");
  await render("new");
  expect(requests.map(({ url }) => url.pathname)).toEqual([
    "/v1/media_files/list/user/old",
    "/v1/media_files/list/user/new",
  ]);
  await complete(1, "new-result");
  await complete(0, "old-result");
  expect(current.items.map((item) => item.id)).toEqual(["new-result"]);
});

it("keeps the current request loading when an older request finishes first", async () => {
  await render("old");
  await render("new");
  await complete(0, "old-result");
  expect(current.isLoading).toBe(true);
  expect(current.isInitialLoading).toBe(true);
  expect(current.items).toEqual([]);
  await complete(1, "new-result");
  expect(current.isLoading).toBe(false);
});

it("keeps an empty logged-out history when the previous request finishes", async () => {
  await render("old");
  await render(null);
  const loadingAfterLogout = current.isLoading;
  await complete(0, "old-result");
  expect(current.items).toEqual([]);
  expect(current.hasMore).toBe(false);
  expect(loadingAfterLogout).toBe(false);
});

it("keeps refreshed history when the pre-refresh response finishes last", async () => {
  await render("user");
  await act(async () => current.refresh());
  expect(requests).toHaveLength(2);
  await complete(1, "refreshed-result");
  await complete(0, "old-result");
  expect(current.items.map((item) => item.id)).toEqual(["refreshed-result"]);
});

it("still appends the next page and blocks duplicate concurrent load-more requests", async () => {
  await render("user");
  await complete(0, "first", 0, 2);
  await act(async () => { current.loadMore(); current.loadMore(); });
  expect(requests).toHaveLength(2);
  expect(requests[1].url.searchParams.get("page_index")).toBe("1");
  await complete(1, "second", 1, 2);
  expect(current.items.map((item) => item.id)).toEqual(["first", "second"]);
  expect(current.hasMore).toBe(false);
});

it("still finishes loading when the current API request fails", async () => {
  await render("user");
  await act(async () => requests[0].resolve(new Response("error", { status: 500 })));
  expect(current.isLoading).toBe(false);
  expect(current.isInitialLoading).toBe(false);
  expect(current.items).toEqual([]);
});

async function render(username: string | null) {
  // Reuse the component type so a username change exercises the hook's reset.
  await act(async () => root.render(<GalleryHarness username={username} />));
}

function GalleryHarness({ username }: { username: string | null }) {
  current = useGalleryData({ username, filterMediaClasses: [FilterMediaClasses.IMAGE] });
  return null;
}

async function complete(index: number, token: string, page = 0, total = 1) {
  await act(async () => requests[index].resolve(new Response(JSON.stringify({
    success: true,
    results: [{ token, media_class: "image", created_at: "2026-10-10T00:00:00Z", media_links: { cdn_url: `https://example.com/${token}.png` } }],
    pagination: { current: page, total_page_count: total },
  }), { status: 200, headers: { "Content-Type": "application/json" } })));
}
