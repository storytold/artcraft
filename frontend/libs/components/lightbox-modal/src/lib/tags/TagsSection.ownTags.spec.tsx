import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

// Shared handles so each test can script what the tags API answers.
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

import { TagsSection } from "./TagsSection";

const tag = (value: string) => ({
  tag_token: `t_${value}`,
  tag_value: value,
  tag_value_lowercase: value.toLowerCase(),
  use_count: 1,
});

// The section only reads `creator.username` to decide who owns the file.
const OWNER = { username: "owner" } as never;

// The one place the shipped app mounts the section is lightbox-modal.tsx (`<TagsSection mediaToken={mediaId} creator={creator} />`):
// no `currentUsername` and no `suggestions`, so the section resolves the session and fetches the user's tags itself.
// When the lightbox moves to another file it sets `creator` to null at once and fills it in again when the file's record arrives.
const lightbox = (mediaToken: string, creator: never | null) => (
  <TagsSection mediaToken={mediaToken} creator={creator as never} />
);

describe("TagsSection autocomplete list (the user's own tags, fetched by the section)", () => {
  beforeEach(() => {
    // mockReset (not just clear) so a queued mockResolvedValueOnce from one test can never leak into the next.
    listFileTags.mockReset();
    listAllTags.mockReset();
    setFileTags.mockReset();
    getSession.mockReset();
    getSession.mockResolvedValue({
      success: true,
      data: { loggedIn: true, user: { username: "owner" } },
    });
    listFileTags.mockResolvedValue({ success: true, data: [] });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // Types a few letters into the tag box and reports whether the suggestion dropdown offers "sunset".
  const suggestionShown = async () => {
    const input = await screen.findByLabelText("Tags");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "sun" } });
    await act(async () => {});
    return screen.queryByText("sunset") !== null;
  };

  // Mounts the section on the owner's file and waits until it has asked for the user's tags.
  const openOnOwnFile = async () => {
    const view = render(lightbox("m1", OWNER));
    await waitFor(() => expect(listAllTags).toHaveBeenCalledTimes(1));
    return view;
  };

  it("loads the list again when the first load was cut off by moving to another file", async () => {
    // First request hangs until the test releases it, like a slow network.
    let releaseFirst: (value: unknown) => void = () => {};
    listAllTags.mockReturnValueOnce(
      new Promise((resolve) => {
        releaseFirst = resolve;
      }),
    );
    listAllTags.mockResolvedValue({ success: true, data: [tag("sunset")] });

    const view = await openOnOwnFile();
    // The user presses Next: the lightbox clears the creator at once.
    view.rerender(lightbox("m2", null));
    await act(async () => {});
    // The slow first answer lands after the section stopped caring about it.
    await act(async () => {
      releaseFirst({ success: true, data: [tag("sunset")] });
    });
    // The next file's record arrives and it is the user's own file too.
    view.rerender(lightbox("m2", OWNER));
    await act(async () => {});

    // Old behaviour: the section marked the list "loaded" before it arrived, so this second owner file never asks again.
    await waitFor(() => expect(listAllTags).toHaveBeenCalledTimes(2));
    expect(await suggestionShown()).toBe(true);
  });

  it("loads the list again after a failed lookup, the next time the lightbox shows an own file", async () => {
    listAllTags.mockResolvedValueOnce({ success: false, errorMessage: "offline" });
    listAllTags.mockResolvedValue({ success: true, data: [tag("sunset")] });

    const view = await openOnOwnFile();
    await act(async () => {});
    // Next file: creator cleared, then filled in again.
    view.rerender(lightbox("m2", null));
    await act(async () => {});
    view.rerender(lightbox("m2", OWNER));
    await act(async () => {});

    // Old behaviour: the failed lookup was remembered as "loaded", so autocomplete stayed empty until the lightbox was closed.
    await waitFor(() => expect(listAllTags).toHaveBeenCalledTimes(2));
    expect(await suggestionShown()).toBe(true);
  });

  // Controls: these pass on the old code and must keep passing.
  it("control: a normal open offers the user's tags as suggestions", async () => {
    listAllTags.mockResolvedValue({ success: true, data: [tag("sunset")] });
    await openOnOwnFile();
    await act(async () => {});
    expect(await suggestionShown()).toBe(true);
  });

  it("control: a finished load is not repeated when the lightbox moves on to another own file", async () => {
    listAllTags.mockResolvedValue({ success: true, data: [tag("sunset")] });
    const view = await openOnOwnFile();
    await act(async () => {});
    view.rerender(lightbox("m2", null));
    await act(async () => {});
    view.rerender(lightbox("m2", OWNER));
    await act(async () => {});
    expect(listAllTags).toHaveBeenCalledTimes(1);
    expect(await suggestionShown()).toBe(true);
  });
});
