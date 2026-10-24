import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";

vi.mock("lucide-react", () => ({
  LoaderCircleIcon: () => <span data-testid="loader" />,
}));

import { Gravatar } from "./gravatar";

const img = (container: HTMLElement) =>
  container.querySelector("img") as HTMLImageElement;

describe("Gravatar url changes", () => {
  afterEach(() => cleanup());

  it("follows a new email_hash instead of keeping the first url", () => {
    const { container, rerender } = render(<Gravatar size={32} />);
    expect(img(container).src).toContain("/avatar/undefined");

    rerender(<Gravatar size={32} email_hash="abc123" />);
    expect(img(container).src).toContain("/avatar/abc123");
  });

  it("shows the loader again for a new url and hides it on load", () => {
    const { container, queryByTestId, rerender } = render(
      <Gravatar size={32} email_hash="one" />,
    );
    expect(queryByTestId("loader")).not.toBeNull();
    fireEvent.load(img(container));
    expect(queryByTestId("loader")).toBeNull();

    rerender(<Gravatar size={32} email_hash="two" />);
    expect(queryByTestId("loader")).not.toBeNull();
  });

  it("falls back to the local avatar on error, then retries the remote for a new hash", () => {
    const { container, rerender } = render(
      <Gravatar size={32} email_hash="bad" avatarIndex={3} />,
    );
    fireEvent.error(img(container));
    expect(img(container).src).toContain("/resources/avatars/3.webp");

    rerender(<Gravatar size={32} email_hash="good" avatarIndex={3} />);
    expect(img(container).src).toContain("/avatar/good");
  });
});
