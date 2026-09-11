import { beforeEach, expect, it, vi } from "vitest";
import { sceneOutputAdapter } from "./sceneOutputAdapter";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  image: { value: null as any },
  mediaId: { value: null as string | null },
  visible: { value: false },
  previous: { value: null },
  next: { value: null },
}));

// Exercise the real multipart API client, replacing only the network boundary.
vi.mock("@storyteller/tauri-utils", () => ({ FetchProxy: mocks.fetch }));
vi.mock("@storyteller/api", async () => ({
  ...await import("../../../../../../libs/api/src/lib/MediaUploadApi"),
  ...await import("../../../../../../libs/api/src/lib/MediaFilesApi"),
  ...await import("../../../../../../libs/api/src/lib/enums/EIntermediateFile"),
}));
vi.mock("@storyteller/ui-gallery-modal", () => ({
  galleryModalLightboxImage: mocks.image,
  galleryModalLightboxMediaId: mocks.mediaId,
  galleryModalLightboxVisible: mocks.visible,
  galleryModalLightboxNavPrev: mocks.previous,
  galleryModalLightboxNavNext: mocks.next,
}));

beforeEach(() => {
  mocks.fetch.mockReset();
  mocks.image.value = null;
  mocks.mediaId.value = null;
  mocks.visible.value = false;
});

it.each([
  { kind: "video" as const, fileName: "scene-recording.mp4", mime: "video/mp4", endpoint: "new_video" },
  { kind: "image" as const, fileName: "scene-capture.png", mime: "image/png", endpoint: "image" },
])("uploads a $kind as a library output through authenticated multipart HTTP", async ({ kind, fileName, mime, endpoint }) => {
  mocks.fetch.mockResolvedValue(new Response(JSON.stringify({
    success: true, media_file_token: "mf_scene_output",
  })));
  const blob = new Blob(["rendered scene"], { type: mime });
  const token = await sceneOutputAdapter.uploadMedia({ kind, blob, fileName });
  expect(token).toBe("mf_scene_output");
  const [url, request] = mocks.fetch.mock.calls[0];
  expect(url).toMatch(new RegExp(`/v1/media_files/upload/${endpoint}$`));
  expect(request.method).toBe("POST");
  expect(request.credentials).toBe("include");
  const form = request.body as FormData;
  expect(form.get("is_intermediate_system_file")).toBe("false");
  expect(form.get("uuid_idempotency_token")).toBeTruthy();
  expect(form.get("maybe_title")).toBe(fileName);
  const file = form.get("file") as File;
  expect(file.name).toBe(fileName);
  expect(file.type).toBe(mime);
  expect(file.size).toBe(blob.size);
});

it("surfaces an API rejection instead of treating it as an uploaded recording", async () => {
  mocks.fetch.mockResolvedValue(new Response(JSON.stringify({
    success: false, BadInput: "Video upload rejected",
  }), { status: 400 }));
  await expect(sceneOutputAdapter.uploadMedia({
    kind: "video", blob: new Blob(["video"]), fileName: "recording.mp4",
  })).rejects.toThrow("Video upload rejected");
  expect(mocks.visible.value).toBe(false);
});

it("opens the uploaded video in the desktop lightbox using its CDN URL", async () => {
  mocks.fetch.mockResolvedValue(new Response(JSON.stringify({
    success: true,
    media_file: {
      token: "mf_scene_output",
      maybe_title: "My recording",
      created_at: "2026-09-11T12:00:00Z",
      media_links: { cdn_url: "https://cdn.example/recording.mp4" },
    },
  })));
  await sceneOutputAdapter.openMediaLightbox("mf_scene_output", "video");
  expect(mocks.fetch.mock.calls[0][0]).toMatch(/\/v1\/media_files\/file\/mf_scene_output$/);
  expect(mocks.image.value).toMatchObject({
    id: "mf_scene_output", label: "My recording", mediaClass: "video",
    fullImage: "https://cdn.example/recording.mp4",
  });
  expect(mocks.mediaId.value).toBe("mf_scene_output");
  expect(mocks.visible.value).toBe(true);
});

it("reports a failed preview lookup so the local recording can be retained", async () => {
  mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 503 }));
  await expect(sceneOutputAdapter.openMediaLightbox("mf_scene_output", "video"))
    .rejects.toThrow("Upload succeeded, but the preview could not be loaded");
  expect(mocks.visible.value).toBe(false);
});
