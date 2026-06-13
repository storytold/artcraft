import React, { useState, useEffect } from "react";
import { Input } from "@storyteller/ui-input";
import { Button } from "@storyteller/ui-button";
import {
  faEye,
  faEyeSlash,
  faExclamationTriangle,
  faSpinnerThird,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ArtCraftSignUpProps {
  onSubmit: (
    username: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => void;
  isSignUp: boolean;
  onToggleMode: () => void;
  formRef?: React.RefObject<HTMLFormElement | null>;
  errorMessage?: string;
  isLoading?: boolean;
}

const FIELD_LABEL = "text-xs font-semibold text-white/70 ml-1";
const FIELD_INPUT =
  "w-full bg-black/40 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors";

export const ArtCraftSignUp = ({
  onSubmit,
  isSignUp,
  onToggleMode,
  formRef,
  errorMessage,
  isLoading = false,
}: ArtCraftSignUpProps) => {
  const [localError, setLocalError] = useState<string | undefined>(undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (errorMessage) {
      setLocalError(
        errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1),
      );
    } else {
      setLocalError(undefined);
    }
  }, [errorMessage]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (isSignUp) {
      const username = (form.elements.namedItem("username") as HTMLInputElement)
        .value;
      const email = (form.elements.namedItem("email") as HTMLInputElement)
        .value;
      const password = (form.elements.namedItem("password") as HTMLInputElement)
        .value;
      const confirmPassword = (
        form.elements.namedItem("confirmPassword") as HTMLInputElement
      ).value;
      if (password !== confirmPassword) {
        setLocalError("Passwords do not match.");
        return;
      }
      onSubmit(username, email, password, confirmPassword);
    } else {
      const usernameOrEmail = (
        form.elements.namedItem("usernameOrEmail") as HTMLInputElement
      ).value;
      const password = (form.elements.namedItem("password") as HTMLInputElement)
        .value;
      onSubmit(usernameOrEmail, "", password, "");
    }
  };

  return (
    <form
      className="flex w-full flex-col gap-2"
      onSubmit={handleSubmit}
      ref={formRef}
    >
      {localError && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-500">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          {localError}
        </div>
      )}

      {isSignUp ? (
        <>
          <div className="space-y-1">
            <label className={FIELD_LABEL}>Username</label>
            <Input
              name="username"
              placeholder="Username"
              required
              autoComplete="off"
              inputClassName={FIELD_INPUT}
            />
          </div>
          <div className="space-y-1">
            <label className={FIELD_LABEL}>Email</label>
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
        <div className="space-y-1">
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

      <div className="space-y-1">
        <label className={FIELD_LABEL}>Password</label>
        <div className="relative">
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters"
            required
            autoComplete="off"
            inputClassName={`${FIELD_INPUT} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
            tabIndex={-1}
          >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </button>
        </div>
      </div>

      {isSignUp && (
        <div className="space-y-1">
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
              <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>
      )}

      <div className="pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full justify-center rounded-full border-none bg-primary font-bold text-white hover:bg-primary-600"
        >
          {isLoading ? (
            <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
          ) : isSignUp ? (
            "Sign up"
          ) : (
            "Log in"
          )}
        </Button>
      </div>

      <div className="mt-2 text-center text-sm text-white/60">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          type="button"
          onClick={onToggleMode}
          className="font-semibold text-primary transition-colors hover:text-primary-400"
        >
          {isSignUp ? "Log in" : "Sign up"}
        </button>
      </div>
    </form>
  );
};
