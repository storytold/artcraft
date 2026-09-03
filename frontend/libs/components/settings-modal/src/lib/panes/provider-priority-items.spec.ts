import { Provider } from "@storyteller/tauri-api";

import { buildProviderPriorityItems } from "./provider-priority-items";

describe("buildProviderPriorityItems", () => {
  it("preserves backend order and appends missing supported providers", () => {
    expect(
      buildProviderPriorityItems([Provider.Sora, Provider.ArtCraft]),
    ).toEqual([
      { id: Provider.Sora, name: "Sora / ChatGPT" },
      { id: Provider.ArtCraft, name: "ArtCraft" },
      { id: Provider.Fal, name: "Fal" },
    ]);
  });

  it("ignores unsupported and duplicate frontend enum variants", () => {
    expect(
      buildProviderPriorityItems([
        Provider.Grok,
        Provider.Fal,
        Provider.Midjourney,
        Provider.Fal,
      ]).map(({ id }) => id),
    ).toEqual([Provider.Fal, Provider.ArtCraft, Provider.Sora]);
  });
});
