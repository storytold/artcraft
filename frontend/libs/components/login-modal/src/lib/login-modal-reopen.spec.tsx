// Testing-library helpers: `act` runs React updates to completion, `render`/`screen`/`fireEvent` draw and drive the component.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
// The test runner's building blocks and mock helpers.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// The component under test and the shared store that opens and closes it.
import { LoginModal } from "./login-modal";
import { useLoginModalStore } from "./useLoginModalStore";

// B-167: the sign-up flow ends on "Thank you for signing in!". Only the "Get Started" button leaves that screen, and it
// closes the dialog. Some parts of the app open the dialog again WITHOUT asking it to re-check the session first
// (the moodboard library picker's "Log in" button calls `useLoginModalStore.getState().openModal()` directly), so the
// dialog must start from the sign-in form every time it opens, not from where the last visit ended.

// Fakes hoisted above the imports so the `vi.mock` calls below can use them: `native` stands in for Tauri's `invoke`
// (the bridge to Rust); `forbiddenFetch` throws if any code in this library tries to make an HTTP call itself.
const { native, forbiddenFetch } = vi.hoisted(() => ({ native: vi.fn(), forbiddenFetch: vi.fn(() => { throw new Error("Authentication HTTP must run in Rust"); }) }));
// Every Rust command goes through the fake `native`.
vi.mock("@tauri-apps/api/core", () => ({ invoke: native }));
// The login UI must not import the API client library at all.
vi.mock("@storyteller/api", () => { throw new Error("Authentication UI must not import API clients"); });
vi.mock("@storyteller/tauri-utils", () => ({ FetchProxy: forbiddenFetch }));
// The same simplified Transition as the other login-modal specs: show the children while `show` is true, nothing otherwise.
vi.mock("@headlessui/react", () => ({ Transition: ({ show, children }: any) => show ? children : null, TransitionChild: ({ children }: any) => children }));
// Plain stand-ins for the icon, button and input components so the specs depend only on text and roles.
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null, DiscordIcon: () => null }));
vi.mock("@storyteller/ui-button", () => ({ Button: ({ children, variant, icon, iconFlip, ...props }: any) => <button {...props}>{children}</button> }));
vi.mock("@storyteller/ui-input", () => ({ Input: ({ inputClassName, ...props }: any) => <input {...props} /> }));
vi.mock("qrcode.react", () => ({ QRCodeSVG: () => <svg role="img" aria-label="Login QR" /> }));

// The user every fake sign-in or sign-up returns.
const USER = { username: "google_user", user_token: "u_test" };

beforeEach(() => {
  // Fake timers so the 3-second success auto-close and the polling timers never run on their own.
  vi.useFakeTimers();
  vi.stubGlobal("fetch", forbiddenFetch);
  forbiddenFetch.mockClear();
  localStorage.clear();
  // Every test starts with the dialog open and no pending re-check.
  useLoginModalStore.setState({ isOpen: true, recheckTrigger: 0 });
  // The fake Rust side: no saved session, and sign-up/sign-in both succeed.
  native.mockReset().mockImplementation(async (command: string) => {
    if (command === "storyteller_get_login_session_command") return null;
    if (command === "storyteller_password_login_command" || command === "storyteller_password_signup_command") return USER;
    if (command === "storyteller_cancel_login_challenge_command" || command === "plugin:opener|open_url") return;
    throw new Error(`Unexpected command: ${command}`);
  });
});
afterEach(() => {
  // Remove what was drawn, and check nothing in the library tried HTTP or stored a session in the page.
  cleanup();
  expect(forbiddenFetch).not.toHaveBeenCalled();
  expect(localStorage.getItem("artcraft_signed_session")).toBeNull();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// Create an account through the sign-up form so the dialog reaches its "Join our community" (Discord) step.
const signUpToDiscordStep = async () => {
  await act(async () => { render(<LoginModal isSignUp onArtCraftAuthSuccess={vi.fn()} />); });
  fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "native_user" } });
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "user@example.com" } });
  fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: "password123" } });
  fireEvent.change(screen.getByPlaceholderText("Re-enter password"), { target: { value: "password123" } });
  const submit = screen.getAllByRole("button", { name: "Sign up" }).find((button) => button.getAttribute("type") === "submit")!;
  await act(async () => { fireEvent.click(submit); });
};

describe("login modal opened again after the sign-up onboarding (B-167)", () => {
  // Both ways of leaving the Discord step end on the same thank-you screen, so both are checked.
  it.each(["Skip for now", "Join Discord"])("starts from the sign-in form, not the thank-you screen, when reopened after '%s'", async (choice) => {
    await signUpToDiscordStep();
    // The sign-up reached the Discord step, and the chosen button moves on to the thank-you screen.
    expect(screen.getByRole("heading", { name: "Join our community." })).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: choice })); });
    expect(screen.getByText("Thank you for signing in!")).toBeTruthy();
    // "Get Started" is the only way off that screen, and it closes the dialog.
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Get Started" })); });
    expect(useLoginModalStore.getState().isOpen).toBe(false);
    expect(screen.queryByText("Thank you for signing in!")).toBeNull();
    // Reopen the way the moodboard library picker does: straight through the store, with no re-check of the session.
    await act(async () => { useLoginModalStore.getState().openModal(); });
    expect(useLoginModalStore.getState().isOpen).toBe(true);
    // The dialog must offer the form again, not the leftover thank-you (or Discord) screen with no way to sign in.
    expect(screen.queryByText("Thank you for signing in!")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Join our community." })).toBeNull();
    expect(screen.getByPlaceholderText("Min. 8 characters")).toBeTruthy();
  });

  // Controls: these behaviours are expected to hold before and after the fix.
  it("control: shows the sign-in form on a plain first open", async () => {
    await act(async () => { render(<LoginModal isSignUp />); });
    expect(screen.getByText("Create your account")).toBeTruthy();
    expect(screen.getByPlaceholderText("Min. 8 characters")).toBeTruthy();
    expect(screen.queryByText("Thank you for signing in!")).toBeNull();
  });

  it("control: keeps the Discord step on screen for as long as the dialog stays open after sign-up", async () => {
    await signUpToDiscordStep();
    // Nothing closes the dialog here, so the Discord step must not be reset away under the person.
    expect(screen.getByRole("heading", { name: "Join our community." })).toBeTruthy();
    expect(useLoginModalStore.getState().isOpen).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(screen.getByRole("heading", { name: "Join our community." })).toBeTruthy();
  });

  it("control: a close and reopen with no onboarding in between still shows the sign-in form", async () => {
    await act(async () => { render(<LoginModal isSignUp />); });
    await act(async () => { useLoginModalStore.getState().closeModal(); });
    expect(screen.queryByText("Create your account")).toBeNull();
    await act(async () => { useLoginModalStore.getState().openModal(); });
    expect(screen.getByText("Create your account")).toBeTruthy();
    expect(screen.getByPlaceholderText("Min. 8 characters")).toBeTruthy();
  });
});
