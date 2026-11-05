import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

// Heavy workspace UI pieces are replaced with light stand-ins.
vi.mock("@storyteller/ui-modal", () => ({
  Modal: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="modal" className={className}>
      {children}
    </div>
  ),
}));
vi.mock("lucide-react", () => ({ PlusIcon: () => null, Trash2Icon: () => null }));
vi.mock("@storyteller/ui-popover", () => ({}));
vi.mock("@storyteller/ui-button", () => ({
  Button: ({ children }: { children?: React.ReactNode }) => (
    <button>{children}</button>
  ),
}));
vi.mock("@storyteller/ui-input", () => ({ Input: () => <input /> }));
vi.mock("@storyteller/ui-label", () => ({
  Label: ({ children }: { children?: React.ReactNode }) => <label>{children}</label>,
}));
vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@storyteller/ui-sliderv2", () => ({
  SliderV2: () => <div data-testid="slider" />,
}));
vi.mock("@storyteller/common", () => ({}));

import { CameraSettingsModal } from "./camera-settings-modal";

const camera = {
  id: "main",
  label: "Main",
  focalLength: 50,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  lookAt: { x: 0, y: 0, z: 0 },
} as never;

// jsdom 22 has no PointerEvent: use a bubbling generic event of the right type.
const fire = (target: EventTarget, type: string) =>
  act(() => {
    target.dispatchEvent(new Event(type, { bubbles: true }));
  });

const renderModal = () => {
  const setFocalLengthDragging = vi.fn();
  const utils = render(
    <CameraSettingsModal
      isOpen
      onClose={vi.fn()}
      cameras={[camera]}
      onCameraNameChange={vi.fn()}
      onCameraFocalLengthChange={vi.fn()}
      onAddCamera={vi.fn()}
      selectedCameraId="main"
      handleCameraSelect={vi.fn()}
      onDeleteCamera={vi.fn()}
      setFocalLengthDragging={setFocalLengthDragging}
      disableHotkeyInput={vi.fn()}
      enableHotkeyInput={vi.fn()}
    />,
  );
  return { ...utils, setFocalLengthDragging };
};

describe("CameraSettingsModal focal-length drag", () => {
  afterEach(() => cleanup());

  it("fades the modal while dragging and restores it on pointerup", () => {
    const { getByTestId, setFocalLengthDragging } = renderModal();
    fire(getByTestId("slider"), "pointerdown");
    expect(getByTestId("modal").className).toMatch(/\bopacity-10\b/);
    expect(setFocalLengthDragging).toHaveBeenLastCalledWith({
      isDragging: true,
      focalLength: 50,
    });

    fire(document, "pointerup");
    expect(getByTestId("modal").className).toContain("opacity-100");
    expect(setFocalLengthDragging).toHaveBeenLastCalledWith({
      isDragging: false,
      focalLength: 50,
    });
  });

  it("also ends the drag on pointercancel instead of leaving the modal faded", () => {
    const { getByTestId, setFocalLengthDragging } = renderModal();
    fire(getByTestId("slider"), "pointerdown");
    expect(getByTestId("modal").className).toMatch(/\bopacity-10\b/);

    // The browser takes over the gesture: no pointerup is ever delivered.
    fire(document, "pointercancel");
    expect(getByTestId("modal").className).toContain("opacity-100");
    expect(setFocalLengthDragging).toHaveBeenLastCalledWith({
      isDragging: false,
      focalLength: 50,
    });
  });
});
