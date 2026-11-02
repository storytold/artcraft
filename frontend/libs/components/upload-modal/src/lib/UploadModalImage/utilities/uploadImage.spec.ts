import { EIntermediateFile } from "@storyteller/api";
import { UploaderStates } from "../../Types";
import { uploadImage } from "./uploadImage";

const { uploadImageMock } = vi.hoisted(() => ({
  uploadImageMock: vi.fn(),
}));

vi.mock("@storyteller/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@storyteller/api")>();
  class MediaUploadApi {
    UploadImage = uploadImageMock;
  }
  return { ...actual, MediaUploadApi };
});

describe("uploadImage", () => {
  beforeEach(() => {
    uploadImageMock.mockReset();
    uploadImageMock.mockResolvedValue({ success: true, data: "m_token" });
  });

  it("uploads the file as a user file so it appears in the library", async () => {
    const file = new File(["png"], "flat.png", { type: "image/png" });

    await uploadImage({
      title: "flat",
      assetFile: file,
      progressCallback: vi.fn(),
    });

    expect(uploadImageMock).toHaveBeenCalledTimes(1);
    expect(uploadImageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        maybe_title: "flat",
        is_intermediate_system_file: EIntermediateFile.false,
      }),
    );
  });

  it("reports success with the returned media token", async () => {
    const progressCallback = vi.fn();

    await uploadImage({
      title: "flat",
      assetFile: new File(["png"], "flat.png", { type: "image/png" }),
      progressCallback,
    });

    expect(progressCallback).toHaveBeenLastCalledWith({
      status: UploaderStates.success,
      data: "m_token",
    });
  });

  it("reports an asset error when the upload returns no response", async () => {
    uploadImageMock.mockResolvedValue(undefined);
    const progressCallback = vi.fn();

    await uploadImage({
      title: "flat",
      assetFile: new File(["png"], "flat.png", { type: "image/png" }),
      progressCallback,
    });

    expect(progressCallback).toHaveBeenLastCalledWith({
      status: UploaderStates.assetError,
      errorMessage: "Could not upload image plane!",
    });
  });

  it("reports an asset error with the API message when the upload fails", async () => {
    uploadImageMock.mockResolvedValue({
      success: false,
      errorMessage: "upload rejected",
    });
    const progressCallback = vi.fn();

    await uploadImage({
      title: "flat",
      assetFile: new File(["png"], "flat.png", { type: "image/png" }),
      progressCallback,
    });

    expect(progressCallback).toHaveBeenLastCalledWith({
      status: UploaderStates.assetError,
      errorMessage: "upload rejected",
    });
  });
});
