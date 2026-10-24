import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

// The resolution menu must not keep a resolution the newly chosen model does not offer. The aspect-ratio
// menu next to it already resets itself; without the same reset, a "3K" picked on one model is still sent
// (and shown as a menu with nothing selected) after switching to a model that only has 1K / 2K / 4K.

vi.mock("@storyteller/ui-popover", () => ({
  PopoverMenu: () => <div data-testid="popover" />,
}));

vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@storyteller/icons", () => ({
  DynamicIcon: () => <span />,
  HighDefinitionIcon: () => <span />,
  StandardDefinitionIcon: () => <span />,
}));

import { CommonResolution, type ImageModel } from "@storyteller/model-list";
import { ResolutionPicker } from "./ResolutionPicker";

// Only the fields the picker reads.
const modelWithoutThreeK = {
  resolutions: [CommonResolution.OneK, CommonResolution.TwoK, CommonResolution.FourK],
  defaultResolution: CommonResolution.OneK,
} as unknown as ImageModel;

describe("ResolutionPicker", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("resets to the model default when the stored resolution is not offered by the model", () => {
    const onSelect = vi.fn();
    render(
      <ResolutionPicker
        model={modelWithoutThreeK}
        currentResolution={CommonResolution.ThreeK}
        handleCommonResolutionSelect={onSelect}
      />,
    );
    expect(onSelect).toHaveBeenCalledWith(CommonResolution.OneK);
  });

  it("leaves a supported resolution alone", () => {
    const onSelect = vi.fn();
    render(
      <ResolutionPicker
        model={modelWithoutThreeK}
        currentResolution={CommonResolution.TwoK}
        handleCommonResolutionSelect={onSelect}
      />,
    );
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does nothing when no resolution has been chosen yet", () => {
    const onSelect = vi.fn();
    render(
      <ResolutionPicker
        model={modelWithoutThreeK}
        handleCommonResolutionSelect={onSelect}
      />,
    );
    expect(onSelect).not.toHaveBeenCalled();
  });
});
