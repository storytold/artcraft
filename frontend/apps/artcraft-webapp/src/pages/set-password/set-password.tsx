import {
  faEye,
  faEyeSlash,
  faSpinnerThird,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { UsersApi } from "@storyteller/api";
import { useSession, refreshSession } from "../../lib/session";
import Seo from "../../components/seo";
import { toast } from "../../components/toast/toast";

const SetPassword = () => {
  const navigate = useNavigate();
  const { loggedIn, authChecked, passwordNotSet } = useSession();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only meant for a signed-in user who has no password yet (the Google SSO
  // sign-up case). Wait for the session check, then send everyone else home —
  // this covers direct navigation and stops an existing user (who already has
  // a password) from being misrouted here.
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101014]">
        <FontAwesomeIcon
          icon={faSpinnerThird}
          className="animate-spin text-4xl text-primary/80"
        />
      </div>
    );
  }
  if (!loggedIn || !passwordNotSet) {
    return <Navigate to="/" replace />;
  }

  const handleSetPassword = async () => {
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    const api = new UsersApi();
    const response = await api.ChangePassword({
      password,
      passwordConfirmation: confirmPassword,
    });

    setIsLoading(false);

    if (response.success) {
      toast.success("Password has been set");
      await refreshSession(true);
      navigate("/welcome");
    } else {
      setError(response.errorMessage || "Failed to set password");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden flex flex-col">
      <Seo
        title="Set Password - ArtCraft"
        description="Set a password for your ArtCraft account."
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[700px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,129,255,0.18) 0%, transparent 70%)",
        }}
      />

      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1C1C20] border border-white/[4%] rounded-2xl p-6 py-8 shadow-2xl">
          <div className="text-center mb-8">
            <img
              src="/images/artcraft-icon.png"
              alt="ArtCraft"
              className="mx-auto mb-6 h-12 w-auto select-none pointer-events-none"
              draggable={false}
            />
            <h1 className="text-2xl font-semibold mb-2">Set a password</h1>
            <p className="text-white/60 text-sm">
              Create a password so you can also log into the desktop app
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSetPassword();
            }}
          >
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/60 uppercase tracking-wide ml-1">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoFocus
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

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/60 uppercase tracking-wide ml-1">
                Confirm password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  inputClassName="w-full bg-black/40 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  <FontAwesomeIcon
                    icon={showConfirmPassword ? faEyeSlash : faEye}
                  />
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
                  <FontAwesomeIcon
                    icon={faSpinnerThird}
                    className="animate-spin"
                  />
                ) : (
                  "Set password"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <div className="relative z-10 py-6 text-center text-white/20 text-xs">
        &copy; {new Date().getFullYear()} ArtCraft. All rights reserved.
      </div>
    </div>
  );
};

export default SetPassword;
