import { beforeEach, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { ClearWaveSpeedApiKey, HasWaveSpeedApiKey, SetWaveSpeedApiKey } from "./WaveSpeedCredentials";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

beforeEach(() => vi.mocked(invoke).mockReset());

it("stores a trimmed key under the WaveSpeed credential key", async () => {
  vi.mocked(invoke).mockResolvedValue({ status: "success" });
  await SetWaveSpeedApiKey(" test-key ");
  expect(invoke).toHaveBeenCalledWith("provider_set_api_key_command", {
    request: { provider_credential: "wavespeed_api_key", api_key: "test-key" },
  });
});

it("checks the saved credential without returning its value", async () => {
  vi.mocked(invoke).mockResolvedValue({ status: "success", payload: { providers: [
    { provider_credential: "wavespeed_api_key", has_credentials: true },
  ] } });
  expect(await HasWaveSpeedApiKey()).toBe(true);
});

it("removes the saved credential", async () => {
  vi.mocked(invoke).mockResolvedValue({ status: "success" });
  await ClearWaveSpeedApiKey();
  expect(invoke).toHaveBeenCalledWith("provider_clear_command", {
    request: { provider_credential: "wavespeed_api_key" },
  });
});

it("reports credential storage errors", async () => {
  vi.mocked(invoke).mockResolvedValue({ status: "server_error" });
  await expect(SetWaveSpeedApiKey("test-key")).rejects.toThrow("Could not save");
  await expect(HasWaveSpeedApiKey()).rejects.toThrow("Could not load");
  await expect(ClearWaveSpeedApiKey()).rejects.toThrow("Could not remove");
});

it("rejects blank keys before saving credentials", async () => {
  await expect(SetWaveSpeedApiKey("  ")).rejects.toThrow("cannot be empty");
  expect(invoke).not.toHaveBeenCalled();
});
