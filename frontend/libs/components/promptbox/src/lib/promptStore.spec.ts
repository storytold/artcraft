import { afterEach, expect, it } from "vitest";
import { usePromptImageStore } from "./promptStore";

const STORAGE_KEY = "artcraft-image-generation-count";

afterEach(() => {
  localStorage.clear();
  usePromptImageStore.setState({ prompt: "", generationCount: 1 });
});

it("persists only the image generation count", () => {
  const { setPrompt, setGenerationCount } = usePromptImageStore.getState();
  setPrompt("a cat");
  setGenerationCount(2);

  const raw = localStorage.getItem(STORAGE_KEY);
  expect(raw).not.toBeNull();
  expect(JSON.parse(raw!).state).toEqual({ generationCount: 2 });
});

it("restores the image generation count on rehydrate", async () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    state: { generationCount: 3 },
    version: 0,
  }));

  await usePromptImageStore.persist.rehydrate();

  expect(usePromptImageStore.getState().generationCount).toBe(3);
});
