import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ListWaveSpeedSubmissions, RecoverWaveSpeedSubmission } from "@storyteller/tauri-api";
import { WaveSpeedSubmissionRecovery } from "./WaveSpeedSubmissionRecovery";

vi.mock("@storyteller/tauri-api", () => ({ ListWaveSpeedSubmissions: vi.fn(), RecoverWaveSpeedSubmission: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("requires an explicit prediction ID and recovers without resubmitting generation", async () => {
  vi.mocked(ListWaveSpeedSubmissions).mockResolvedValue([{ id: "receipt", prompt: "a wave", model_id: "seedance_2p0", task_type: "video_generation" }]);
  vi.mocked(RecoverWaveSpeedSubmission).mockResolvedValue();
  render(<WaveSpeedSubmissionRecovery />);
  fireEvent.click(screen.getByRole("button", { name: "Check unfinished submissions" }));
  const input = await screen.findByLabelText("Prediction ID for receipt");
  expect((screen.getByRole("button", { name: "Recover prediction" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(input, { target: { value: "job-accepted" } });
  fireEvent.click(screen.getByRole("button", { name: "Recover prediction" }));
  await waitFor(() => expect(RecoverWaveSpeedSubmission).toHaveBeenCalledWith("receipt", "job-accepted"));
  await screen.findByText(/Prediction recovered/);
  expect(screen.queryByLabelText("Prediction ID for receipt")).toBeNull();
});
