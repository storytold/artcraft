import { render, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CommonAspectRatio } from "@storyteller/model-list";
import type { PageDrawAdapter } from "@storyteller/ui-pagedraw";
import PageDraw from "./PageDraw";

const mocks = vi.hoisted(() => ({
  adapter: undefined as PageDrawAdapter | undefined,
  generate: vi.fn(async (_request: { aspect_ratio?: string }) => ({ status: "success" })),
}));
vi.mock("@storyteller/ui-pagedraw", () => ({
  PageDraw: ({ adapter }: { adapter: PageDrawAdapter }) => {
    mocks.adapter = adapter;
    return null;
  },
  useSceneStore: { getState: vi.fn() },
}));
vi.mock("@storyteller/tauri-api", () => ({
  GenerateImage: mocks.generate,
  EnqueueImageBgRemoval: vi.fn(),
  useCanvasBgRemovedEvent: vi.fn(),
}));
vi.mock("@storyteller/tauri-events", () => ({ useTextToImageGenerationCompleteEvent: vi.fn() }));
vi.mock("@storyteller/api", () => ({ UploadImageMedia: vi.fn() }));
vi.mock("./BaseImageSelector", () => ({ BaseImageSelector: () => null }));
afterEach(() => { cleanup(); mocks.generate.mockClear(); });

it.each(["enqueueEditImage", "enqueueInpaint"] as const)(
  "%s sends the resolved source ratio to generation", async (method) => {
    render(<PageDraw />);
    await mocks.adapter![method]({ commonAspectRatio: CommonAspectRatio.TallNineBySixteen });
    expect(mocks.generate).toHaveBeenCalledWith(expect.objectContaining({
      aspect_ratio: CommonAspectRatio.TallNineBySixteen,
    }));
  },
);
it.each(["enqueueEditImage", "enqueueInpaint"] as const)(
  "%s preserves explicit ratios and omits unsupported Auto", async (method) => {
    render(<PageDraw />);
    await mocks.adapter![method]({ aspectRatio: "square" });
    expect(mocks.generate.mock.calls.at(-1)![0]).toMatchObject({ aspect_ratio: CommonAspectRatio.Square });
    await mocks.adapter![method]({});
    expect(mocks.generate.mock.calls.at(-1)![0].aspect_ratio).toBeUndefined();
  },
);
