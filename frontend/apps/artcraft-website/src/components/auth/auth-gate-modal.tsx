import { useState } from "react";
import { CheckIcon, EyeIcon, EyeOffIcon, LoaderCircleIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { UsersApi } from "@storyteller/api";
import { SignupForm } from "./signup-form";
import { GoogleLoginButton } from "./GoogleLoginButton";

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful signup OR login. Session cookie is already set. */
  onAuthed: () => void;
  /** Attribution string passed to the signup endpoint. */
  signupSource: string;
  headline: string;
  subtitle: string;
  perks?: string[];
}

/**
 * Soft auth gate for marketing pages: keeps the visitor on the page (no
 * redirect to the webapp), letting them create an account or log in inline
 * and then continue whatever action triggered the gate.
 */
export function AuthGateModal({
  isOpen,
  onClose,
  onAuthed,
  signupSource,
  headline,
  subtitle,
  perks,
}: AuthGateModalProps) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [googleError, setGoogleError] = useState<string | null>(null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[5%] bg-[#161618] p-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
      showClose={true}
      closeOnOutsideClick={true}
      resizable={false}
      childPadding={false}
      backdropClassName="bg-black/80"
    >
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-[80px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />

        <div className="relative px-8 pb-8 pt-10 sm:px-10">
          <h2 className="font-display text-[26px] font-semibold leading-[1.15] tracking-tight text-white sm:text-[30px]">
            {headline}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/55">
            {subtitle}
          </p>

          {perks && perks.length > 0 && (
            <ul className="mt-6 space-y-2.5">
              {perks.map((perk) => (
                <li
                  key={perk}
                  className="flex items-start gap-3 text-[14px] text-white/75"
                >
                  <span className="mt-[2px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <CheckIcon
                      
                      className="text-[9px] text-primary" />
                  </span>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-7 space-y-4">
            {googleError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-500">
                {googleError}
              </div>
            )}

            <GoogleLoginButton
              mode={mode}
              onSuccess={onAuthed}
              onError={setGoogleError}
            />

            <div className="relative flex items-center justify-center py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-[#161618] px-4 text-xs uppercase tracking-widest text-white/40">
                or
              </span>
            </div>

            {mode === "signup" ? (
              <SignupForm
                onSuccess={onAuthed}
                signupSource={signupSource}
                autoFocus
              />
            ) : (
              <InlineLoginForm onSuccess={onAuthed} />
            )}
          </div>

          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            className="mt-5 block w-full text-center text-[13px] text-white/55 transition-colors hover:text-white"
          >
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <span className="font-medium text-white/90">Log in</span>
              </>
            ) : (
              <>
                New to ArtCraft?{" "}
                <span className="font-medium text-white/90">
                  Create a free account
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Compact login variant of SignupForm, kept here because the standalone login
// page redirects to the webapp (USE_WEBAPP_FOR_APP_FEATURES) and would pull
// the visitor away from the marketing page mid-action.
function InlineLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!usernameOrEmail || !password) {
      setError("All fields are required");
      return;
    }

    setIsLoading(true);
    const response = await new UsersApi().Login({ usernameOrEmail, password });
    setIsLoading(false);

    if (response.success) {
      window.dispatchEvent(new Event("auth-change"));
      onSuccess();
    } else {
      setError(response.errorMessage || "Invalid credentials");
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
    >
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="ml-1 text-xs font-semibold text-white/70">
          Email or username
        </label>
        <Input
          type="text"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
          placeholder="you@example.com"
          autoFocus
          inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label className="ml-1 text-xs font-semibold text-white/70">
          Password
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
            tabIndex={-1}
          >
            <DynamicIcon icon={showPassword ? EyeOffIcon : EyeIcon} />
          </button>
        </div>
      </div>

      <div className="pt-2">
        <Button
          className="h-10 w-full justify-center rounded-full border-none bg-primary font-bold text-white hover:bg-primary-600"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <LoaderCircleIcon  className="animate-spin" />
          ) : (
            "Log in"
          )}
        </Button>
      </div>
    </form>
  );
}
