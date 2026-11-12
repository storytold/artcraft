import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { GrokGetCredentialInfo, MidjourneyGetCredentialInfo } from "@storyteller/tauri-api";
import { AccountSettingsPane } from "./AccountSettingsPane";

vi.mock("@storyteller/tauri-api", () => ({
  GrokGetCredentialInfo: vi.fn(),
  MidjourneyGetCredentialInfo: vi.fn(),
}));
vi.mock("./ArtcraftAccountBlock", () => ({ ArtcraftAccountBlock: () => <div>Artcraft account</div> }));
vi.mock("./WaveSpeedAccountBlock", () => ({ WaveSpeedAccountBlock: () => <div>WaveSpeed account</div> }));
vi.mock("./ProviderAccountBlock", () => ({
  ProviderAccountBlock: ({ name, commandPrefix, getCredentialInfo }: {
    name: string;
    commandPrefix: string;
    getCredentialInfo: unknown;
  }) => <div data-command-prefix={commandPrefix} data-correct-loader={
    getCredentialInfo === (name === "Grok" ? GrokGetCredentialInfo : MidjourneyGetCredentialInfo)
  }>{name} account</div>,
}));

afterEach(cleanup);

it("retains WaveSpeed settings alongside the shared Grok and Midjourney account blocks", () => {
  render(<AccountSettingsPane globalAccountLogoutCallback={vi.fn()} />);
  expect(screen.getByText("Artcraft account")).toBeTruthy();
  expect(screen.getByText("WaveSpeed account")).toBeTruthy();
  for (const name of ["Grok", "Midjourney"]) {
    const block = screen.getByText(`${name} account`);
    expect(block.getAttribute("data-command-prefix")).toBe(name.toLowerCase());
    expect(block.getAttribute("data-correct-loader")).toBe("true");
  }
});
