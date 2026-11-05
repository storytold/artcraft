import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LightboxModal from "./lightbox-modal";

vi.mock("embla-carousel-react", () => ({
  default: () => [vi.fn(), null],
}));

describe("LightboxModal", () => {
  it("should render successfully", () => {
    const { baseElement } = render(
      <LightboxModal isOpen={false} onClose={() => {}} onCloseGallery={() => {}} />,
    );
    expect(baseElement).toBeTruthy();
  });

  it("opens the configured downloads folder from the media actions", async () => {
    const onOpenDownloadsFolder = vi.fn(async () => {});
    render(
      <LightboxModal
        isOpen
        onClose={() => {}}
        onCloseGallery={() => {}}
        imageUrl="data:image/png;base64,"
        onOpenDownloadsFolder={onOpenDownloadsFolder}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open downloads folder" }));
    await waitFor(() => expect(onOpenDownloadsFolder).toHaveBeenCalledOnce());
  });
});
