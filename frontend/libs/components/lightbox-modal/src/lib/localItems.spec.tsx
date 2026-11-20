import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MediaFilesApi, TagsApi } from "@storyteller/api";
import { invoke } from "@tauri-apps/api/core";
import { actionReminderProps } from "@storyteller/ui-action-reminder-modal";
import { LightboxModal } from "./lightbox-modal";

const LOCAL_ID = "local_file_3f2a9c1e_4b7d_4e8a_9c2f_1a2b3c4d5e6f";
const LIBRARY_ID = "m_abc123";
const LIBRARY_ACTIONS = ["Edit Image", "Make Video", "Remove BG", "Make 3D", "Make 3D World", "Add to Scene", "Share"];

// jsdom has no matchMedia, which Embla needs; the carousel isn't under test.
vi.mock("embla-carousel-react", () => ({ default: () => [vi.fn(), undefined] }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@storyteller/google-analytics", () => ({ gtagEvent: vi.fn() }));

it("offers only download and delete for an image kept on this computer", () => {
  const tags = vi.spyOn(TagsApi.prototype, "ListMediaFileTags").mockResolvedValue({ success: true, data: [] });
  renderLightbox(LOCAL_ID);
  expect(screen.getByRole("button", { name: /Download/ })).toBeTruthy();
  expect(screen.getByRole("button", { name: /Delete/ })).toBeTruthy();
  for (const action of LIBRARY_ACTIONS) {
    expect(screen.queryByRole("button", { name: new RegExp(`^${action}$`) })).toBeNull();
  }
  expect(tags).not.toHaveBeenCalled();
});

it("uploads a local image explicitly and keeps local cloud-only actions blocked", async () => {
  vi.mocked(invoke).mockResolvedValueOnce({ status: "success", payload: { media_file_token: "mf_imported" } });
  renderLightbox(LOCAL_ID);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Upload to cloud library" })); });
  expect(invoke).toHaveBeenCalledWith("import_local_generation_command", { request: { id: LOCAL_ID } });
  expect(screen.queryByRole("button", { name: /^Share$/ })).toBeNull();
});

it("downloads local images and deletes them through the native media command", async () => {
  const action = renderLightbox(LOCAL_ID);
  fireEvent.click(screen.getByRole("button", { name: /Download/ }));
  expect(action).toHaveBeenCalledWith("https://example.com/f.png", "image", undefined);
  fireEvent.click(screen.getByRole("button", { name: /Delete/ }));
  await act(async () => { await actionReminderProps.value?.onPrimaryAction(); });
  expect(invoke).toHaveBeenCalledWith("media_file_delete_command", { request: { media_file_token: LOCAL_ID } });
});

it("offers library actions for a library item", () => {
  renderLightbox(LIBRARY_ID);
  for (const action of LIBRARY_ACTIONS) {
    expect(screen.getByRole("button", { name: new RegExp(`^${action}$`) })).toBeTruthy();
  }
});

it.each([
  { mediaId: LOCAL_ID, lookups: 0 },
  { mediaId: LIBRARY_ID, lookups: 1 },
])("looks $mediaId up on the server $lookups time(s)", async ({ mediaId, lookups }) => {
  vi.useFakeTimers();
  const lookup = vi.spyOn(MediaFilesApi.prototype, "GetMediaFileByToken").mockResolvedValue({ success: false });
  renderLightbox(mediaId);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
  expect(lookup).toHaveBeenCalledTimes(lookups);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function renderLightbox(mediaId: string) {
  const action = vi.fn();
  render(
    <LightboxModal
      isOpen
      onClose={vi.fn()}
      onCloseGallery={vi.fn()}
      imageUrl="https://example.com/f.png"
      mediaId={mediaId}
      mediaClass="image"
      onDownloadClicked={action}
      onAddToSceneClicked={action}
      onEditClicked={action}
      onTurnIntoVideoClicked={action}
      onRemoveBackgroundClicked={action}
      onMake3DObjectClicked={action}
      onMake3DWorldClicked={action}
    />,
  );
  return action;
}
