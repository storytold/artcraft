import { beforeEach, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { GenerateImage } from "./GenerateImage";
import { GenerateVideo } from "./GenerateVideo";
import {
  GenerateAudio,
  GenerateMesh,
  GenerateSplat,
  EstimateAudioCost,
  EstimateMeshCost,
} from "./GenerateOmni";
import { EstimateVideoCost } from "../cost_estimate/EstimateVideoCost";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
beforeEach(() => vi.mocked(invoke).mockReset());

it("passes unknown model and option strings through image and video commands", async () => {
  const image = {
    model: "future_image",
    resolution: "eight_k",
    quality: "ultra",
    extra_option: false,
  };
  const video = {
    model: "future_video",
    bitrate: "high",
    resolution: "eight_k",
    duration_seconds: 30,
    generate_audio: false,
  };
  await GenerateImage(image);
  await GenerateVideo(video);
  expect(invoke).toHaveBeenNthCalledWith(1, "generate_image_command", {
    request: image,
  });
  expect(invoke).toHaveBeenNthCalledWith(2, "generate_video_command", {
    request: video,
  });
});

it("dispatches every added modality and its pricing through Tauri", async () => {
  const request = { model: "future_model", prompt: "example" };
  await GenerateAudio(request);
  await GenerateMesh(request);
  await GenerateSplat(request);
  await EstimateAudioCost(request);
  await EstimateMeshCost(request);
  expect(vi.mocked(invoke).mock.calls.map(([command]) => command)).toEqual([
    "generate_audio_command",
    "generate_mesh_command",
    "generate_splat_command",
    "estimate_audio_cost_command",
    "estimate_mesh_cost_command",
  ]);
});

it("preserves reference duration hints in video pricing", async () => {
  const request = {
    model: "future_video",
    bitrate: "high",
    duration_seconds: 30,
    reference_video_media_tokens: ["mf_video"],
    estimate_only: {
      total_input_video_duration_millis: 7250,
      total_input_audio_duration_millis: 3500,
    },
  };
  await EstimateVideoCost(request);
  expect(invoke).toHaveBeenCalledWith("estimate_video_cost_command", {
    request,
  });
});
