import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

const m = vi.hoisted(() => ({
  addLinkItem: vi.fn(),
  addImageItem: vi.fn(),
  addVideoItem: vi.fn(),
  measureImage: vi.fn(),
  measureVideo: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({ default: vi.fn() }));
vi.mock("./BoardLibraryStore", () => ({
  useBoardLibraryStore: {
    getState: () => ({
      ensureActiveBoard: () => "b1",
      addLinkItem: m.addLinkItem,
      addImageItem: m.addImageItem,
      addVideoItem: m.addVideoItem,
    }),
  },
}));
vi.mock("./measureMedia", () => ({
  measureImage: m.measureImage,
  measureVideo: m.measureVideo,
}));

import { isTextEntryTarget, useBoardItemEntry } from "./useBoardItemEntry";

// Captures the props the hook hands to the adapter's library picker.
type PickerProps = {
  open: boolean;
  onClose: () => void;
  onPick: (items: unknown[]) => void;
};
let pickerProps: PickerProps | undefined;
const adapter = {
  renderLibraryPicker: (props: PickerProps) => {
    pickerProps = props;
    return null;
  },
} as never;

beforeEach(() => {
  pickerProps = undefined;
  Object.values(m).forEach((fn) => fn.mockReset());
});
afterEach(() => cleanup());

// Dispatches a URL paste from `target` (bubbles up to window).
const pasteUrlFrom = (target: HTMLElement) => {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: { items: [], getData: () => "https://example.com/x" },
  });
  target.dispatchEvent(event);
  return event;
};

describe("useBoardItemEntry paste handler", () => {
  const mount = () => {
    renderHook(() => useBoardItemEntry(adapter, true));
  };

  it("adds a link for a URL pasted on a non-editable target", () => {
    mount();
    const div = document.body.appendChild(document.createElement("div"));
    const event = pasteUrlFrom(div);
    expect(m.addLinkItem).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    div.remove();
  });

  it.each(["input", "textarea"])("ignores paste into a %s", (tag) => {
    mount();
    const el = document.body.appendChild(document.createElement(tag));
    const event = pasteUrlFrom(el);
    expect(m.addLinkItem).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    el.remove();
  });

  it("ignores paste into a contenteditable element and its children", () => {
    mount();
    const host = document.body.appendChild(document.createElement("div"));
    host.setAttribute("contenteditable", "true");
    const child = host.appendChild(document.createElement("span"));
    const event = pasteUrlFrom(child);
    expect(m.addLinkItem).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    host.remove();
  });
});

describe("isTextEntryTarget", () => {
  it("treats contenteditable=false as not editable", () => {
    const el = document.createElement("div");
    el.setAttribute("contenteditable", "false");
    expect(isTextEntryTarget(el)).toBe(false);
  });
});

describe("useBoardItemEntry handlePicked", () => {
  const openPicker = () => {
    const hook = renderHook(() => useBoardItemEntry(adapter, false));
    act(() => hook.result.current.triggerGallery());
    expect(pickerProps?.open).toBe(true);
    return hook;
  };

  it("closes the picker after a successful pick", async () => {
    m.measureImage.mockResolvedValue({ w: 10, h: 20 });
    openPicker();
    await act(async () => {
      pickerProps!.onPick([{ url: "u1", kind: "image", mediaToken: "t1" }]);
    });
    expect(m.addImageItem).toHaveBeenCalledTimes(1);
    expect(pickerProps?.open).toBe(false);
  });

  it("closes the picker even when measuring the picked media throws", async () => {
    m.measureImage.mockRejectedValue(new Error("boom"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    openPicker();
    await act(async () => {
      pickerProps!.onPick([{ url: "u1", kind: "image", mediaToken: "t1" }]);
    });
    expect(m.addImageItem).not.toHaveBeenCalled();
    expect(pickerProps?.open).toBe(false);
    errSpy.mockRestore();
  });
});
