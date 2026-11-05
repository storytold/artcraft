import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A fake editor with just what the toolbar's timecode and play button read. vi.hoisted lets the vi.mock
// factory below see it (vi.mock calls are lifted above the imports).
const m = vi.hoisted(() => ({
  editor: {
    playback: {
      getCurrentTime: () => 0,
      onUpdate: () => () => undefined,
      onSeek: () => () => undefined,
      getIsPlaying: () => false,
      seek: () => undefined,
    },
    timeline: { getTotalDuration: () => 0 },
    project: { getActive: () => ({ settings: { fps: 30 } }) },
  },
}));

// useEditor() returns the editor; useEditor(selector) returns selector(editor).
vi.mock("../../editor/use-editor", () => ({
  useEditor: (selector?: (e: typeof m.editor) => unknown) =>
    selector ? selector(m.editor) : m.editor,
}));
// The wasm timecode formatter is not loadable in jsdom.
vi.mock("opencut-wasm", () => ({ formatTimecode: () => "00:00:00:00" }));
// Actions are not under test: keep the real module (other files import more than invokeAction from it) and
// replace only invokeAction, which the play button calls. The editable timecode box is not under test either.
vi.mock("../../actions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../actions")>()),
  invokeAction: vi.fn(),
}));
vi.mock("../../components/editable-timecode", () => ({
  EditableTimecode: () => <span>timecode</span>,
}));
// The viewport hook is a context in the real panel; the toolbar's zoom picker and the menu's "Fit to screen"
// only need these fields.
vi.mock("./preview-viewport", () => ({
  usePreviewViewport: () => ({
    isAtFit: true,
    zoomPercent: 100,
    fitToScreen: vi.fn(),
    setViewportPercent: vi.fn(),
  }),
}));
// The context menu reads the host's toast adapter from the editor provider.
vi.mock("../../EditorProvider", () => ({
  useEditorAdapters: () => ({ toast: { error: vi.fn() } }),
}));

import {
  ContextMenu,
  ContextMenuTrigger,
} from "../../components/ui/context-menu";
import { PreviewContextMenu } from "./context-menu";
import { PreviewToolbar } from "./toolbar";

// jsdom has no ResizeObserver (Radix menus and selects measure with one).
class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// When the webview cannot do full screen, the panel passes NO handler. The controls must then not be drawn,
// otherwise they are dead buttons. Before the change the handler was required and always drawn.
describe("Full screen toolbar button", () => {
  it("is left out when full screen is unavailable", () => {
    render(<PreviewToolbar onToggleFullscreen={undefined} />);

    // Only the play / pause button is left (the zoom picker is a combobox, not a button).
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("is drawn and calls the handler when full screen is available", () => {
    const onToggleFullscreen = vi.fn();
    render(<PreviewToolbar onToggleFullscreen={onToggleFullscreen} />);

    // Play / pause plus the full screen button, in that order.
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[1]);

    expect(onToggleFullscreen).toHaveBeenCalledTimes(1);
  });
});

describe("Full screen context-menu item", () => {
  // Opens the preview's right-click menu on a stand-in preview area and returns once its content is mounted.
  const openMenu = (onToggleFullscreen: (() => void) | undefined) => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>
          <div data-testid="preview-area">preview</div>
        </ContextMenuTrigger>
        <PreviewContextMenu
          onToggleFullscreen={onToggleFullscreen}
          container={null}
          overlayControls={[]}
          onOverlayVisibilityChange={vi.fn()}
        />
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByTestId("preview-area"));
  };

  it("is left out when full screen is unavailable", () => {
    openMenu(undefined);

    // The menu did open (its other items are there) ...
    expect(screen.getByText("Fit to screen")).toBeTruthy();
    expect(screen.getByText("Save snapshot")).toBeTruthy();
    // ... but has no Full screen entry.
    expect(screen.queryByText("Full screen")).toBeNull();
  });

  it("is shown and calls the handler when full screen is available", () => {
    const onToggleFullscreen = vi.fn();
    openMenu(onToggleFullscreen);

    fireEvent.click(screen.getByText("Full screen"));

    expect(onToggleFullscreen).toHaveBeenCalledTimes(1);
  });
});
