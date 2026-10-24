import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";

// Same module stand-ins as ImagePromptRow.spec.tsx: the row only needs these
// at module load.
vi.mock("@storyteller/ui-gallery-modal", () => ({ GalleryModal: () => null }));
vi.mock("@storyteller/tauri-api", () => ({ downloadFileFromUrl: vi.fn() }));
vi.mock("@storyteller/ui-toaster", () => ({ toast: { error: vi.fn() } }));
vi.mock("./common/imagePreview", () => ({
  createImagePreviewUrl: vi.fn(async () => "blob:preview"),
  revokeIfBlobUrl: vi.fn(),
}));

import { UploaderStates } from "@storyteller/common";
import { ImagePromptRow } from "./ImagePromptRow";
import type { RefImage } from "./promptStore";

// Spec for the reference-image upload commit: two uploads that finish in the
// same tick must both land in the caller's list.

type ProgressCallback = (state: { status: unknown; data?: string }) => void;

let progressCallbacks: ProgressCallback[];

beforeEach(() => {
  progressCallbacks = [];
  let n = 0;
  URL.createObjectURL = vi.fn(() => `blob:test-${++n}`);
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const png = (name: string) => new File(["x"], name, { type: "image/png" });

describe("ImagePromptRow: two uploads finishing in the same tick", () => {
  it("keeps both reference images", async () => {
    let latest: RefImage[] = [];
    // The caller owns the list, like the real prompt store does.
    function Harness() {
      const [images, setImages] = useState<RefImage[]>([]);
      latest = images;
      return (
        <ImagePromptRow
          visible
          maxImagePromptCount={3}
          allowUpload
          referenceImages={images}
          setReferenceImages={setImages}
          uploadImage={(async ({ progressCallback }: { progressCallback: ProgressCallback }) => {
            progressCallbacks.push(progressCallback);
            await new Promise(() => undefined);
          }) as never}
        />
      );
    }
    const { container } = render(<Harness />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { files: [png("a.png"), png("b.png")] } });
    });
    await waitFor(() => expect(progressCallbacks).toHaveLength(2));

    // Both uploads report success inside one batch, before React re-renders.
    act(() => {
      progressCallbacks[0]({ status: UploaderStates.success, data: "tok-a" });
      progressCallbacks[1]({ status: UploaderStates.success, data: "tok-b" });
    });

    expect(latest.map((image) => image.mediaToken).sort()).toEqual(["tok-a", "tok-b"]);
  });
});
