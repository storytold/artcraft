import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopLoginBridge } from "./DesktopLoginBridge";

const { transport, native } = vi.hoisted(() => ({ transport: vi.fn(), native: vi.fn() }));
vi.mock("@storyteller/tauri-utils", () => ({ FetchProxy: transport }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: native }));
vi.mock("@storyteller/tauri-api", async () => await import("../../../../tauri-api/src/lib/opener/OpenUrl"));
vi.mock("@storyteller/api", async () => ({
  ...(await import("../../../../api/src/lib/LoginChallengesApi")),
  ...(await import("../../../../api/src/lib/UsersApi")),
  HttpApiError: (await import("../../../../api/src/lib/ApiManager")).HttpApiError,
}));
vi.mock("qrcode.react", () => ({ QRCodeSVG: ({ value }: { value: string }) => <svg role="img" aria-label="Login QR" data-value={value} /> }));

const DEVICE = "D".repeat(43);
const APPROVAL_URL = `https://app.getartcraft.com/login/desktop#approval_token=${"A".repeat(43)}`;
const USER = { user_token: "user_fixture", username: "google_user" };
let outcome: Record<string, unknown>;
let expiresIn: number;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-25T12:00:00Z"));
  localStorage.clear();
  transport.mockReset();
  native.mockReset().mockResolvedValue(undefined);
  expiresIn = 1_200_000;
  outcome = { success: true, status: "pending", maybe_failure_type: null };
  transport.mockImplementation(async (url: string) => {
    if (url.endsWith("/create")) return response({
      success: true, device_token: DEVICE, verification_url: APPROVAL_URL,
      confirmation_code: "WDJBMJHT", expires_at: new Date(Date.now() + expiresIn).toISOString(), poll_interval_seconds: 5,
    });
    if (url.endsWith("/poll")) return response(outcome);
    if (url.endsWith("/v1/session")) return response({ success: true, logged_in: true, user: USER });
    throw new Error("Unexpected test URL");
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("desktop login bridge integration", () => {
  it("opens the native browser with only the approval token and displays the matching QR/code", async () => {
    render(<DesktopLoginBridge onSuccess={vi.fn()} />);
    await start("Login with Website");
    expect(native).toHaveBeenCalledWith("plugin:opener|open_url", { url: APPROVAL_URL });
    expect(screen.getByRole("img", { name: "Login QR" }).getAttribute("data-value")).toBe(APPROVAL_URL);
    expect(screen.getByText("WDJB-MJHT")).toBeTruthy();
    expect(document.body.textContent).not.toContain(DEVICE);
    expect(localStorage.getItem("artcraft_signed_session")).toBeNull();
  });

  it("polls until redeemed, synchronizes native credentials, then verifies the downstream session", async () => {
    const success = vi.fn();
    render(<DesktopLoginBridge onSuccess={success} />);
    await start("Scan to Login");
    expect(native).not.toHaveBeenCalled();
    await tick(5000);
    expect(success).not.toHaveBeenCalled();
    expect(localStorage.getItem("artcraft_signed_session")).toBeNull();
    outcome = { success: true, status: "redeemed", maybe_failure_type: null, maybe_signed_session: "signed_session_from_api" };
    await tick(5000);
    expect(native).toHaveBeenCalledWith("storyteller_sync_login_session_command");
    expect(localStorage.getItem("artcraft_signed_session")).toBe("signed_session_from_api");
    expect(success).toHaveBeenCalledWith(USER);
    const sessionCall = transport.mock.calls.find(([url]) => url.endsWith("/v1/session"));
    expect(sessionCall?.[1].headers.session).toBe("signed_session_from_api");
    const count = transport.mock.calls.length;
    await tick(30_000);
    expect(transport).toHaveBeenCalledTimes(count);
  });

  it("stops after decline without persisting or synchronizing a session", async () => {
    const success = vi.fn();
    outcome = { success: true, status: "failed", maybe_failure_type: "user_declined" };
    render(<DesktopLoginBridge onSuccess={success} />);
    await start("Scan to Login");
    await tick(5000);
    expect(screen.getByText("Login was declined on the website.")).toBeTruthy();
    expect(success).not.toHaveBeenCalled();
    expect(native).not.toHaveBeenCalled();
    expect(localStorage.getItem("artcraft_signed_session")).toBeNull();
    await tick(60_000);
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it("expires locally without automatically creating another challenge", async () => {
    expiresIn = 5000;
    render(<DesktopLoginBridge onSuccess={vi.fn()} />);
    await start("Scan to Login");
    await tick(5000);
    expect(screen.getByText("Login request expired. Start a new request.")).toBeTruthy();
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("backs off a network failure and retries the same device token", async () => {
    render(<DesktopLoginBridge onSuccess={vi.fn()} />);
    await start("Scan to Login");
    transport.mockRejectedValueOnce(new Error("Disconnected"));
    await tick(5000);
    expect(screen.getByText("Connection interrupted. Retrying…")).toBeTruthy();
    await tick(9999);
    expect(transport).toHaveBeenCalledTimes(2);
    await tick(1);
    expect(transport).toHaveBeenCalledTimes(3);
    expect(JSON.parse(transport.mock.calls[2][1].body)).toEqual({ device_token: DEVICE });
  });

  it("does not accept an in-flight response after the dialog unmounts", async () => {
    let resolve: (value: Response) => void = () => {};
    const success = vi.fn();
    const view = render(<DesktopLoginBridge onSuccess={success} />);
    await start("Scan to Login");
    transport.mockImplementationOnce(() => new Promise<Response>((done) => { resolve = done; }));
    await tick(5000);
    view.unmount();
    await act(async () => { resolve(response({ success: true, status: "redeemed", maybe_signed_session: "late_session" })); });
    expect(success).not.toHaveBeenCalled();
    expect(native).not.toHaveBeenCalled();
    expect(localStorage.getItem("artcraft_signed_session")).toBeNull();
  });

  it("fails closed on a future status instead of accepting its session value", async () => {
    outcome = { success: true, status: "future_state", maybe_signed_session: "untrusted_session" };
    render(<DesktopLoginBridge onSuccess={vi.fn()} />);
    await start("Scan to Login");
    await tick(5000);
    expect(screen.getByText("This login request could not be completed. Start a new request.")).toBeTruthy();
    expect(localStorage.getItem("artcraft_signed_session")).toBeNull();
    expect(native).not.toHaveBeenCalled();
  });
});

async function start(label: string) {
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: label })); });
}

async function tick(ms: number) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

function response(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}
