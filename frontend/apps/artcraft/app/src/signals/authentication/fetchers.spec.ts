import { beforeEach, describe, expect, it, vi } from "vitest";

// Mocks are hoisted so they exist before ./fetchers is imported.
const m = vi.hoisted(() => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  getSession: vi.fn(),
  listSubs: vi.fn(),
  setLogoutStates: vi.fn(),
  updateAuthStatus: vi.fn(),
  status: { value: "init" },
}));

vi.mock("./authentication", () => ({ authentication: { status: m.status } }));
vi.mock("~/Classes/ApiManager/UsersApi", () => ({
  UsersApi: class {
    Login = m.login;
    Signup = m.signup;
    Logout = m.logout;
    GetSession = m.getSession;
  },
}));
vi.mock("~/Classes/ApiManager/BillingApi", () => ({
  BillingApi: class {
    ListActiveSubscriptions = m.listSubs;
  },
}));
vi.mock("@storyteller/google-analytics", () => ({
  gtagLogin: vi.fn(),
  gtagLogout: vi.fn(),
}));
vi.mock("./utilities", () => ({
  updateActiveSubscriptions: vi.fn(),
  updateAuthStatus: m.updateAuthStatus,
  updateUserInfo: vi.fn(),
  setLogoutStates: m.setLogoutStates,
}));
vi.mock("~/enums", () => ({
  AUTH_STATUS: {
    INIT: "init",
    LOGGING: "logging",
    GET_USER_INFO: "get_user_info",
    NO_ACCESS: "no_access",
    LOGGED_IN: "logged_in",
  },
}));

import { logout, login, signUp, forceGetUserInfoAndSubcriptions } from "./fetchers";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("auth fetchers when a request throws", () => {
  it("login resets to logged-out instead of leaving the status on LOGGING", async () => {
    m.login.mockRejectedValue(new Error("network"));
    await login({ usernameOrEmail: "a", password: "b" });
    expect(m.setLogoutStates).toHaveBeenCalledTimes(1);
  });

  it("signUp resets to logged-out and returns the error message", async () => {
    m.signup.mockRejectedValue(new Error("network"));
    const result = await signUp({
      username: "a",
      email: "a@b.c",
      password: "p",
      passwordConfirmation: "p",
    });
    expect(result).toBe("network");
    expect(m.setLogoutStates).toHaveBeenCalledTimes(1);
  });

  it("logout still clears local state and reports the failure", async () => {
    m.logout.mockRejectedValue(new Error("offline"));
    const cb = vi.fn();
    await logout(cb);
    expect(cb).toHaveBeenCalledWith("offline");
    expect(m.setLogoutStates).toHaveBeenCalledTimes(1);
  });

  it("fetching the session resets state instead of rejecting unhandled", async () => {
    m.getSession.mockRejectedValue(new Error("boom"));
    await forceGetUserInfoAndSubcriptions();
    // The inner call is not awaited by the exported wrapper; let it settle.
    await new Promise((r) => setTimeout(r, 0));
    expect(m.setLogoutStates).toHaveBeenCalledTimes(1);
  });

  it("fetching subscriptions resets state when billing throws", async () => {
    m.getSession.mockResolvedValue({
      success: true,
      data: { user: { can_access_studio: true } },
    });
    m.listSubs.mockRejectedValue(new Error("billing down"));
    await forceGetUserInfoAndSubcriptions();
    await new Promise((r) => setTimeout(r, 0));
    expect(m.setLogoutStates).toHaveBeenCalledTimes(1);
  });
});
