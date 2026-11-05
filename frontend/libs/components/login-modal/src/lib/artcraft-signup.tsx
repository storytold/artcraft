// React itself (needed here for the `React.FormEvent` / `React.RefObject` types) and `useState`, which holds a value
// that re-draws the form when it changes.
import React, { useState } from "react";
// The app's shared text-input and button components.
import { Input } from "@storyteller/ui-input";
import { Button } from "@storyteller/ui-button";
// Icons from the Lucide set: show/hide password eyes, the spinner on the submit button, the warning triangle on errors.
import { EyeIcon, EyeOffIcon, LoaderCircleIcon, TriangleAlertIcon } from "lucide-react";
// A wrapper that draws an icon at the app's standard size.
import { DynamicIcon } from "@storyteller/icons";

// What the parent (the login dialog, `login-modal.tsx`) gives this form.
interface ArtCraftSignUpProps {
  // Called when the person submits a valid form. The same four slots serve both modes:
  //   sign-up: (username, email, password, passwordConfirmation)
  //   log-in:  (usernameOrEmail, "", password, "")  (the unused slots are empty strings)
  onSubmit: (
    username: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => void;
  // True shows the sign-up form (four fields); false shows the log-in form (two fields).
  isSignUp: boolean;
  // Called when the person presses the "Log in" / "Sign up" link at the bottom to switch between the two forms.
  onToggleMode: () => void;
  // Optional handle on the underlying `<form>` element, so the parent can submit it from outside (for example, when
  // Enter is pressed somewhere else in the dialog).
  formRef?: React.RefObject<HTMLFormElement | null>;
  // A message from the server/Rust side to show in the red banner at the top (empty or missing means none).
  errorMessage?: string;
  // True while a request is in flight: the submit button is disabled and shows a spinner.
  isLoading?: boolean;
}

// Tailwind class strings shared by every field so the labels and inputs look the same. Written once here instead of
// being repeated on each field.
// The small uppercase caption above a field.
const FIELD_LABEL =
  "block font-mono text-[11px] font-semibold leading-4 uppercase tracking-[0.12em] text-white/70";
// The text box itself: height, border, translucent background, text colour, and a brighter border on focus.
const FIELD_INPUT =
  "h-10 w-full rounded-[3px] border border-white/15 bg-white/5 px-4 py-2 text-sm font-normal leading-5 text-white placeholder-white/20 outline-none transition-colors focus:border-white/40";

// The log-in / sign-up form. It owns only the form's own state (the eye toggles and its own validation message); the
// actual network request is made by the parent through `onSubmit`.
export const ArtCraftSignUp = ({
  onSubmit,
  isSignUp,
  onToggleMode,
  formRef,
  errorMessage,
  isLoading = false,
}: ArtCraftSignUpProps) => {
  // Only the form's own complaint ("Passwords do not match."). It is cleared when the user switches screens and when a valid form is sent.
  const [localError, setLocalError] = useState<string | undefined>(undefined);
  // Whether the password box shows its text (true) or dots (false), and the same for the confirm box.
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // The message from the server/Rust side is shown straight from the prop (first letter capitalised) instead of being copied into state by an
  // effect. A copy that only updates when the text changes can miss a repeat of the same message and cannot be cleared by the parent in
  // the same step; showing the prop directly always matches what the modal holds.
  const serverError = errorMessage
    ? errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1)
    : undefined;
  // What the banner shows: the form's own, newer complaint wins over the server's older message.
  const shownError = localError ?? serverError;

  // Runs when the form is submitted (the button is pressed, or Enter is pressed inside a field). The fields are not
  // tracked in state; their values are read from the form at this moment.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Stop the browser from doing its default form submission (which would reload the page).
    e.preventDefault();
    // The `<form>` that fired the event.
    const form = e.currentTarget;
    if (isSignUp) {
      // `form.elements.namedItem("x")` finds the field whose `name` attribute is "x"; the cast tells TypeScript it is a
      // text box so `.value` (what the person typed) can be read.
      const username = (form.elements.namedItem("username") as HTMLInputElement)
        .value;
      const email = (form.elements.namedItem("email") as HTMLInputElement)
        .value;
      const password = (form.elements.namedItem("password") as HTMLInputElement)
        .value;
      const confirmPassword = (
        form.elements.namedItem("confirmPassword") as HTMLInputElement
      ).value;
      // The two password boxes must match; if not, show the form's own message and do not send anything.
      if (password !== confirmPassword) {
        setLocalError("Passwords do not match.");
        return;
      }
      // The form is valid now, so an earlier complaint (e.g. "Passwords do not match.") must not stay up while the request runs.
      setLocalError(undefined);
      onSubmit(username, email, password, confirmPassword);
    } else {
      // Log-in mode: one box that accepts either a username or an e-mail address, plus the password.
      const usernameOrEmail = (
        form.elements.namedItem("usernameOrEmail") as HTMLInputElement
      ).value;
      const password = (form.elements.namedItem("password") as HTMLInputElement)
        .value;
      // Same for the log-in form: start the attempt with no message from the previous one on screen.
      setLocalError(undefined);
      // The identifier goes in the first slot; the email and confirmation slots are unused here.
      onSubmit(usernameOrEmail, "", password, "");
    }
  };

  return (
    // The form. `ref` hands the element to the parent's `formRef`, if one was given.
    <form
      className="flex w-full flex-col gap-4"
      onSubmit={handleSubmit}
      ref={formRef}
    >
      {/* The red error banner, drawn only when there is a message to show. */}
      {shownError && (
        <div className="flex items-center justify-center gap-2 border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-500">
          <TriangleAlertIcon />
          {shownError}
        </div>
      )}

      {/* Sign-up shows separate Username and Email boxes; log-in shows a single "Email or Username" box. */}
      {isSignUp ? (
        <>
          <div className="space-y-2">
            <label className={FIELD_LABEL}>Username</label>
            {/* `name` is what `handleSubmit` looks the field up by; `required` makes the browser refuse an empty box. */}
            <Input
              name="username"
              placeholder="Username"
              required
              autoComplete="off"
              inputClassName={FIELD_INPUT}
            />
          </div>
          <div className="space-y-2">
            <label className={FIELD_LABEL}>Email</label>
            {/* `type="email"` makes the browser check that the text looks like an e-mail address before submitting. */}
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="off"
              inputClassName={FIELD_INPUT}
            />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <label className={FIELD_LABEL}>Email or Username</label>
          <Input
            name="usernameOrEmail"
            placeholder="you@example.com or username"
            required
            autoComplete="off"
            inputClassName={FIELD_INPUT}
          />
        </div>
      )}

      {/* The password box, shared by both modes, with an eye button on its right edge that switches between dots and text. */}
      <div className="space-y-2">
        <label className={FIELD_LABEL}>Password</label>
        <div className="relative">
          {/* `pr-12` adds right padding so typed text never runs under the eye button. */}
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters"
            required
            autoComplete="off"
            inputClassName={`${FIELD_INPUT} pr-12`}
          />
          {/* `type="button"` keeps it from submitting the form; `tabIndex={-1}` keeps it out of the Tab order. */}
          {/* The function form of the setter flips the value from whatever it currently is. */}
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
            tabIndex={-1}
          >
            <DynamicIcon icon={showPassword ? EyeOffIcon : EyeIcon} />
          </button>
        </div>
      </div>

      {/* The "Confirm Password" box exists only when signing up; it has its own eye button and its own toggle state. */}
      {isSignUp && (
        <div className="space-y-2">
          <label className={FIELD_LABEL}>Confirm Password</label>
          <div className="relative">
            <Input
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter password"
              required
              autoComplete="off"
              inputClassName={`${FIELD_INPUT} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
              tabIndex={-1}
            >
              <DynamicIcon icon={showConfirm ? EyeOffIcon : EyeIcon} />
            </button>
          </div>
        </div>
      )}

      {/* The submit button: disabled while a request is running; shows a spinner then, otherwise "Sign up" or "Log in". */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full justify-center rounded-[3px] border-none bg-white font-mono text-xs font-semibold uppercase tracking-[0.12em] text-black shadow-none hover:bg-white/90"
        >
          {isLoading ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : isSignUp ? (
            "Sign up"
          ) : (
            "Log in"
          )}
        </Button>
      </div>

      {/* The switch-mode line at the bottom: a question plus a link-styled button that goes to the other form. */}
      <div className="mt-4 text-center text-sm text-white/60">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            // A message about the screen being left (a mismatch, a refused sign-up or log-in) does not belong on the other screen.
            setLocalError(undefined);
            onToggleMode();
          }}
          className="font-semibold text-primary transition-colors hover:text-primary-400"
        >
          {isSignUp ? "Log in" : "Sign up"}
        </button>
      </div>
    </form>
  );
};
