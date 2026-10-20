// Testing-library helpers: `render` draws the component, `rerender` redraws it with new props, `screen` finds things on screen.
import { cleanup, render, screen, waitFor } from "@testing-library/react";
// Simulates a real person's clicks and typing more faithfully than raw events.
import userEvent from "@testing-library/user-event";
// The test runner's building blocks and mock helpers.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// The component under test.
import { CreditsModal } from "./credits-modal";

// B-168: "Buy credits" keeps its "Could not open checkout. Please try again." line in the component's own state. The app draws
// this dialog once for the whole session (`MainApp.tsx`) and only flips `isOpen`, so closing the dialog does not clear that
// state: the next opening must not start with the complaint about an attempt from the previous visit.

// `invoke` stands in for Tauri's bridge to Rust (the "open the checkout page" command).
const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: mocks.invoke }));
// The same simplified Modal as the other credits-modal spec: shows its children while `isOpen` is true, nothing otherwise.
vi.mock("@storyteller/ui-modal", () => ({
  Modal: ({ isOpen, children }: any) => (isOpen ? <div>{children}</div> : null),
}));

beforeEach(() => {
  mocks.invoke.mockReset();
  // A failed purchase logs to the console; keep the test output clean.
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("buy-credits dialog opened again after a failed checkout launch (B-168)", () => {
  it("does not show the old checkout error when it is reopened", async () => {
    const user = userEvent.setup();
    mocks.invoke.mockRejectedValue(new Error("not signed in"));
    const { rerender } = render(<CreditsModal isOpen />);
    // First visit: pick a pack, the launch fails, the complaint is shown.
    await user.click(screen.getByRole("button", { name: /^1,000/ }));
    expect((await screen.findByRole("alert")).textContent).toBe("Could not open checkout. Please try again.");
    // The person closes the dialog (the app flips `isOpen`; the component itself stays mounted).
    rerender(<CreditsModal isOpen={false} />);
    expect(screen.queryByRole("alert")).toBeNull();
    // Second visit, no purchase attempted yet: the dialog must start clean.
    rerender(<CreditsModal isOpen />);
    expect(screen.queryByRole("alert")).toBeNull();
    // The packs are on screen and usable again.
    expect(screen.getByRole("button", { name: /^1,000/ }).hasAttribute("disabled")).toBe(false);
  });

  it("does not show an error that arrived while the dialog was closed", async () => {
    const user = userEvent.setup();
    // The launch is still pending when the person closes the dialog, and fails afterwards.
    let rejectLaunch: (reason: unknown) => void = () => {};
    mocks.invoke.mockReturnValue(new Promise((_resolve, reject) => { rejectLaunch = reject; }));
    const { rerender } = render(<CreditsModal isOpen />);
    await user.click(screen.getByRole("button", { name: /^1,000/ }));
    rerender(<CreditsModal isOpen={false} />);
    rejectLaunch(new Error("offline"));
    // Give the failed launch time to be handled while the dialog is closed.
    await new Promise((resolve) => setTimeout(resolve, 20));
    rerender(<CreditsModal isOpen />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  // Controls: these behaviours are expected to hold before and after the fix.
  it("control: the error stays on screen for as long as the dialog stays open", async () => {
    const user = userEvent.setup();
    mocks.invoke.mockRejectedValue(new Error("offline"));
    render(<CreditsModal isOpen />);
    await user.click(screen.getByRole("button", { name: /^1,000/ }));
    expect((await screen.findByRole("alert")).textContent).toBe("Could not open checkout. Please try again.");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("control: a new failure after a reopen shows the error again", async () => {
    const user = userEvent.setup();
    mocks.invoke.mockRejectedValue(new Error("offline"));
    const { rerender } = render(<CreditsModal isOpen />);
    await user.click(screen.getByRole("button", { name: /^1,000/ }));
    await screen.findByRole("alert");
    rerender(<CreditsModal isOpen={false} />);
    rerender(<CreditsModal isOpen />);
    await user.click(screen.getByRole("button", { name: /^1,000/ }));
    expect((await screen.findByRole("alert")).textContent).toBe("Could not open checkout. Please try again.");
  });

  it("control: a reopen after a successful launch shows no error", async () => {
    const user = userEvent.setup();
    mocks.invoke.mockResolvedValue(undefined);
    const { rerender } = render(<CreditsModal isOpen />);
    await user.click(screen.getByRole("button", { name: /^1,000/ }));
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(1));
    rerender(<CreditsModal isOpen={false} />);
    rerender(<CreditsModal isOpen />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
