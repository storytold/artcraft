import { ViewportController } from "./ViewportController";

describe("ViewportController", () => {
  it("stops observing the container on dispose", () => {
    const observers = stubResizeObserver();
    const renderScene = vi.fn();
    const viewport = new ViewportController({
      getCamera: () => null,
      getRenderCamera: () => null,
      getRenderer: () => ({ setSize: vi.fn(), setPixelRatio: vi.fn() }) as never,
      getRenderAspectRatio: () => 1,
      resizePostProcessing: vi.fn(),
      renderScene,
    });
    viewport.container = document.createElement("div");

    viewport.setupResizeObserver();
    viewport.dispose();

    expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
  });
});

// jsdom has no ResizeObserver; record each one the controller creates.
function stubResizeObserver() {
  const observers: Array<{ disconnect: ReturnType<typeof vi.fn> }> = [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      disconnect = vi.fn();
      constructor() {
        observers.push(this);
      }
      observe() {}
    },
  );
  return observers;
}
