import { cleanup, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GenerationProvider } from "@storyteller/api-enums";
import { UploaderStates } from "@storyteller/common";
import { IMAGE_MODELS } from "@storyteller/model-list";
import { GenerateImage } from "@storyteller/tauri-api";
import { setToastDelegate } from "@storyteller/ui-toaster";
import { PromptBoxImage } from "./PromptBoxImage";
import { usePromptImageStore } from "./promptStore";

vi.mock("@storyteller/tauri-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@storyteller/tauri-api")>()),
  GenerateImage: vi.fn(async () => ({ status: "success", payload: {} })),
}));

type UploadImage = NonNullable<ComponentProps<typeof PromptBoxImage>["uploadImage"]>;

const NANO_BANANA_PRO = IMAGE_MODELS.find((m) => m.tauriId === "nano_banana_pro")!;

const PROMPT = "put the dog from the photo on the beach";

const toastError = vi.fn();

beforeEach(() => {
  vi.stubGlobal("gtag", vi.fn());
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
  setToastDelegate({ success: vi.fn(), error: toastError });
  usePromptImageStore.setState({
    prompt: PROMPT,
    referenceImages: [],
    generationCount: 1,
  });
});

afterEach(() => {
  cleanup();
  setToastDelegate(null);
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it.each([GenerationProvider.Artcraft, GenerationProvider.Fal])(
  "sends the attached reference images to %s",
  async (provider) => {
    usePromptImageStore.setState({
      referenceImages: [
        { id: "r1", url: "blob:one", file: new File([], "one.png"), mediaToken: "m_ref_one" },
        { id: "r2", url: "blob:two", file: new File([], "two.png"), mediaToken: "m_ref_two" },
      ],
    });
    const { container } = renderPromptBox({ provider });

    await userEvent.setup().click(generateButton(container));

    await waitFor(() => expect(GenerateImage).toHaveBeenCalledTimes(1));
    expect(sentRequest().provider).toBe(provider);
    expect(sentRequest().image_media_tokens).toEqual(["m_ref_one", "m_ref_two"]);
  },
);

it("holds the request until a reference image has finished uploading", async () => {
  const upload = pendingUpload();
  const { container } = renderPromptBox({ uploadImage: upload.uploadImage });
  const user = userEvent.setup();

  await user.upload(
    container.querySelector<HTMLInputElement>('input[type="file"]')!,
    new File(["png"], "ref.png", { type: "image/png" }),
  );
  await waitFor(() => expect(upload.uploadImage).toHaveBeenCalledTimes(1));

  // The upload hasn't produced a media token yet: nothing may be submitted
  // without the attachment.
  await user.click(generateButton(container));
  expect(GenerateImage).not.toHaveBeenCalled();
  expect(toastError).toHaveBeenCalledWith(expect.stringContaining("finish uploading"));

  upload.finish("m_late_ref");
  await waitFor(() => expect(usePromptImageStore.getState().referenceImages).toHaveLength(1));

  await user.click(generateButton(container));
  await waitFor(() => expect(GenerateImage).toHaveBeenCalledTimes(1));
  expect(sentRequest().image_media_tokens).toEqual(["m_late_ref"]);
});

function renderPromptBox(props: { provider?: GenerationProvider; uploadImage?: UploadImage }) {
  return render(
    <PromptBoxImage
      useJobContext={() => ({
        jobTokens: [],
        addJobToken: () => {},
        removeJobToken: () => {},
        clearJobTokens: () => {},
      })}
      selectedModel={NANO_BANANA_PRO}
      selectedProvider={props.provider ?? GenerationProvider.Artcraft}
      uploadImage={props.uploadImage}
    />,
  );
}

function generateButton(container: HTMLElement) {
  return container.querySelector<HTMLButtonElement>("button.rounded-full.bg-primary")!;
}

function sentRequest() {
  return vi.mocked(GenerateImage).mock.calls[0]![0];
}

// An upload that stays in flight until the test calls `finish`.
function pendingUpload() {
  let finish: (mediaToken: string) => void = () => {};
  const uploadImage = vi.fn<UploadImage>(
    ({ progressCallback }) =>
      new Promise<void>((resolve) => {
        finish = (mediaToken) => {
          progressCallback({ status: UploaderStates.success, data: mediaToken });
          resolve();
        };
      }),
  );
  return { uploadImage, finish: (mediaToken: string) => finish(mediaToken) };
}
