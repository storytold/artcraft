import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NumberField } from "./number-field";

const ORIGINAL_POINTER_LOCK_ELEMENT = Object.getOwnPropertyDescriptor(document, "pointerLockElement");
const ORIGINAL_EXIT_POINTER_LOCK = Object.getOwnPropertyDescriptor(document, "exitPointerLock");
const ORIGINAL_REQUEST_POINTER_LOCK = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "requestPointerLock");
const ORIGINAL_ACT_ENVIRONMENT = Object.getOwnPropertyDescriptor(globalThis, "IS_REACT_ACT_ENVIRONMENT");

const mounted: Array<{ root: Root; node: HTMLDivElement }> = [];
let pointerLockOwner: Element | null;
let exitPointerLock: ReturnType<typeof vi.fn>;

vi.mock("../../utils/ui", () => ({ cn: (...values: unknown[]) => values.filter(Boolean).join(" ") }));
vi.mock("./button", () => ({ Button: () => null }));

beforeEach(() => {
  pointerLockOwner = null;
  exitPointerLock = vi.fn(() => { pointerLockOwner = null; });
  Object.defineProperty(document, "pointerLockElement", { configurable: true, get: () => pointerLockOwner });
  Object.defineProperty(document, "exitPointerLock", { configurable: true, value: exitPointerLock });
  Object.defineProperty(HTMLElement.prototype, "requestPointerLock", { configurable: true, value: function () { pointerLockOwner = this; } });
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  for (const fixture of mounted.splice(0)) {
    act(() => fixture.root.unmount());
    fixture.node.remove();
  }
  // Also release a leaked baseline session, so it cannot contaminate another test.
  document.dispatchEvent(new MouseEvent("pointerup"));
  restoreDescriptor(document, "pointerLockElement", ORIGINAL_POINTER_LOCK_ELEMENT);
  restoreDescriptor(document, "exitPointerLock", ORIGINAL_EXIT_POINTER_LOCK);
  restoreDescriptor(HTMLElement.prototype, "requestPointerLock", ORIGINAL_REQUEST_POINTER_LOCK);
  restoreDescriptor(globalThis, "IS_REACT_ACT_ENVIRONMENT", ORIGINAL_ACT_ENVIRONMENT);
  vi.restoreAllMocks();
});

it("stops property previews and releases its pointer lock when the field disappears", () => {
  const fixture = mountField();
  fixture.start();
  move(0);
  move(3);
  expect(fixture.values).toEqual([13]);
  act(() => fixture.root.unmount());
  const lockAfterUnmount = pointerLockOwner;
  move(7);
  expect(fixture.values).toEqual([13]);
  expect(lockAfterUnmount).toBeNull();
  expect(fixture.commits).not.toHaveBeenCalled();
});

it("ends the scrub once when Escape releases pointer lock", () => {
  const fixture = mountField();
  fixture.start();
  move(0);
  move(3);
  pointerLockOwner = null;
  act(() => document.dispatchEvent(new Event("pointerlockchange")));
  move(7);
  act(() => document.dispatchEvent(new MouseEvent("pointerup")));
  expect(fixture.values).toEqual([13]);
  expect(fixture.commits).toHaveBeenCalledTimes(1);
});

it("ends the scrub when the window loses focus before pointerup", () => {
  const fixture = mountField();
  fixture.start();
  move(0);
  move(3);
  act(() => window.dispatchEvent(new Event("blur")));
  move(7);
  expect(fixture.values).toEqual([13]);
  expect(fixture.commits).toHaveBeenCalledTimes(1);
  expect(pointerLockOwner).toBeNull();
});

it("does not release a different control's pointer lock when the field disappears", () => {
  const fixture = mountField();
  fixture.start();
  const otherOwner = document.createElement("button");
  pointerLockOwner = otherOwner;
  act(() => fixture.root.unmount());
  act(() => document.dispatchEvent(new MouseEvent("pointerup")));
  expect(exitPointerLock).not.toHaveBeenCalled();
  expect(pointerLockOwner).toBe(otherOwner);
});

it("keeps ordinary scrubbing and commits exactly once on pointerup", () => {
  const fixture = mountField();
  fixture.start();
  move(99); // Ignore the first pointer-lock warp delta, as in the live field.
  move(3);
  move(-1);
  act(() => document.dispatchEvent(new MouseEvent("pointerup")));
  move(100);
  expect(fixture.values).toEqual([13, 12]);
  expect(fixture.commits).toHaveBeenCalledTimes(1);
  expect(pointerLockOwner).toBeNull();
});

it("keeps disabled and non-primary pointer actions inert", () => {
  const fixture = mountField(true);
  fixture.start();
  move(0);
  move(3);
  expect(fixture.values).toEqual([]);
  expect(fixture.commits).not.toHaveBeenCalled();
  expect(pointerLockOwner).toBeNull();
  const enabled = mountField();
  enabled.start(1);
  move(0);
  move(3);
  expect(enabled.values).toEqual([]);
  expect(enabled.commits).not.toHaveBeenCalled();
});

function mountField(disabled = false) {
  const node = document.createElement("div");
  document.body.append(node);
  const root = createRoot(node);
  const values: number[] = [];
  const commits = vi.fn();
  act(() => root.render(<NumberField icon="X" value="10" disabled={disabled} onScrub={(value) => values.push(value)} onScrubEnd={commits} onChange={() => {}} />));
  mounted.push({ root, node });
  return { root, values, commits, start(button = 0) {
    act(() => node.querySelector("button")!.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button })));
  } };
}

function move(movementX: number) {
  const event = new MouseEvent("pointermove", { bubbles: true });
  Object.defineProperty(event, "movementX", { value: movementX });
  act(() => document.dispatchEvent(event));
}

function restoreDescriptor(target: object, name: string, descriptor: PropertyDescriptor | undefined) {
  if (descriptor) Object.defineProperty(target, name, descriptor);
  else Reflect.deleteProperty(target, name);
}
