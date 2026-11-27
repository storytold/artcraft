import {
  FileEntryStatus,
  FilterEngineCategories,
  UploaderState,
  UploaderStates,
} from "./Types";
import { uploadImagesBatch } from "./UploadModalImage/utilities/uploadImagesBatch";
import { uploadImage } from "./UploadModalImage/utilities/uploadImage";
import { upload3DObjectsBatch } from "./UploadModal3D/utilities/upload3DObjectsBatch";
import { upload3DObjects } from "./UploadModal3D/utilities/upload3DObjects";

// These tests exercise the batch coordinators without building the API client.
vi.mock("./Types", () => ({
  FilterEngineCategories: { ANIMATION: "animation" },
  UploaderStates: {
    success: "success",
    assetError: "assetError",
    coverCreateError: "coverCreateError",
    coverSetError: "coverSetError",
  },
}));
vi.mock("./UploadModalImage/utilities/uploadImage", () => ({
  uploadImage: vi.fn(),
}));
vi.mock("./UploadModal3D/utilities/upload3DObjects", () => ({
  upload3DObjects: vi.fn(),
}));

type BatchOptions = Parameters<typeof uploadImagesBatch>[0];

const batches = [
  { name: "images", run: uploadImagesBatch },
  {
    name: "3D objects",
    run: (options: BatchOptions) =>
      upload3DObjectsBatch({
        ...options,
        thumbnails: new Map(),
        engineCategory: FilterEngineCategories.ANIMATION,
      }),
  },
];

describe.each(batches)("batch upload of $name", ({ run }) => {
  it("keeps other uploads pending when one request rejects", async () => {
    let releaseSlowUpload!: () => void;
    const slowUpload = new Promise<void>((resolve) => {
      releaseSlowUpload = resolve;
    });
    // Empty synthetic files are enough because only upload outcomes matter.
    const files = [new File([], "fails"), new File([], "succeeds")];
    const upload = async ({
      assetFile,
      progressCallback,
    }: {
      assetFile: File;
      progressCallback: (state: UploaderState) => void;
    }) => {
      if (assetFile === files[0]) throw new Error("connection lost");
      await slowUpload;
      progressCallback({ status: UploaderStates.success });
    };
    vi.mocked(uploadImage).mockImplementation(upload);
    vi.mocked(upload3DObjects).mockImplementation(upload);

    let reportFailure!: () => void;
    const reportedFailure = new Promise<void>((resolve) => {
      reportFailure = resolve;
    });
    const onFileStatusChange = vi.fn(
      (index: number, status: FileEntryStatus) => {
        if (index === 0 && status === "error") reportFailure();
      },
    );
    const onOverallProgress = vi.fn();
    const onComplete = vi.fn();
    const batch = run({
      files,
      onFileStatusChange,
      onOverallProgress,
      onComplete,
    });

    try {
      await reportedFailure;
      expect(
        onFileStatusChange.mock.calls.filter(([index]) => index === 1),
      ).toEqual([[1, "uploading"]]);
      expect(onOverallProgress).toHaveBeenLastCalledWith(1, files.length);
      expect(onComplete).not.toHaveBeenCalled();
    } finally {
      releaseSlowUpload();
      await batch;
    }

    expect(
      onFileStatusChange.mock.calls.some(
        ([index, status]) => index === 1 && status === "success",
      ),
    ).toBe(true);
    expect(onOverallProgress).toHaveBeenLastCalledWith(
      files.length,
      files.length,
    );
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(false, true);
  });
});
