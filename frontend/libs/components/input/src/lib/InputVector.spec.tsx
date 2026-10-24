import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";

// Only the enum is needed from the common lib; stand it in so the spec doesn't pull the whole package in.
vi.mock("@storyteller/common", () => ({ DomLevels: { INPUT: 1 } }));

import { InputVector } from "./InputVector";

const onChange = vi.fn();
const disableHotkeyInput = vi.fn();
const enableHotkeyInput = vi.fn();

const mount = (props: { x?: string; y?: string; z?: string; increment?: number } = {}) => {
  const { container } = render(
    <InputVector
      x={props.x ?? "1"}
      y={props.y ?? "2"}
      z={props.z ?? "3"}
      increment={props.increment}
      onChange={onChange}
      disableHotkeyInput={disableHotkeyInput}
      enableHotkeyInput={enableHotkeyInput}
    />,
  );
  return (axis: "x" | "y" | "z") =>
    container.querySelector(`input[name="${axis}"]`) as HTMLInputElement;
};

// Press on a field, then drag the pointer from `from` to `to` (the scrub is driven by document-level mouse events).
const scrub = (input: HTMLInputElement, from: number, to: number) => {
  fireEvent.mouseDown(input, { clientX: from });
  fireEvent.mouseMove(document, { clientX: to });
};

const lastVector = () => onChange.mock.calls[onChange.mock.calls.length - 1][0] as Record<string, string>;

beforeEach(() => onChange.mockReset());
afterEach(() => {
  // Release the drag so the document listeners from one test never leak into the next.
  fireEvent.mouseUp(document);
  cleanup();
});

// The fields are plain text boxes, so the user can leave one empty, or holding only "-" / ".", while typing a new value.
// Dragging that field to scrub it then did `parseFloat("") + step`, which is NaN, and wrote the text "NaN" into the box.
describe("scrubbing a field whose text is not a complete number", () => {
  it("does not write NaN when the field is empty", () => {
    const field = mount({ x: "" });
    scrub(field("x"), 100, 110);
    expect(onChange).toHaveBeenCalled();
    expect(Object.values(lastVector()).join(",")).not.toMatch(/NaN/);
  });

  it("does not write NaN when the field only holds a minus sign", () => {
    const field = mount({ y: "-" });
    scrub(field("y"), 100, 90);
    expect(Object.values(lastVector()).join(",")).not.toMatch(/NaN/);
  });

  it("does not write NaN when the field only holds a decimal point", () => {
    const field = mount({ z: "." });
    scrub(field("z"), 100, 110);
    expect(Object.values(lastVector()).join(",")).not.toMatch(/NaN/);
  });

  it("starts the scrub from zero, and leaves the other two fields alone", () => {
    const field = mount({ x: "", y: "2", z: "3" });
    scrub(field("x"), 100, 110);
    expect(lastVector()).toEqual({ x: "0.1", y: "2", z: "3" });
  });

  it("scrubs a '-' field downwards from zero", () => {
    const field = mount({ x: "-" });
    scrub(field("x"), 100, 90);
    expect(lastVector().x).toBe("-0.1");
  });
});

// Controls: a complete number scrubbed the way it always was. These pass on the old code and must keep passing.
describe("scrubbing a field with a complete number", () => {
  it("control: dragging right adds one step", () => {
    const field = mount({ x: "1" });
    scrub(field("x"), 100, 110);
    expect(lastVector()).toEqual({ x: "1.1", y: "2", z: "3" });
  });

  it("control: dragging left takes one step off", () => {
    const field = mount({ y: "2" });
    scrub(field("y"), 100, 90);
    expect(lastVector()).toEqual({ x: "1", y: "1.9", z: "3" });
  });

  it("control: the sum is rounded so float noise never reaches the box", () => {
    const field = mount({ z: "0.2" });
    scrub(field("z"), 100, 110);
    expect(lastVector().z).toBe("0.3");
  });

  it("control: a custom increment is honoured", () => {
    const field = mount({ x: "1", increment: 5 });
    scrub(field("x"), 100, 110);
    expect(lastVector().x).toBe("6");
  });

  it("control: a negative number scrubs normally", () => {
    const field = mount({ x: "-1.5" });
    scrub(field("x"), 100, 110);
    expect(lastVector().x).toBe("-1.4");
  });

  it("control: typing a value still passes through the validator", () => {
    const field = mount({ x: "1" });
    fireEvent.change(field("x"), { target: { value: "1.25" } });
    expect(lastVector().x).toBe("1.25");
    fireEvent.change(field("x"), { target: { value: "abc" } });
    expect(lastVector().x).toBe("1");
  });

  it("control: releasing the button ends the scrub", () => {
    const field = mount({ x: "1" });
    scrub(field("x"), 100, 110);
    fireEvent.mouseUp(document);
    onChange.mockReset();
    fireEvent.mouseMove(document, { clientX: 130 });
    expect(onChange).not.toHaveBeenCalled();
  });
});
