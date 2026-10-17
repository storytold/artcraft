import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CreditsModal } from "./credits-modal";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({ invoke: mocks.invoke }));
vi.mock("@storyteller/ui-modal", () => ({
  Modal: ({ isOpen, children }: any) => (isOpen ? <div>{children}</div> : null),
}));

// Fails the test if a handler lets a rejection escape unhandled.
const unhandled = vi.fn();

// Lets a would-be unhandled rejection be reported before asserting on it.
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

beforeEach(() => {
  mocks.invoke.mockReset();
  unhandled.mockReset();
  process.on("unhandledRejection", unhandled);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  process.off("unhandledRejection", unhandled);
  cleanup();
  vi.restoreAllMocks();
});

it("opens checkout for the chosen pack", async () => {
  const user = userEvent.setup();
  mocks.invoke.mockResolvedValue(undefined);
  render(<CreditsModal isOpen />);

  // The 5,000 pack carries a "Popular" badge, so its name does not start with the amount.
  await user.click(screen.getByRole("button", { name: /5,000/ }));

  await waitFor(() =>
    expect(mocks.invoke).toHaveBeenCalledWith(
      "storyteller_open_credits_purchase_command",
      { request: { credits_pack: "artcraft_5000" } },
    ),
  );
  expect(screen.queryByRole("alert")).toBeNull();
});

it("shows an error and re-enables the packs when opening checkout fails", async () => {
  const user = userEvent.setup();
  mocks.invoke.mockRejectedValue(new Error("not signed in"));
  render(<CreditsModal isOpen />);

  await user.click(screen.getByRole("button", { name: /^1,000/ }));

  expect((await screen.findByRole("alert")).textContent).toBe(
    "Could not open checkout. Please try again.",
  );
  await settle();
  expect(unhandled).not.toHaveBeenCalled();
  for (const button of screen.getAllByRole("button")) {
    expect(button.hasAttribute("disabled")).toBe(false);
  }
});

it("clears the previous error when the next attempt succeeds", async () => {
  const user = userEvent.setup();
  mocks.invoke
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(undefined);
  render(<CreditsModal isOpen />);

  await user.click(screen.getByRole("button", { name: /^1,000/ }));
  await screen.findByRole("alert");
  await user.click(screen.getByRole("button", { name: /^1,000/ }));

  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  expect(mocks.invoke).toHaveBeenCalledTimes(2);
});
