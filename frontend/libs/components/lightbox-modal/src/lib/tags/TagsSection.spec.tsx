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
const SOMEONE_ELSE = { username: "someone_else" } as never;

describe("TagsSection when the file's tags cannot be loaded", () => {
  beforeEach(() => {
    // mockReset (not just clear) so a queued mockResolvedValueOnce from one test can never leak into the next.
    listFileTags.mockReset();
    listAllTags.mockReset();
    setFileTags.mockReset();
    listAllTags.mockResolvedValue({ success: true, data: [] });
    setFileTags.mockImplementation(
      async ({ tags }: { tags: string[] }) => ({
        success: true,
        data: { tags: tags.map(tag) },
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mount = async (creator: never = OWNER, mediaToken = "m1") => {
    const view = render(
      <TagsSection
        mediaToken={mediaToken}
        creator={creator}
        currentUsername="owner"
      />,
    );
    await act(async () => {});
    return view;
  };

  const typeTag = async (value: string) => {
    const input = screen.getByLabelText("Tags");
    fireEvent.change(input, { target: { value } });
    fireEvent.keyDown(input, { key: "Enter" });
    await act(async () => {});
  };

  it("does not show an editable, empty tag box to the owner after a failed lookup", async () => {
    listFileTags.mockResolvedValue({ success: false, errorMessage: "offline" });
    await mount();
    // An empty box would say "this file has no tags", which we do not know.
    expect(screen.queryByLabelText("Tags")).toBeNull();
  });

  it("never saves a tag set built on a failed lookup (it would wipe the file's real tags)", async () => {
    listFileTags.mockResolvedValue({ success: false, errorMessage: "offline" });
    await mount();
    // Old behaviour: the box is there, so typing "new" saves ["new"] and the
    // server replaces whatever tags the file really has with just that one.
    const input = screen.queryByLabelText("Tags");
    if (input) {
      fireEvent.change(input, { target: { value: "new" } });
      fireEvent.keyDown(input, { key: "Enter" });
      await act(async () => {});
    }
    expect(setFileTags).not.toHaveBeenCalled();
  });

  it("asks again for the tags when the lightbox moves to another file", async () => {
    listFileTags
      .mockResolvedValueOnce({ success: false, errorMessage: "offline" })
      .mockResolvedValueOnce({ success: true, data: [tag("sunset")] });
    const view = await mount(OWNER, "m1");
    expect(screen.queryByLabelText("Tags")).toBeNull();
    view.rerender(
      <TagsSection mediaToken="m2" creator={OWNER} currentUsername="owner" />,
    );
    await act(async () => {});
    expect(screen.getByText("sunset")).toBeTruthy();
    expect(screen.getByLabelText("Tags")).toBeTruthy();
  });

  it("still shows nothing to a visitor after a failed lookup", async () => {
    listFileTags.mockResolvedValue({ success: false, errorMessage: "offline" });
    await mount(SOMEONE_ELSE);
    expect(screen.queryByText("Tags")).toBeNull();
    expect(screen.queryByLabelText("Tags")).toBeNull();
  });

  // Controls: these pass on the old code and must keep passing.
  it("control: adding a tag keeps the tags the file already has", async () => {
    listFileTags.mockResolvedValue({
      success: true,
      data: [tag("sunset"), tag("beach")],
    });
    await mount();
    await typeTag("new");
    await waitFor(() => expect(setFileTags).toHaveBeenCalledTimes(1));
    expect(setFileTags).toHaveBeenCalledWith({
      mediaFileToken: "m1",
      tags: ["sunset", "beach", "new"],
    });
  });

  it("control: a file that truly has no tags still lets the owner add the first one", async () => {
    listFileTags.mockResolvedValue({ success: true, data: [] });
    await mount();
    await typeTag("first");
    await waitFor(() => expect(setFileTags).toHaveBeenCalledTimes(1));
    expect(setFileTags).toHaveBeenCalledWith({
      mediaFileToken: "m1",
      tags: ["first"],
    });
  });
});
