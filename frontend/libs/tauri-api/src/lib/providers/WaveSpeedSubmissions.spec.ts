import { expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { ListWaveSpeedSubmissions, RecoverWaveSpeedSubmission } from "./WaveSpeedSubmissions";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

it("lists ambiguous submissions and recovers by prediction ID without generation", async () => {
  const submissions = [{ id: "receipt", prompt: "a wave", model_id: "seedance_2p0", task_type: "video_generation" }];
  vi.mocked(invoke).mockResolvedValueOnce({ status: "success", payload: { submissions } });
  expect(await ListWaveSpeedSubmissions()).toEqual(submissions);
  vi.mocked(invoke).mockResolvedValueOnce({ status: "success" });
  await RecoverWaveSpeedSubmission("receipt", " job-id ");
  expect(invoke).toHaveBeenLastCalledWith("recover_wavespeed_submission_command", { request: { id: "receipt", prediction_id: "job-id" } });
});
