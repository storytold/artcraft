import { beforeEach, describe, expect, it, vi } from "vitest";

// Spies for the three MediaUploadApi upload methods that uploadAsset chooses between.
// vi.hoisted makes them available inside the vi.mock factory below (mocks are hoisted above imports).
const h = vi.hoisted(() => ({
  // Splat endpoint (/v1/media_files/upload/spz).
  UploadSpzFile: vi.fn(),
  // PMX/zip endpoint.
  UploadPmx: vi.fn(),
  // Generic engine-asset endpoint (GLB and friends).
  UploadNewEngineAsset: vi.fn(),
}));

// Replace the real API class so no network call is possible; each method just records its arguments.
vi.mock("@storyteller/api", () => ({
  MediaUploadApi: class {
    UploadSpzFile = h.UploadSpzFile;
    UploadPmx = h.UploadPmx;
    UploadNewEngineAsset = h.UploadNewEngineAsset;
  },
}));

import { uploadAsset } from "./uploadAsset";

// Builds the call arguments uploadAsset needs; only the file name varies between tests.
const upload = (name: string) =>
  uploadAsset({
    file: new File([], name),
    title: "T",
    engineCategory: "object" as never,
  });

describe("uploadAsset routes by file extension, whatever its letter case", () => {
  beforeEach(() => {
    // Clear the call history between tests so each assertion sees only its own call.
    h.UploadSpzFile.mockReset().mockResolvedValue({ success: true, data: "m_1" });
    h.UploadPmx.mockReset().mockResolvedValue({ success: true, data: "m_2" });
    h.UploadNewEngineAsset.mockReset().mockResolvedValue({ success: true, data: "m_3" });
  });

  // Control: the lowercase name the picker documents already works.
  it("sends a lowercase .spz file to the splat endpoint", async () => {
    await upload("scene.spz");
    expect(h.UploadSpzFile).toHaveBeenCalledTimes(1);
    expect(h.UploadNewEngineAsset).not.toHaveBeenCalled();
  });

  // The picker (react-drag-drop-files) and the global drop handler both compare extensions
  // case-insensitively, so an upper-case name reaches this function.
  it("sends an upper-case .SPZ file to the splat endpoint too", async () => {
    await upload("Scene.SPZ");
    expect(h.UploadSpzFile).toHaveBeenCalledTimes(1);
    expect(h.UploadNewEngineAsset).not.toHaveBeenCalled();
  });

  it("sends a mixed-case .Spz file to the splat endpoint too", async () => {
    await upload("Scene.Spz");
    expect(h.UploadSpzFile).toHaveBeenCalledTimes(1);
  });

  // Not a counted case: no dialog offers .zip today (OBJECT_FILE_TYPE is GLB/FBX), so this only pins that the
  // shared switch is case-insensitive for every branch.
  it("sends an upper-case .ZIP file to the PMX endpoint", async () => {
    await upload("Model.ZIP");
    expect(h.UploadPmx).toHaveBeenCalledTimes(1);
    expect(h.UploadNewEngineAsset).not.toHaveBeenCalled();
  });

  // The documented backend rule is lowercase extensions, so the name that goes over the wire
  // carries a lowercase extension (the base name keeps its case).
  it("uploads an upper-case extension under a lowercase-extension name", async () => {
    await upload("Scene.SPZ");
    expect(h.UploadSpzFile).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: "Scene.spz" }),
    );
    await upload("Robot.GLB");
    expect(h.UploadNewEngineAsset).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: "Robot.glb" }),
    );
  });

  // Control: a lowercase name is passed through untouched.
  it("leaves an already-lowercase name unchanged", async () => {
    await upload("robot.glb");
    expect(h.UploadNewEngineAsset).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: "robot.glb" }),
    );
  });
});
