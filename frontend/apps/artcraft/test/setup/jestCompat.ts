import { expect, vi } from "vitest";

// The ApiManager suites were written against jest (`jest.spyOn`, `jest.clearAllMocks`).
// vitest's `vi` has the same API for those calls, so alias it instead of rewriting 17 files.
(globalThis as unknown as { jest: typeof vi }).jest = vi;

// jsdom ships no canvas. Importing app code transitively loads three.js addons (lottie_canvas)
// that call `canvas.getContext("2d")` and assign to the result at module load. Hand back a
// permissive no-op context so those imports succeed; no test here draws anything.
const noopContext = new Proxy({} as Record<string, unknown>, {
  get: (target, key) => (key in target ? target[key as string] : () => noopContext),
  set: (target, key, value) => {
    target[key as string] = value;
    return true;
  },
});
HTMLCanvasElement.prototype.getContext = (() => noopContext) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// ApiManager resolves its base URL from StorytellerApiHostStore (default: production). The suites
// under test/ assert on `http://localhost:3000/...` URLs, so point the singleton there.
// Scoped to test/ on purpose: the app/src specs `vi.mock("@storyteller/api")` themselves, and
// importing the real module here (before their mocks register) would defeat those mocks.
if (expect.getState().testPath?.includes("/test/")) {
  const { StorytellerApiHostStore } = await import("@storyteller/api");
  StorytellerApiHostStore.getInstance().setApiSchemeAndHost("http://localhost:3000");
}
