import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, act } from "@testing-library/react";

// Shared handles so each test can script what the tags API and the session lookup answer.
const { listFileTags, listAllTags, setFileTags, getSession } = vi.hoisted(
  () => ({
    listFileTags: vi.fn(),
    listAllTags: vi.fn(),
    setFileTags: vi.fn(),
    getSession: vi.fn(),
  }),
);

// Stand-ins for the two API classes the section builds itself.
vi.mock("@storyteller/api", () => ({
  TagsApi: class {
    ListMediaFileTags = listFileTags;
    ListTags = listAllTags;
    SetMediaFileTags = setFileTags;
  },
  UsersApi: class {
    GetSession = getSession;
  },
}));

vi.mock("@storyteller/ui-toaster", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// The section remembers the session lookup in a module-level variable, so every test loads a fresh copy of the module:
// that is what "the app was just started" looks like. (react and the testing library are not reset, only the section's module.)
type SectionModule = typeof import("./TagsSection");
let TagsSection: SectionModule["TagsSection"];

// The section only reads `creator.username` to decide who owns the file.
const OWNER = { username: "owner" } as never;

// The one place the shipped app mounts the section is lightbox-modal.tsx (`<TagsSection mediaToken={mediaId} creator={creator} />`):
// no `currentUsername`, so the section resolves the session itself. Opening the lightbox again mounts a fresh section.
const lightbox = (mediaToken: string) => (
  <TagsSection mediaToken={mediaToken} creator={OWNER} />
);

// What the real `UsersApi.GetSession` hands back when the request fails (offline, server error, a reply that is not JSON):
// it never throws, it answers `success: false`.
const SESSION_FAILED = { success: false, errorMessage: "Failed to fetch" };
const SESSION_OWNER = {
  success: true,
  data: { loggedIn: true, user: { username: "owner" } },
};

describe("TagsSection session lookup (who is logged in, asked by the section itself)", () => {
  beforeEach(async () => {
    // mockReset (not just clear) so a queued mockResolvedValueOnce from one test can never leak into the next.
    listFileTags.mockReset();
    listAllTags.mockReset();
    setFileTags.mockReset();
    getSession.mockReset();
    listFileTags.mockResolvedValue({ success: true, data: [] });
    listAllTags.mockResolvedValue({ success: true, data: [] });
    vi.resetModules();
    ({ TagsSection } = await import("./TagsSection"));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // Opens the lightbox on the owner's file (a fresh section) and waits until it has asked for the session.
  const openLightbox = async (askedSoFar: number) => {
    const view = render(lightbox("m1"));
    await waitFor(() => expect(getSession).toHaveBeenCalledTimes(askedSoFar));
    // Let the answer and the file's tag lookup land.
    await act(async () => {});
    return view;
  };

  it("asks for the session again on the next lightbox visit after the first lookup failed", async () => {
    getSession.mockResolvedValueOnce(SESSION_FAILED);
    getSession.mockResolvedValue(SESSION_OWNER);

    // Visit 1: the lookup fails, so the owner is not recognised on this visit (the box stays read-only and, with no tags, hidden).
    const first = await openLightbox(1);
    expect(screen.queryByLabelText("Tags")).toBeNull();
    first.unmount();

    // Visit 2: the lightbox is opened again. Old behaviour: the failed answer was remembered as "nobody is logged in" for the
    // rest of the app run, so the section never asked again and the owner could not edit tags on their own file until a restart.
    render(lightbox("m1"));
    expect(await screen.findByLabelText("Tags")).toBeTruthy();
    expect(getSession).toHaveBeenCalledTimes(2);
  });

  // Controls: these pass on the old code and must keep passing.
  it("control: a lookup that throws is asked again on the next visit", async () => {
    getSession.mockRejectedValueOnce(new Error("offline"));
    getSession.mockResolvedValue(SESSION_OWNER);

    const first = await openLightbox(1);
    expect(screen.queryByLabelText("Tags")).toBeNull();
    first.unmount();

    render(lightbox("m1"));
    expect(await screen.findByLabelText("Tags")).toBeTruthy();
    expect(getSession).toHaveBeenCalledTimes(2);
  });

  it("control: a normal visit lets the owner edit, and the answer is remembered for the next visit", async () => {
    getSession.mockResolvedValue(SESSION_OWNER);

    const first = await openLightbox(1);
    expect(await screen.findByLabelText("Tags")).toBeTruthy();
    first.unmount();

    // Second visit is served from the remembered answer: still editable, no second request.
    render(lightbox("m1"));
    expect(await screen.findByLabelText("Tags")).toBeTruthy();
    expect(getSession).toHaveBeenCalledTimes(1);
  });

  it("control: a definite 'nobody is logged in' answer keeps the tags read-only and is remembered", async () => {
    getSession.mockResolvedValue({ success: true, data: { loggedIn: false } });
    listFileTags.mockResolvedValue({
      success: true,
      data: [
        {
          tag_token: "t_sunset",
          tag_value: "sunset",
          tag_value_lowercase: "sunset",
          use_count: 1,
        },
      ],
    });

    const first = await openLightbox(1);
    // Read-only: the chip shows, but there is no input to type in.
    expect(await screen.findByText("sunset")).toBeTruthy();
    expect(screen.queryByLabelText("Tags")).toBeNull();
    first.unmount();

    render(lightbox("m1"));
    expect(await screen.findByText("sunset")).toBeTruthy();
    expect(screen.queryByLabelText("Tags")).toBeNull();
    expect(getSession).toHaveBeenCalledTimes(1);
  });
});
