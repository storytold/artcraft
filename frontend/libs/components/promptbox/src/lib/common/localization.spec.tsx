import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { setLocale } from "@storyteller/i18n";
import { CommonAspectRatio, CommonQuality, type ImageModel } from "@storyteller/model-list";
import { QualityPicker } from "./QualityPicker";
import { AspectRatioPicker } from "./AspectRatioPicker";
import { SoundsSettingsPopover } from "./SoundsSettingsPopover";

// Expose the menu's public selection contract without testing its positioning.
vi.mock("@storyteller/ui-popover", () => ({
  PopoverMenu: ({ items = [], onSelect, children }: {
    items?: { label: string; action?: string }[];
    onSelect?: (item: { label: string; action?: string }) => void;
    children?: ReactNode;
  }) => <div>{items.map((item) => <button key={item.action} onClick={() => onSelect?.(item)}>{item.label}</button>)}{children}</div>,
}));
vi.mock("@storyteller/ui-tooltip", () => ({ Tooltip: ({ children }: { children: ReactNode }) => <>{children}</> }));

afterEach(async () => {
  cleanup();
  await setLocale("en");
  localStorage.clear();
});

it("changes quality and ratio labels while preserving model parameter values", async () => {
  const quality = vi.fn();
  const ratio = vi.fn();
  const model = {
    qualityOptions: [CommonQuality.Auto, CommonQuality.High],
    resolveQuality: () => CommonQuality.Auto,
    aspectRatios: [CommonAspectRatio.Square, CommonAspectRatio.WideSixteenByNine],
    defaultAspectRatio: CommonAspectRatio.Square,
  } as unknown as ImageModel;
  render(<><QualityPicker model={model} handleCommonQualitySelect={quality} /><AspectRatioPicker model={model} handleCommonAspectRatioSelect={ratio} /></>);
  await act(() => setLocale("zh-CN"));
  expect(quality).not.toHaveBeenCalled();
  expect(ratio).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "高", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "16:9（横向）", exact: true }));
  expect(quality).toHaveBeenCalledWith(CommonQuality.High);
  expect(ratio).toHaveBeenCalledWith(CommonAspectRatio.WideSixteenByNine);
  await act(() => setLocale("en"));
  expect(screen.getByRole("button", { name: "Square", exact: true })).toBeTruthy();
  expect(quality).toHaveBeenCalledTimes(1);
  expect(ratio).toHaveBeenCalledTimes(1);
});

it("translates musical-key descriptions without changing wire-format keys", async () => {
  const select = vi.fn();
  render(<SoundsSettingsPopover showMusicalKey onMusicalKeyChange={select} />);
  await act(() => setLocale("zh-CN"));
  fireEvent.click(screen.getByTitle("C 小调"));
  expect(select).toHaveBeenLastCalledWith("c_minor");
  fireEvent.click(screen.getByRole("button", { name: "自动", exact: true }));
  expect(select).toHaveBeenLastCalledWith("auto");
});
