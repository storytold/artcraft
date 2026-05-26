import {
  faEye,
  faEyeSlash,
  faSpinnerThird,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UsersApi } from "@storyteller/api";
import { AuthHeader, AuthFooter, GoogleLoginButton } from "../../components/auth";
import Seo from "../../components/seo";
import { refreshSession, useSessionStore } from "../../lib/session";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("from");
  const redirectTo = fromParam && fromParam.startsWith("/") ? fromParam : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setIsLoading(true);

    const api = new UsersApi();
    const response = await api.Login({
      usernameOrEmail: email,
      password: password,
    });

    setIsLoading(false);

    if (response.success) {
      // Wait for the session store to actually reflect the new cookie before
      // navigating — otherwise RequireAuth on the destination sees loggedIn=false
      // and bounces straight back to /login?from=…
      await refreshSession(true);
      navigate(redirectTo);
    } else {
      setError(response.errorMessage || "Invalid credentials");
    }
  };

  const handleGoogleSuccess = async () => {
    // Refresh so the session store reflects the new cookie (and whether the
    // account still needs a password) before deciding where to send them.
    await refreshSession(true);
    if (useSessionStore.getState().passwordNotSet) {
      // New SSO users skip setting a password and go straight to pricing.
      navigate("/pricing");
    } else {
      navigate(redirectTo);
    }
  };

  const handleGoogleError = (message: string) => {
    setError(message);
  };

  return (
    <>
      <Seo
        title="Login - ArtCraft"
        description="Login to your ArtCraft account."
      />
      <AuthHeader title="Welcome Back" subtitle="Log in to your account" />

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
      >
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/70 ml-1">
            Email or Username
          </label>
          <Input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com or username"
            inputClassName="w-full bg-black/40 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors"
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-xs font-semibold text-white/70">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:text-primary-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              inputClassName="w-full bg-black/40 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors pr-12"
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

        <div className="pt-2">
          <Button
            className="rounded-full w-full bg-primary hover:bg-primary-600 text-white border-none justify-center font-bold h-10"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
            ) : (
              "Log in"
            )}
          </Button>
        </div>
      </form>

      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <span className="relative bg-[#1C1C20] px-4 text-xs uppercase tracking-widest text-white/40">
          or
        </span>
      </div>

      <GoogleLoginButton
        mode="login"
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
      />

      <AuthFooter>
        Don't have an account?{" "}
        <Link
          to="/signup"
          className="font-semibold text-primary transition-colors hover:text-primary-400"
        >
          Sign up
        </Link>
      </AuthFooter>
    </>
  );
};

export default Login;
