import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AppearanceSettingsPane } from "../../../../../libs/components/settings-modal/src/lib/panes/AppearanceSettingsPane";

vi.mock("@storyteller/tauri-utils", () => ({ IsDesktopApp: () => false }));

vi.mock("@storyteller/ui-label", () => ({
  Label: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

afterEach(cleanup);

it("offers Custom alongside the five built-in themes", () => {
  render(<AppearanceSettingsPane />);
  for (const name of [
    "Default",
    "Light",
    "Black",
    "Aurora",
    "Sunset",
    "Custom",
  ]) {
    expect(screen.getByRole("button", { name })).toBeTruthy();
  }
});

it("persists Custom and announces the browser fallback without a modal", () => {
  render(<AppearanceSettingsPane />);
  const custom = screen.getByRole("button", { name: "Custom" });
  fireEvent.click(custom);
  expect(custom.getAttribute("aria-pressed")).toBe("true");
  expect(localStorage.getItem("st-theme")).toBe("custom");
  expect(screen.getByRole("status").textContent).toContain("desktop app");
  fireEvent.click(screen.getByRole("button", { name: "Light" }));
  expect(localStorage.getItem("st-theme")).toBe("light");
  expect(screen.queryByRole("status")).toBeNull();
});
