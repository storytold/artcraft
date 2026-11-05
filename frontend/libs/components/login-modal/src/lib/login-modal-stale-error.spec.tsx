import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginModal } from "./login-modal";
import { useLoginModalStore } from "./useLoginModalStore";

// Same stand-ins as login-modal.spec.tsx: the authentication UI talks to Rust only (invoke), never to the API client or
// fetch, and the animated/visual pieces are replaced by plain elements so the form can be driven directly.
const { native } = vi.hoisted(() => ({ native: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: native }));
vi.mock("@storyteller/api", () => { throw new Error("Authentication UI must not import API clients"); });
vi.mock("@headlessui/react", () => ({ Transition: ({ show, children }: any) => show ? children : null, TransitionChild: ({ children }: any) => children }));
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null, DiscordIcon: () => null }));
vi.mock("@storyteller/ui-button", () => ({ Button: ({ children, variant, icon, iconFlip, ...props }: any) => <button {...props}>{children}</button> }));
vi.mock("@storyteller/ui-input", () => ({ Input: ({ inputClassName, ...props }: any) => <input {...props} /> }));
vi.mock("qrcode.react", () => ({ QRCodeSVG: () => <svg role="img" aria-label="Login QR" /> }));

// The error the Rust side sends back when the server refuses a sign-up (isDesktopLoginError accepts this shape).
const SIGNUP_REFUSED = { status: 400, message: "username already taken", retryable: false };
// The text the form shows for it: the first letter is capitalised by the form.
const SIGNUP_REFUSED_SHOWN = "Username already taken";
// The text the form shows when the two password boxes differ.
const MISMATCH = "Passwords do not match.";

beforeEach(() => {
  // Fake timers keep the post-login confirmation timer from running on its own.
  vi.useFakeTimers();
  localStorage.clear();
  // The modal reads this store to decide whether it is open.
  useLoginModalStore.setState({ isOpen: true, recheckTrigger: 0 });
  // By default there is no saved session and the login/sign-up commands succeed; individual tests override this.
  native.mockReset().mockImplementation(async (command: string) => {
    if (command === "storyteller_get_login_session_command") return null;
    if (command === "storyteller_password_login_command" || command === "storyteller_password_signup_command") return { username: "native_user", user_token: "u_test" };
    if (command === "storyteller_cancel_login_challenge_command" || command === "plugin:opener|open_url") return;
    throw new Error(`Unexpected command: ${command}`);
  });
});
afterEach(() => {
  // Unmount the modal and put the real timers back.
  cleanup();
  vi.useRealTimers();
});

// Opens the modal on the sign-up screen (the screen a first-time user lands on).
const openSignUp = async () => {
  await act(async () => { render(<LoginModal isSignUp />); });
};

// Types into the sign-up form. The two password boxes get the values given, so a test can make them differ.
const fillSignUp = (password: string, confirmation: string) => {
  fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "native_user" } });
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "user@example.com" } });
  fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: password } });
  fireEvent.change(screen.getByPlaceholderText("Re-enter password"), { target: { value: confirmation } });
};

// Presses the form's submit button (the one with type="submit"; the mode toggle shares its label on the other screen).
const submit = async (label: "Sign up" | "Log in") => {
  const button = screen.getAllByRole("button", { name: label }).find((b) => b.getAttribute("type") === "submit")!;
  await act(async () => { fireEvent.click(button); });
};

// Presses the link under the form that switches between the sign-up and log-in screens.
const toggleMode = async (label: "Sign up" | "Log in") => {
  const link = screen.getAllByRole("button", { name: label }).find((b) => b.getAttribute("type") === "button")!;
  await act(async () => { fireEvent.click(link); });
};

describe("an error from one screen does not follow the user to the other", () => {
  it("drops the password-mismatch message when the user switches to the log-in screen", async () => {
    await openSignUp();
    fillSignUp("password123", "password124");
    await submit("Sign up");
    // The message belongs to the sign-up attempt.
    expect(screen.queryByText(MISMATCH)).not.toBeNull();
    await toggleMode("Log in");
    // On the log-in screen there is no confirmation box, so a mismatch message makes no sense there.
    expect(screen.getByPlaceholderText("you@example.com or username")).toBeTruthy();
    expect(screen.queryByText(MISMATCH)).toBeNull();
  });

  it("drops the server's sign-up refusal when the user switches to the log-in screen", async () => {
    native.mockImplementation(async (command: string) => {
      if (command === "storyteller_get_login_session_command") return null;
      if (command === "storyteller_password_signup_command") throw SIGNUP_REFUSED;
      throw new Error(`Unexpected command: ${command}`);
    });
    await openSignUp();
    fillSignUp("password123", "password123");
    await submit("Sign up");
    expect(screen.queryByText(SIGNUP_REFUSED_SHOWN)).not.toBeNull();
    await toggleMode("Log in");
    // The refusal was about creating an account; the log-in screen starts clean.
    expect(screen.getByPlaceholderText("you@example.com or username")).toBeTruthy();
    expect(screen.queryByText(SIGNUP_REFUSED_SHOWN)).toBeNull();
  });

  it("drops the log-in refusal when the user switches to the sign-up screen", async () => {
    native.mockImplementation(async (command: string) => {
      if (command === "storyteller_get_login_session_command") return null;
      if (command === "storyteller_password_login_command") throw { status: 401, message: "invalid credentials", retryable: false };
      throw new Error(`Unexpected command: ${command}`);
    });
    await act(async () => { render(<LoginModal isSignUp={false} />); });
    fireEvent.change(screen.getByPlaceholderText("you@example.com or username"), { target: { value: "native_user" } });
    fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: "password123" } });
    await submit("Log in");
    expect(screen.queryByText("Invalid credentials")).not.toBeNull();
    await toggleMode("Sign up");
    expect(screen.getByPlaceholderText("Username")).toBeTruthy();
    expect(screen.queryByText("Invalid credentials")).toBeNull();
  });

  it("does not bring the sign-up refusal back after a website log-in attempt is cancelled", async () => {
    // The sign-up is refused, then the user switches to log-in and starts (and cancels) "Login with Website". The
    // password form is taken off the screen during that attempt and put back by "Back", so it starts over from what
    // the modal itself still remembers.
    native.mockImplementation(async (command: string) => {
      if (command === "storyteller_get_login_session_command") return null;
      if (command === "storyteller_password_signup_command") throw SIGNUP_REFUSED;
      if (command === "storyteller_create_login_challenge_command") return {
        challenge_id: "native_handle", verification_url: `https://app.getartcraft.com/login/desktop#approval_token=${"A".repeat(43)}`,
        confirmation_code: "WDJBMJHT", expires_at: new Date(Date.now() + 1_200_000).toISOString(), poll_interval_seconds: 5,
      };
      if (command === "storyteller_cancel_login_challenge_command" || command === "plugin:opener|open_url") return;
      throw new Error(`Unexpected command: ${command}`);
    });
    await openSignUp();
    fillSignUp("password123", "password123");
    await submit("Sign up");
    expect(screen.queryByText(SIGNUP_REFUSED_SHOWN)).not.toBeNull();
    await toggleMode("Log in");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Login with Website" })); });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Back" })); });
    // The password form is back, and the refusal from the other screen must not have come back with it.
    expect(screen.getByPlaceholderText("you@example.com or username")).toBeTruthy();
    expect(screen.queryByText(SIGNUP_REFUSED_SHOWN)).toBeNull();
  });

  it("drops the password-mismatch message as soon as a corrected form is sent", async () => {
    await openSignUp();
    fillSignUp("password123", "password124");
    await submit("Sign up");
    expect(screen.queryByText(MISMATCH)).not.toBeNull();
    // The user fixes the confirmation box and sends the form again; the request is held open by hand.
    let finishSignup: (value: unknown) => void = () => {};
    native.mockImplementation((command: string) => {
      if (command === "storyteller_password_signup_command") return new Promise((done) => { finishSignup = done; });
      return Promise.resolve(null);
    });
    fireEvent.change(screen.getByPlaceholderText("Re-enter password"), { target: { value: "password123" } });
    await submit("Sign up");
    // The passwords match now and the request is in flight: the old complaint must not still be on screen.
    expect(screen.queryByText(MISMATCH)).toBeNull();
    // Let the request finish so nothing is left pending when the test ends.
    await act(async () => { finishSignup({ username: "native_user", user_token: "u_test" }); });
  });
});

describe("errors on the screen they belong to", () => {
  it("control: the mismatch message shows on the sign-up screen after a bad submit", async () => {
    await openSignUp();
    fillSignUp("password123", "password124");
    await submit("Sign up");
    expect(screen.queryByText(MISMATCH)).not.toBeNull();
    // A mismatch never reaches Rust.
    expect(native.mock.calls.filter(([command]) => command === "storyteller_password_signup_command")).toHaveLength(0);
  });

  it("control: the server's refusal shows (capitalised) on the sign-up screen", async () => {
    native.mockImplementation(async (command: string) => {
      if (command === "storyteller_get_login_session_command") return null;
      if (command === "storyteller_password_signup_command") throw SIGNUP_REFUSED;
      throw new Error(`Unexpected command: ${command}`);
    });
    await openSignUp();
    fillSignUp("password123", "password123");
    await submit("Sign up");
    expect(screen.queryByText(SIGNUP_REFUSED_SHOWN)).not.toBeNull();
  });

  it("control: the same refusal appears again after a second failed attempt", async () => {
    native.mockImplementation(async (command: string) => {
      if (command === "storyteller_get_login_session_command") return null;
      if (command === "storyteller_password_signup_command") throw SIGNUP_REFUSED;
      throw new Error(`Unexpected command: ${command}`);
    });
    await openSignUp();
    fillSignUp("password123", "password123");
    await submit("Sign up");
    expect(screen.queryByText(SIGNUP_REFUSED_SHOWN)).not.toBeNull();
    // The second attempt clears the old message while it runs and shows the fresh one when it fails.
    await submit("Sign up");
    expect(screen.queryByText(SIGNUP_REFUSED_SHOWN)).not.toBeNull();
    expect(native.mock.calls.filter(([command]) => command === "storyteller_password_signup_command")).toHaveLength(2);
  });

  it("control: switching screens with no error showing leaves both screens clean", async () => {
    await openSignUp();
    await toggleMode("Log in");
    expect(screen.queryByText(MISMATCH)).toBeNull();
    await toggleMode("Sign up");
    expect(screen.getByPlaceholderText("Username")).toBeTruthy();
    expect(screen.queryByText(MISMATCH)).toBeNull();
    expect(screen.queryByText(SIGNUP_REFUSED_SHOWN)).toBeNull();
  });

  it("control: a failed log-in shows its refusal on the log-in screen", async () => {
    native.mockImplementation(async (command: string) => {
      if (command === "storyteller_get_login_session_command") return null;
      if (command === "storyteller_password_login_command") throw { status: 401, message: "invalid credentials", retryable: false };
      throw new Error(`Unexpected command: ${command}`);
    });
    await act(async () => { render(<LoginModal isSignUp={false} />); });
    fireEvent.change(screen.getByPlaceholderText("you@example.com or username"), { target: { value: "native_user" } });
    fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: "password123" } });
    await submit("Log in");
    expect(screen.queryByText("Invalid credentials")).not.toBeNull();
  });
});
