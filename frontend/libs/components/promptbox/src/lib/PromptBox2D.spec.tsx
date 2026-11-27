import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { buildImageModelsFromListing } from "@storyteller/model-list";
import { PromptBox2D } from "./PromptBox2D";
import { usePrompt2DStore } from "./promptStore";

const PROMPT = "make the sky stormy";

const [MODEL] = buildImageModelsFromListing([], [
  {
    model: "nano_banana_pro",
    aspect_ratio_options: ["auto", "square", "wide_sixteen_by_nine"],
  },
]);

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    disconnect() {}
    unobserve() {}
  });
  // jsdom has no layout; give popovers a visible rect.
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    new DOMRect(100, 100, 280, 40),
  );
  usePrompt2DStore.setState(usePrompt2DStore.getInitialState(), true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("keeps the base image's aspect ratio unless the user picks another", async () => {
  const { user, generate } = await renderPromptBox();

  await user.type(screen.getByPlaceholderText("Describe your image..."), PROMPT);
  await user.click(screen.getByRole("button", { name: /Generate/ }));

  await waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
  expect(generate).toHaveBeenCalledWith(
    PROMPT,
    expect.objectContaining({ aspectRatio: "auto" }),
  );
});

it("offers auto next to wide, tall and square", async () => {
  const { user } = await renderPromptBox();

  await user.click(aspectRatioButton("Auto"));

  for (const label of ["Auto", "Wide", "Tall", "Square"]) {
    expect(await screen.findAllByText(label)).not.toHaveLength(0);
  }
});

it.each([
  ["Wide", "wide"],
  ["Tall", "tall"],
  ["Square", "square"],
])("sends %s once picked, and auto again when switched back", async (label, expected) => {
  const { user, generate } = await renderPromptBox();
  await user.type(screen.getByPlaceholderText("Describe your image..."), PROMPT);

  await user.click(aspectRatioButton("Auto"));
  await user.click(await screen.findByRole("button", { name: label }));
  await user.click(screen.getByRole("button", { name: /Generate/ }));
  await waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
  expect(generate).toHaveBeenLastCalledWith(
    PROMPT,
    expect.objectContaining({ aspectRatio: expected }),
  );

  await user.click(aspectRatioButton(label));
  await user.click(await screen.findByRole("button", { name: "Auto" }));
  await user.click(screen.getByRole("button", { name: /Generate/ }));
  await waitFor(() => expect(generate).toHaveBeenCalledTimes(2));
  expect(generate).toHaveBeenLastCalledWith(
    PROMPT,
    expect.objectContaining({ aspectRatio: "auto" }),
  );
});

async function renderPromptBox() {
  const user = userEvent.setup();
  const generate = vi.fn();
  render(
    <PromptBox2D
      usePrompt2DStore={usePrompt2DStore}
      selectedImageModel={MODEL}
      EncodeImageBitmapToBase64={async () => ""}
      onGenerateClick={generate}
    />,
  );
  return { user, generate };
}

// The picker's trigger shows the selected ratio's name, as does that ratio's
// row in the open menu. Only the trigger reports whether the menu is expanded.
function aspectRatioButton(name: string) {
  return screen.getByRole("button", { name, expanded: false });
}
