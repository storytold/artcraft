import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ClearWaveSpeedApiKey, HasWaveSpeedApiKey, SetWaveSpeedApiKey } from "@storyteller/tauri-api";
import { WaveSpeedAccountBlock } from "./WaveSpeedAccountBlock";

vi.mock("@storyteller/tauri-api", () => ({
  ClearWaveSpeedApiKey: vi.fn(),
  HasWaveSpeedApiKey: vi.fn(),
  SetWaveSpeedApiKey: vi.fn(),
}));

vi.mock("@storyteller/ui-button", () => ({
  Button: ({ children, variant, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => (
    <button {...props}>{children}</button>
  ),
}));

beforeEach(() => {
  vi.mocked(HasWaveSpeedApiKey).mockResolvedValue(false);
  vi.mocked(SetWaveSpeedApiKey).mockResolvedValue();
  vi.mocked(ClearWaveSpeedApiKey).mockResolvedValue();
});

afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("saves a password field, clears it, and lets the user disconnect", async () => {
  render(<WaveSpeedAccountBlock />);
  const input = screen.getByLabelText("WaveSpeed API key") as HTMLInputElement;
  await waitFor(() => expect(input.disabled).toBe(false));
  expect(input.type).toBe("password");
  fireEvent.change(input, { target: { value: "test-key" } });
  fireEvent.click(screen.getByRole("button", { name: "Save key" }));
  await screen.findByText("WaveSpeed (API key saved)");
  expect(SetWaveSpeedApiKey).toHaveBeenCalledWith("test-key");
  expect(input.value).toBe("");
  fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Disconnect" })).toBeNull());
  expect(ClearWaveSpeedApiKey).toHaveBeenCalledOnce();
});

it("shows an error when saving fails without showing a connected state", async () => {
  vi.mocked(SetWaveSpeedApiKey).mockRejectedValue(new Error("storage failed"));
  render(<WaveSpeedAccountBlock />);
  const input = screen.getByLabelText("WaveSpeed API key") as HTMLInputElement;
  await waitFor(() => expect(input.disabled).toBe(false));
  fireEvent.change(input, { target: { value: "test-key" } });
  fireEvent.click(screen.getByRole("button", { name: "Save key" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Could not save");
  expect(screen.queryByRole("button", { name: "Disconnect" })).toBeNull();
});
