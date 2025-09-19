import React, { useState, useEffect } from "react";
import { Input } from "@storyteller/ui-input";
import { Button } from "@storyteller/ui-button";
import {
  faUser,
  faKey,
  faEnvelope,
  faExclamationTriangle,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ArtCraftSignUpProps {
  onSubmit: (
    username: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => void;
  isSignUp: boolean;
  onToggleMode: () => void;
  formRef?: React.RefObject<HTMLFormElement | null>;
  errorMessage?: string;
}

export const ArtCraftSignUp = ({
  onSubmit,
  isSignUp,
  onToggleMode,
  formRef,
  errorMessage,
}: ArtCraftSignUpProps) => {
  const [localError, setLocalError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (errorMessage) {
      setLocalError(
        errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1)
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

  const handleInputFocus = () => {

  };

  const handleInputBlur = () => {

  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-3 text-center">
        {isSignUp ? "Sign up for ArtCraft" : "Log in to ArtCraft"}
      </h2>
      <form
        className="flex flex-col gap-3 w-full max-w-md"
        onSubmit={handleSubmit}
        ref={formRef}
      >
        {isSignUp ? (
          <>
            <Input
              label="Username"
              icon={faUser}
              name="username"
              placeholder="Username"
              required
              autoComplete="off"
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <Input
              label="Email"
              icon={faEnvelope}
              name="email"
              type="email"
              placeholder="Email"
              required={isSignUp}
              style={isSignUp ? {} : { display: "none" }}
              autoComplete="off"
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </>
        ) : (
          <Input
            label="Email or Username"
            icon={faUser}
            name="usernameOrEmail"
            placeholder="Email or Username"
            required
            autoComplete="off"
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        )}

        <Input
          label="Password"
          icon={faKey}
          type="password"
          name="password"
          placeholder="Password"
          required
          autoComplete="off"
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
        {isSignUp && (
          <Input
            label="Confirm Password"
            icon={faKey}
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            required
            autoComplete="off"
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        )}
        <button type="submit" className="hidden" />
        <div className="relative mt-3 flex flex-col items-center justify-center">
          <div className="flex gap-2 items-center justify-center p-2 px-3 bg-white/5 rounded-lg">
            <p className="text-sm opacity-80">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            </p>
            <Button
              variant="secondary"
              className="p-0 bg-transparent hover:bg-transparent"
              type="button"
              onClick={onToggleMode}
            >
              <span className="text-sm text-primary-400 underline">
                {isSignUp ? "Log in" : "Sign up"}
              </span>
            </Button>
          </div>
          {localError && (
            <div className="absolute w-fit -bottom-12 left-1/2 -translate-x-1/2 text-red bg-red/10 border border-red/20 rounded-lg py-1 px-2 justify-center text-sm text-center mb-2 font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              {localError}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
