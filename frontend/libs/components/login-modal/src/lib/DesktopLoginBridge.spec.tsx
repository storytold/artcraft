import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopLoginBridge } from "./DesktopLoginBridge";

const { native, forbiddenFetch } = vi.hoisted(() => ({ native: vi.fn(), forbiddenFetch: vi.fn(() => { throw new Error("JavaScript must never call HTTP for login"); }) }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: native }));
vi.mock("@storyteller/tauri-utils", () => ({ FetchProxy: forbiddenFetch }));
vi.mock("@storyteller/api", () => { throw new Error("Login UI must only import API types"); });
vi.mock("qrcode.react", () => ({ QRCodeSVG: ({ value }: { value: string }) => <svg role="img" aria-label="Login QR" data-value={value} /> }));

const CHALLENGE_ID = "local-handle";
const APPROVAL_URL = `https://app.getartcraft.com/login/desktop#approval_token=${"A".repeat(43)}`;
const USER = { user_token: "user_fixture", username: "google_user" };
let outcome: Record<string, unknown>;
let expiresIn: number;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-25T12:00:00Z"));
  vi.stubGlobal("fetch", forbiddenFetch);
  localStorage.clear();
  native.mockReset();
  forbiddenFetch.mockClear();
  expiresIn = 1_200_000;
  outcome = { status: "pending", maybe_failure_type: null, maybe_user: null };
  native.mockImplementation(async (command: string) => {
    if (command === "storyteller_create_login_challenge_command") return {
      challenge_id: CHALLENGE_ID, verification_url: APPROVAL_URL,
      confirmation_code: "WDJBMJHT", expires_at: new Date(Date.now() + expiresIn).toISOString(), poll_interval_seconds: 5,
    };
    if (command === "storyteller_poll_login_challenge_command") return outcome;
    if (command === "storyteller_cancel_login_challenge_command" || command === "plugin:opener|open_url") return;
    throw new Error(`Unexpected native command: ${command}`);
  });
});
afterEach(() => {
  cleanup();
  expect(forbiddenFetch).not.toHaveBeenCalled();
  expect(localStorage.getItem("artcraft_signed_session")).toBeNull();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("desktop native login bridge integration", () => {
  it("creates through IPC and opens the native browser with the matching QR/code", async () => {
    render(<DesktopLoginBridge onSuccess={vi.fn()} />);
    await start("Login with Website");
    expect(native).toHaveBeenCalledWith("storyteller_create_login_challenge_command");
    expect(native).toHaveBeenCalledWith("plugin:opener|open_url", { url: APPROVAL_URL });
    expect(screen.getByRole("img", { name: "Login QR" }).getAttribute("data-value")).toBe(APPROVAL_URL);
    expect(screen.getByText("WDJB-MJHT")).toBeTruthy();
  });

  it("polls with only a local handle and accepts the natively verified user without seeing credentials", async () => {
    const success = vi.fn();
    render(<DesktopLoginBridge onSuccess={success} />);
    await start("Scan to Login");
    await tick(5000);
    expect(success).not.toHaveBeenCalled();
    outcome = { status: "redeemed", maybe_failure_type: null, maybe_user: USER };
    await tick(5000);
    expect(native).toHaveBeenCalledWith("storyteller_poll_login_challenge_command", { challengeId: CHALLENGE_ID });
    expect(success).toHaveBeenCalledWith(USER);
    expect(native).toHaveBeenCalledWith("storyteller_cancel_login_challenge_command", { challengeId: CHALLENGE_ID });
    const count = calls("storyteller_poll_login_challenge_command");
    await tick(30_000);
    expect(calls("storyteller_poll_login_challenge_command")).toBe(count);
  });

  it("stops after decline", async () => {
    const success = vi.fn();
    outcome = { status: "failed", maybe_failure_type: "user_declined" };
    render(<DesktopLoginBridge onSuccess={success} />);
    await start("Scan to Login");
    await tick(5000);
    expect(screen.getByText("Login was declined on the website.")).toBeTruthy();
    expect(success).not.toHaveBeenCalled();
    await tick(60_000);
    expect(calls("storyteller_poll_login_challenge_command")).toBe(1);
  });

  it("expires locally and cancels the native attempt without creating another", async () => {
    expiresIn = 5000;
    render(<DesktopLoginBridge onSuccess={vi.fn()} />);
    await start("Scan to Login");
    await tick(5000);
    expect(screen.getByText("Login request expired. Start a new request.")).toBeTruthy();
    expect(calls("storyteller_create_login_challenge_command")).toBe(1);
    expect(calls("storyteller_poll_login_challenge_command")).toBe(0);
    expect(calls("storyteller_cancel_login_challenge_command")).toBe(1);
  });

  it("backs off a native network failure and retries the same local handle", async () => {
    render(<DesktopLoginBridge onSuccess={vi.fn()} />);
    await start("Scan to Login");
    native.mockRejectedValueOnce({ message: "Disconnected", status: null, retryable: true });
    await tick(5000);
    expect(screen.getByText("Connection interrupted. Retrying…")).toBeTruthy();
    await tick(9999);
    expect(calls("storyteller_poll_login_challenge_command")).toBe(1);
    await tick(1);
    expect(calls("storyteller_poll_login_challenge_command")).toBe(2);
  });

  it("cancels on unmount and ignores a late command result", async () => {
    let resolve: (value: unknown) => void = () => {};
    const success = vi.fn();
    const view = render(<DesktopLoginBridge onSuccess={success} />);
    await start("Scan to Login");
    native.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    await tick(5000);
    view.unmount();
    expect(native).toHaveBeenCalledWith("storyteller_cancel_login_challenge_command", { challengeId: CHALLENGE_ID });
    await act(async () => { resolve({ status: "redeemed", maybe_user: USER }); });
    expect(success).not.toHaveBeenCalled();
  });

  it("ignores an in-flight redemption after Back and can start a new challenge", async () => {
    let resolve: (value: unknown) => void = () => {};
    const success = vi.fn();
    render(<DesktopLoginBridge onSuccess={success} />);
    await start("Scan to Login");
    native.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    await tick(5000);
    await start("Back");
    expect(native).toHaveBeenCalledWith("storyteller_cancel_login_challenge_command", { challengeId: CHALLENGE_ID });
    await act(async () => { resolve({ status: "redeemed", maybe_user: USER }); });
    expect(success).not.toHaveBeenCalled();
    expect(screen.queryByRole("img", { name: "Login QR" })).toBeNull();
    await tick(30_000);
    expect(calls("storyteller_poll_login_challenge_command")).toBe(1);

    await start("Scan to Login");
    expect(screen.getByRole("img", { name: "Login QR" })).toBeTruthy();
    outcome = { status: "redeemed", maybe_user: USER };
    await tick(5000);
    expect(success).toHaveBeenCalledExactlyOnceWith(USER);
  });

  it("fails closed on a future status", async () => {
    outcome = { status: "future_state", maybe_user: USER };
    render(<DesktopLoginBridge onSuccess={vi.fn()} />);
    await start("Scan to Login");
    await tick(5000);
    expect(screen.getByText("This login request could not be completed. Start a new request.")).toBeTruthy();
  });

  it("shows the native host/status diagnostic and stops on terminal HTTP errors", async () => {
    render(<DesktopLoginBridge onSuccess={vi.fn()} />);
    await start("Scan to Login");
    native.mockRejectedValueOnce({ message: "http://localhost:12345: Login server rejected the request (HTTP 401)", status: 401, retryable: false });
    await tick(5000);
    expect(screen.getByText(/localhost:12345.*401/)).toBeTruthy();
    await tick(60_000);
    expect(calls("storyteller_poll_login_challenge_command")).toBe(1);
  });
});

async function start(label: string) {
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: label })); });
}
async function tick(ms: number) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}
function calls(command: string) {
  return native.mock.calls.filter(([name]) => name === command).length;
}
