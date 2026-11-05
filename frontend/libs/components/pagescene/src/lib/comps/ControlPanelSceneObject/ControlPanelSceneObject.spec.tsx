import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ControlPanelSceneObject } from "./ControlPanelSceneObject";
import { EngineContext } from "../../contexts/EngineContext";
import { usePageSceneStore } from "../../PageSceneStore";

vi.mock("../../contexts/EngineContext", async () => {
  const { createContext } = await import("react");
  return { EngineContext: createContext(null) };
});

// Layout/animation wrapper: render the children whenever `show` is on.
vi.mock("@headlessui/react", () => ({
  Transition: ({ show, children }: { show: boolean; children?: React.ReactNode }) =>
    show ? <div>{children}</div> : null,
}));
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null }));
vi.mock("@storyteller/ui-button", () => ({
  Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));
// Stand-in for the x/y/z box: three text fields that report an edit the way the real one does (whole vector back).
vi.mock("@storyteller/ui-input", () => ({
  InputVector: (p: {
    x: string;
    y: string;
    z: string;
    onChange: (v: Record<string, string>) => void;
  }) => (
    <div>
      {(["x", "y", "z"] as const).map((axis) => (
        <input
          key={axis}
          data-testid={`vec-${axis}`}
          value={p[axis]}
          onChange={(e) => p.onChange({ x: p.x, y: p.y, z: p.z, [axis]: e.target.value })}
        />
      ))}
    </div>
  ),
}));
vi.mock("../../hooks/useViewportSize", () => ({ useViewportSize: () => ({ width: 1280, height: 900 }) }));
vi.mock("../../actions/transformObject", () => ({
  beginTransformSession: () => ({ commit: vi.fn() }),
}));
vi.mock("../../actions/setObjectColor", () => ({
  beginColorSession: () => ({ apply: vi.fn(), commit: vi.fn() }),
}));

const updateSelectedTransform = vi.fn();
const engine = {
  selection: { isObjectLocked: () => false },
  activeScene: { get_object_by_uuid: () => undefined },
  sceneManager: { updateSelectedTransform },
  deleteObject: vi.fn(),
};

const mount = (scale = { x: 1, y: 1, z: 1 }) => {
  usePageSceneStore.setState({
    objectPanelShowing: true,
    objectPanelCurrent: {
      group: {} as never,
      object_uuid: "u1",
      object_name: "cube",
      version: "1",
      objectVectors: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale,
      },
    } as never,
  });
  render(
    <EngineContext.Provider value={engine as never}>
      <ControlPanelSceneObject />
    </EngineContext.Provider>,
  );
};

// The panel renders Location, Rotation, Scale in that order, so the Scale boxes are the third of each axis.
const scaleBox = (axis: "x" | "y" | "z") =>
  screen.getAllByTestId(`vec-${axis}`)[2] as HTMLInputElement;
const scaleValues = () => (["x", "y", "z"] as const).map((a) => scaleBox(a).value);

// The drag handler reads event.x, which jsdom's MouseEvent does not have, so give the event one.
const moveTo = (x: number) => {
  const ev = new MouseEvent("mousemove", { clientX: x });
  Object.defineProperty(ev, "x", { value: x });
  act(() => {
    document.dispatchEvent(ev);
  });
};

// Press on the "Scale" label, pick a step size in the precision menu (hover an entry, leave the menu), then drag.
const dragScaleLabel = (...stops: number[]) => {
  fireEvent.mouseDown(screen.getByText("Scale"), { button: 0, clientX: 100, clientY: 50 });
  act(() => {
    usePageSceneStore.setState({ precisionSelectedValue: 1, precisionSelectorShowing: false });
  });
  moveTo(100); // the first move only records where the drag started
  stops.forEach(moveTo);
};

beforeEach(() => updateSelectedTransform.mockReset());
afterEach(() => {
  // End any drag so its document listeners never leak into the next test.
  act(() => {
    document.dispatchEvent(new MouseEvent("mouseup"));
  });
  cleanup();
  usePageSceneStore.setState({
    objectPanelShowing: false,
    objectPanelCurrent: undefined,
    precisionSelectedValue: 0,
    precisionSelectorShowing: false,
  });
});

// A Scale box is a plain text field, so the user can be part-way through typing ("", "-", ".") when they grab the
// "Scale" label. parseFloat of that is NaN, and "NaN" was written into the box (the engine ignores it, so the panel
// then disagrees with the object, and the box rejects every key press except a select-all).
describe("dragging the Scale label while a Scale box holds unfinished text", () => {
  it("does not write NaN when a box was cleared", () => {
    mount({ x: 1, y: 1, z: 1 });
    fireEvent.change(scaleBox("x"), { target: { value: "" } });
    dragScaleLabel(120);
    expect(scaleValues().join(",")).not.toMatch(/NaN/);
  });

  it("does not write NaN when a box only holds a minus sign", () => {
    mount({ x: 1, y: 1, z: 1 });
    fireEvent.change(scaleBox("z"), { target: { value: "-" } });
    dragScaleLabel(120);
    expect(scaleValues().join(",")).not.toMatch(/NaN/);
  });

  it("starts the cleared box from zero and moves the others by the same amount", () => {
    mount({ x: 1, y: 1, z: 1 });
    fireEvent.change(scaleBox("x"), { target: { value: "" } });
    dragScaleLabel(120); // 20px = 2 steps of 1
    expect(scaleValues()).toEqual(["2", "3", "3"]);
  });
});

// Controls: complete numbers behave as they always did. These pass on the old code and must keep passing.
describe("dragging the Scale label with complete numbers", () => {
  it("control: every box moves by the dragged amount and the engine is told", () => {
    mount({ x: 1, y: 1, z: 1 });
    dragScaleLabel(120);
    expect(scaleValues()).toEqual(["3", "3", "3"]);
    expect(updateSelectedTransform).toHaveBeenLastCalledWith(
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 3, z: 3 },
    );
  });

  it("control: a longer drag is measured from where it started, not stacked on earlier moves", () => {
    mount({ x: 1, y: 1, z: 1 });
    dragScaleLabel(120, 140);
    expect(scaleValues()).toEqual(["5", "5", "5"]);
  });

  it("control: dragging left shrinks the boxes", () => {
    mount({ x: 5, y: 5, z: 5 });
    dragScaleLabel(80);
    expect(scaleValues()).toEqual(["3", "3", "3"]);
  });
});
