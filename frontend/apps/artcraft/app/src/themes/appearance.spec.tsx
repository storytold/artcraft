import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
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
