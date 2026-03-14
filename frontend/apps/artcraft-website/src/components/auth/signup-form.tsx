import { faEye, faEyeSlash, faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { useState } from "react";
import { UsersApi } from "@storyteller/api";
import { GoogleLoginButton } from "./GoogleLoginButton";

interface SignupFormProps {
  onSuccess: (isNewUser?: boolean) => void;
  signupSource: string;
  className?: string;
  showGoogleButton?: boolean;
  autoFocus?: boolean;
}

export const SignupForm = ({
  onSuccess,
  signupSource,
  className = "",
  showGoogleButton = true,
  autoFocus = false,
}: SignupFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    setError(null);

    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    const api = new UsersApi();

    // Generate a username from the email
    const emailPrefix = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    // Ensure we don't exceed max length (7 chars from email + 3 digits = 10 total)
    const truncatedPrefix = emailPrefix.substring(0, 7);
    const randomSuffix = Math.floor(Math.random() * 900) + 100; // 100-999
    const generatedUsername = `${truncatedPrefix}${randomSuffix}`;

    const response = await api.Signup({
      username: generatedUsername,
      email,
      password,
      passwordConfirmation: password,
      signupSource,
      maybeReferralUrl: (window as any).cached_referrer,
    });

    setIsLoading(false);

    if (response.success) {
      window.dispatchEvent(new Event("auth-change"));
      onSuccess();
    } else {
      setError(response.errorMessage || "Failed to create account");
    }
  };

  //const handleGoogleSuccess = (isNewUser: boolean) => {
  //  onSuccess(isNewUser);
  //};

  //const handleGoogleError = (errorMessage: string) => {
  //  setError(errorMessage);
  //};

  return (
    <div className={`space-y-4 ${className}`}>
      {/* {showGoogleButton && (
        <>
          <GoogleLoginButton
            mode="signup"
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <span className="relative bg-[#1C1C20] px-4 text-xs text-white/40 uppercase tracking-widest">
              or
            </span>
          </div>
        </>
      )}
      */}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-white/60 uppercase tracking-wide ml-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoFocus={autoFocus}
          className="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors"
          onKeyDown={(e) => e.key === "Enter" && handleSignup()}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-white/60 uppercase tracking-wide ml-1">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors pr-12"
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            tabIndex={-1}
          >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </button>
        </div>
      </div>

      <Button
        className="w-full bg-primary hover:bg-primary-600 text-white border-none justify-center font-bold h-12 mt-2"
        onClick={handleSignup}
        disabled={isLoading}
      >
        {isLoading ? (
          <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
        ) : (
          "Create Account"
        )}
      </Button>
    </div>
  );
};
