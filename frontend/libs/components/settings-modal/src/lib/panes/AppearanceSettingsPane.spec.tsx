import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AppearanceSettingsPane } from "./AppearanceSettingsPane";
import { applyStoredUiFont } from "../ui-font";

const api = vi.hoisted(() => ({ listFonts: vi.fn() }));

vi.mock("@storyteller/tauri-api", () => ({
  ListSystemFonts: api.listFonts,
}));

beforeEach(() => {
  api.listFonts.mockResolvedValue({
    status: "success",
    payload: { families: ["DejaVu Sans", "Fira Sans", "Noto Serif"] },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  document.documentElement.removeAttribute("style");
});

it("applies a chosen installed font to the whole interface", async () => {
  const user = userEvent.setup();
  render(<AppearanceSettingsPane />);

  await user.click(await screen.findByRole("option", { name: "Fira Sans" }));

  expect(uiFontVariable()).toBe('"Fira Sans"');
  expect(localStorage.getItem("st-ui-font")).toBe("Fira Sans");
  expect(screen.getByText("Current: Fira Sans")).toBeTruthy();
});

it("restores the default font", async () => {
  const user = userEvent.setup();
  render(<AppearanceSettingsPane />);
  await user.click(await screen.findByRole("option", { name: "Noto Serif" }));

  await user.click(screen.getByRole("button", { name: "Restore default" }));

  expect(uiFontVariable()).toBe("");
  expect(localStorage.getItem("st-ui-font")).toBeNull();
  expect(screen.getByText("Current: Default")).toBeTruthy();
  expect(
    (screen.getByRole("button", { name: "Restore default" }) as HTMLButtonElement).disabled,
  ).toBe(true);
});

it("filters the installed fonts by search", async () => {
  const user = userEvent.setup();
  render(<AppearanceSettingsPane />);
  await screen.findByRole("option", { name: "DejaVu Sans" });

  await user.type(screen.getByRole("textbox", { name: "Search installed fonts" }), "noto");

  expect(screen.queryByRole("option", { name: "DejaVu Sans" })).toBeNull();
  expect(screen.getByRole("option", { name: "Noto Serif" })).toBeTruthy();
});

it("re-applies the stored font at startup", () => {
  localStorage.setItem("st-ui-font", 'My "Odd" Font');

  applyStoredUiFont();

  expect(uiFontVariable()).toBe('"My \\"Odd\\" Font"');
});

it("says so when installed fonts can't be listed", async () => {
  api.listFonts.mockRejectedValue(new Error("no tauri"));
  render(<AppearanceSettingsPane />);

  expect(await screen.findByText("Couldn't load installed fonts.")).toBeTruthy();
});

function uiFontVariable(): string {
  return document.documentElement.style.getPropertyValue("--st-ui-font");
}
