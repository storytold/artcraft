import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => ({ toastError: vi.fn() }));

// The hook only needs these at module load; none matter to the upload logic.
vi.mock("@storyteller/ui-gallery-modal", () => ({ GalleryModal: () => null }));
vi.mock("@storyteller/tauri-api", () => ({ downloadFileFromUrl: vi.fn() }));
vi.mock("@storyteller/ui-toaster", () => ({ toast: { error: m.toastError } }));
vi.mock("@storyteller/common", () => ({
  UploaderStates: {
    success: "success",
    assetError: "assetError",
    imageCreateError: "imageCreateError",
  },
}));
vi.mock("../common/imagePreview", () => ({
  createImagePreviewUrl: vi.fn(async () => "blob:preview"),
  revokeIfBlobUrl: vi.fn(),
}));

import { revokeIfBlobUrl } from "../common/imagePreview";
import { useDeckMedia } from "./useDeckMedia";

afterEach(() => cleanup());

beforeEach(() => {
  m.toastError.mockReset();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
});

const png = () => new File(["x"], "a.png", { type: "image/png" });

const setup = (uploadImage: never) => {
  const setReferenceImages = vi.fn();
  const hook = renderHook(() =>
    useDeckMedia<never, never, never>({
      referenceImages: [],
      setReferenceImages,
      maxImages: 4,
      uploadImage,
    }),
  );
  return { ...hook, setReferenceImages };
};

describe("useDeckMedia image uploads", () => {
  it("commits the reference when the upload succeeds", async () => {
    const upload = vi.fn(async ({ progressCallback }) => {
      progressCallback({ status: "success", data: "tok" });
    });
    const { result, setReferenceImages } = setup(upload as never);
    await act(async () => {
      result.current.processImageFiles([png()], "start");
    });
    await waitFor(() => expect(setReferenceImages).toHaveBeenCalledTimes(1));
    expect(setReferenceImages.mock.calls[0][0][0]).toMatchObject({ mediaToken: "tok" });
    expect(result.current.uploadingImages).toHaveLength(0);
  });

  it("clears the spinner when the upload reports an error", async () => {
    const upload = vi.fn(async ({ progressCallback }) => {
      progressCallback({ status: "imageCreateError" });
    });
    const { result, setReferenceImages } = setup(upload as never);
    await act(async () => {
      result.current.processImageFiles([png()], "start");
    });
    await waitFor(() => expect(result.current.uploadingImages).toHaveLength(0));
    expect(setReferenceImages).not.toHaveBeenCalled();
  });

  it("clears the spinner when the upload THROWS (it used to stick forever)", async () => {
    const upload = vi.fn(async () => {
      throw new Error("network down");
    });
    const { result, setReferenceImages } = setup(upload as never);
    await act(async () => {
      result.current.processImageFiles([png()], "start");
    });
    await waitFor(() => expect(upload).toHaveBeenCalled());
    await waitFor(() => expect(result.current.uploadingImages).toHaveLength(0));
    expect(setReferenceImages).not.toHaveBeenCalled();
  });
});

describe("useDeckMedia fullUrl lifecycle", () => {
  // Renders the hook with caller-controlled committed images so the test can
  // simulate the store removing a ref.
  const setupControlled = () => {
    const upload = vi.fn(async ({ progressCallback }) => {
      progressCallback({ status: "success", data: "tok" });
    });
    const setReferenceImages = vi.fn();
    const hook = renderHook(
      ({ images }: { images: { id: string }[] }) =>
        useDeckMedia<never, never, never>({
          referenceImages: images as never,
          setReferenceImages,
          maxImages: 4,
          uploadImage: upload as never,
        }),
      { initialProps: { images: [] as { id: string }[] } },
    );
    return { ...hook, setReferenceImages };
  };

  const commitOne = async (ctx: ReturnType<typeof setupControlled>) => {
    await act(async () => {
      ctx.result.current.processImageFiles([png()], "start");
    });
    await waitFor(() => expect(ctx.setReferenceImages).toHaveBeenCalledTimes(1));
    return ctx.setReferenceImages.mock.calls[0][0][0] as { id: string; fullUrl: string };
  };

  beforeEach(() => vi.mocked(revokeIfBlobUrl).mockClear());

  it("keeps fullUrl alive while the ref is committed, revokes it once removed", async () => {
    const ctx = setupControlled();
    const ref = await commitOne(ctx);
    expect(ref.fullUrl).toBe("blob:x");

    ctx.rerender({ images: [{ id: ref.id }] });
    expect(revokeIfBlobUrl).not.toHaveBeenCalledWith("blob:x");

    ctx.rerender({ images: [] });
    expect(revokeIfBlobUrl).toHaveBeenCalledWith("blob:x");
  });

  it("does not revoke before the store has shown the committed ref", async () => {
    const ctx = setupControlled();
    await commitOne(ctx);
    ctx.rerender({ images: [] });
    expect(revokeIfBlobUrl).not.toHaveBeenCalledWith("blob:x");
  });

  it("revokes still-committed fullUrls on unmount", async () => {
    const ctx = setupControlled();
    const ref = await commitOne(ctx);
    ctx.rerender({ images: [{ id: ref.id }] });
    ctx.unmount();
    expect(revokeIfBlobUrl).toHaveBeenCalledWith("blob:x");
  });
});
