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
import { Reveal, RevealGroup } from "../../components/motion/reveal";
import { refreshSession } from "../../lib/session";
import { hasActiveSubscription } from "../../lib/billing";

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
    // Refresh the session (so the app sees the new cookie) and check the
    // subscription in parallel; users without one are pushed to pricing.
    const [, subscribed] = await Promise.all([
      refreshSession(true),
      hasActiveSubscription(),
    ]);
    navigate(subscribed ? redirectTo : "/pricing");
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

        {/* The form fields cascade in as their own beat, distinct from the
            shell/header settling. We lead with the email field on an almost-zero
            delay so the primary input lands immediately — the entrance never
            gates typing: inputs stay focusable and accept keystrokes while the
            password/button below are still cascading in. */}
        <RevealGroup
          inView={false}
          delayChildren={0.04}
          stagger={0.08}
          className="space-y-4"
        >
          <Reveal className="space-y-2">
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
          </Reveal>
          <Reveal className="space-y-2">
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
          </Reveal>

          <Reveal className="pt-2">
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
          </Reveal>
        </RevealGroup>
      </form>

      {/* Secondary sign-in options pick up the same cascade just after the
          fields (delay continues from the form group's three children above:
          0.04 + 3 × 0.08). */}
      <RevealGroup inView={false} delayChildren={0.28} stagger={0.08}>
        <Reveal className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative bg-[#1C1C20] px-4 text-xs uppercase tracking-widest text-white/40">
            or
          </span>
        </Reveal>

        <Reveal>
          <GoogleLoginButton
            mode="login"
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </Reveal>

        <Reveal>
          <AuthFooter>
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-primary transition-colors hover:text-primary-400"
            >
              Sign up
            </Link>
          </AuthFooter>
        </Reveal>
      </RevealGroup>
    </>
  );
};

export default Login;
