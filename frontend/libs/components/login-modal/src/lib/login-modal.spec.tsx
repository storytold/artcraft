import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginModal } from "./login-modal";
import { useLoginModalStore } from "./useLoginModalStore";

const { native, forbiddenFetch } = vi.hoisted(() => ({ native: vi.fn(), forbiddenFetch: vi.fn(() => { throw new Error("Authentication HTTP must run in Rust"); }) }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: native }));
vi.mock("@storyteller/api", () => { throw new Error("Authentication UI must not import API clients"); });
vi.mock("@storyteller/tauri-utils", () => ({ FetchProxy: forbiddenFetch }));
vi.mock("@headlessui/react", () => ({ Transition: ({ show, children }: any) => show ? children : null, TransitionChild: ({ children }: any) => children }));
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null, DiscordIcon: () => null }));
vi.mock("@storyteller/ui-button", () => ({ Button: ({ children, variant, icon, iconFlip, ...props }: any) => <button {...props}>{children}</button> }));
vi.mock("@storyteller/ui-input", () => ({ Input: ({ inputClassName, ...props }: any) => <input {...props} /> }));
vi.mock("qrcode.react", () => ({ QRCodeSVG: () => <svg role="img" aria-label="Login QR" /> }));

const USER = { username: "google_user", user_token: "u_test" };

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", forbiddenFetch);
  forbiddenFetch.mockClear();
  localStorage.clear();
  useLoginModalStore.setState({ isOpen: true, recheckTrigger: 0 });
  native.mockReset().mockImplementation(async (command: string) => {
    if (command === "storyteller_get_login_session_command") return null;
    if (command === "storyteller_create_login_challenge_command") return {
      challenge_id: "native_handle", verification_url: `https://app.getartcraft.com/login/desktop#approval_token=${"A".repeat(43)}`,
      confirmation_code: "WDJBMJHT", expires_at: new Date(Date.now() + 1_200_000).toISOString(), poll_interval_seconds: 5,
    };
    if (command === "storyteller_poll_login_challenge_command") return { status: "redeemed", maybe_user: USER };
    if (command === "storyteller_password_login_command" || command === "storyteller_password_signup_command") return USER;
    if (command === "storyteller_cancel_login_challenge_command" || command === "plugin:opener|open_url") return;
    throw new Error(`Unexpected command: ${command}`);
  });
});
afterEach(() => {
  cleanup();
  expect(forbiddenFetch).not.toHaveBeenCalled();
  expect(localStorage.getItem("artcraft_signed_session")).toBeNull();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("native login modal integration", () => {
  it("shows website and QR login only on the login screen", async () => {
    await act(async () => { render(<LoginModal />); });
    expect(screen.getByText("Create your account")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Login with Website" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Scan to Login" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByRole("button", { name: "Login with Website" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Scan to Login" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(screen.queryByRole("button", { name: "Login with Website" })).toBeNull();
  });

  it.each(["Login with Website", "Scan to Login"])("hides password login during %s and restores it with Back", async (label) => {
    const success = vi.fn();
    await act(async () => { render(<LoginModal isSignUp={false} onArtCraftAuthSuccess={success} />); });
    expect(screen.getByPlaceholderText("you@example.com or username")).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: label })); });
    expect(screen.getByRole("img", { name: "Login QR" })).toBeTruthy();
    expect(screen.queryByPlaceholderText("you@example.com or username")).toBeNull();
    expect(screen.queryByPlaceholderText("Min. 8 characters")).toBeNull();
    expect(screen.queryByRole("button", { name: "Sign up" })).toBeNull();

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Back" })); });
    expect(screen.getByPlaceholderText("you@example.com or username")).toBeTruthy();
    expect(screen.getByPlaceholderText("Min. 8 characters")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Login with Website" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Scan to Login" })).toBeTruthy();
    expect(screen.queryByRole("img", { name: "Login QR" })).toBeNull();
    expect(native).toHaveBeenCalledWith("storyteller_cancel_login_challenge_command", { challengeId: "native_handle" });
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(native.mock.calls.filter(([command]) => command === "storyteller_poll_login_challenge_command")).toHaveLength(0);
    expect(success).not.toHaveBeenCalled();
  });

  it("hides password login while preparing a challenge and cancels a late creation after Back", async () => {
    let resolve: (value: unknown) => void = () => {};
    await act(async () => { render(<LoginModal isSignUp={false} />); });
    native.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Login with Website" })); });
    expect(screen.getByText("Preparing login…")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Min. 8 characters")).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Back" })); });
    await act(async () => { resolve({ challenge_id: "late_handle" }); });
    expect(screen.getByPlaceholderText("Min. 8 characters")).toBeTruthy();
    expect(screen.queryByRole("img", { name: "Login QR" })).toBeNull();
    expect(native).toHaveBeenCalledWith("storyteller_cancel_login_challenge_command", { challengeId: "late_handle" });
    expect(native.mock.calls.filter(([command]) => command === "plugin:opener|open_url")).toHaveLength(0);
  });

  it.each([true, false])("keeps the completed native login when a stale session check resolves (before completion: %s)", async (beforeCompletion) => {
    let resolveSession: (value: unknown) => void = () => {};
    native.mockImplementationOnce(() => new Promise((resolve) => { resolveSession = resolve; }));
    const success = vi.fn();
    await act(async () => { render(<LoginModal isSignUp={false} onArtCraftAuthSuccess={success} />); });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Scan to Login" })); });
    if (beforeCompletion) await act(async () => { resolveSession(null); });
    expect(screen.getByRole("img", { name: "Login QR" })).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(success).toHaveBeenCalledExactlyOnceWith(USER);
    if (!beforeCompletion) await act(async () => { resolveSession(null); });
    expect(screen.getByRole("heading", { name: "Logged in as google_user" })).toBeTruthy();
    expect(screen.queryByRole("img", { name: "Login QR" })).toBeNull();
    expect(useLoginModalStore.getState().isOpen).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(2999); });
    expect(screen.getByRole("heading", { name: "Logged in as google_user" })).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(useLoginModalStore.getState().isOpen).toBe(false);
    expect(screen.queryByRole("heading", { name: "Logged in as google_user" })).toBeNull();
    expect(screen.queryByText("Create your account")).toBeNull();
    expect(native).toHaveBeenCalledWith("storyteller_poll_login_challenge_command", { challengeId: "native_handle" });
  });

  it.each([false, true])("submits password authentication only through Rust (signup: %s)", async (signup) => {
    const success = vi.fn();
    await act(async () => { render(<LoginModal isSignUp={signup} onArtCraftAuthSuccess={success} />); });
    if (signup) {
      fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "native_user" } });
      fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "user@example.com" } });
      fireEvent.change(screen.getByPlaceholderText("Re-enter password"), { target: { value: "password123" } });
    } else {
      fireEvent.change(screen.getByPlaceholderText("you@example.com or username"), { target: { value: "native_user" } });
    }
    fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: "password123" } });
    const submit = screen.getAllByRole("button", { name: signup ? "Sign up" : "Log in" }).find((button) => button.getAttribute("type") === "submit")!;
    await act(async () => { fireEvent.click(submit); });
    expect(success).toHaveBeenCalledExactlyOnceWith(USER);
    expect(native).toHaveBeenCalledWith(signup ? "storyteller_password_signup_command" : "storyteller_password_login_command", {
      request: signup ? { username: "native_user", email_address: "user@example.com", password: "password123", password_confirmation: "password123", signup_source: "artcraft" } : { username_or_email: "native_user", password: "password123" },
    });
    if (!signup) {
      expect(screen.getByRole("heading", { name: "Logged in as google_user" })).toBeTruthy();
      expect(screen.queryByText("Join Our Community")).toBeNull();
      await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
      expect(useLoginModalStore.getState().isOpen).toBe(false);
    }
  });

  it("dismisses the confirmation once even when callbacks change", async () => {
    const firstClose = vi.fn();
    const latestClose = vi.fn();
    const success = vi.fn();
    const view = render(<LoginModal isSignUp={false} onClose={firstClose} onArtCraftAuthSuccess={success} />);
    await act(async () => {});
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Login with Website" })); });
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(screen.getByRole("status").textContent).toContain("Logged in as google_user");
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    view.rerender(<LoginModal isSignUp={false} onClose={latestClose} onArtCraftAuthSuccess={success} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    expect(useLoginModalStore.getState().isOpen).toBe(false);
    expect(firstClose).not.toHaveBeenCalled();
    expect(latestClose).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledExactlyOnceWith(USER);
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(latestClose).toHaveBeenCalledTimes(1);
  });

  it("cleans up the confirmation timer on unmount", async () => {
    const onClose = vi.fn();
    const view = render(<LoginModal isSignUp={false} onClose={onClose} />);
    await act(async () => {});
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Scan to Login" })); });
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(screen.getByRole("heading", { name: "Logged in as google_user" })).toBeTruthy();
    view.unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("restores an existing session without showing the login confirmation", async () => {
    native.mockResolvedValueOnce(USER);
    const success = vi.fn();
    await act(async () => { render(<LoginModal onArtCraftAuthSuccess={success} />); });
    expect(success).toHaveBeenCalledExactlyOnceWith(USER);
    expect(useLoginModalStore.getState().isOpen).toBe(false);
    expect(screen.queryByRole("heading", { name: "Logged in as google_user" })).toBeNull();
  });
});
