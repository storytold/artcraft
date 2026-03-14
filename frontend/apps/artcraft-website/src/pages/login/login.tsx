import { faEye, faEyeSlash, faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UsersApi } from "@storyteller/api";
import Seo from "../../components/seo";
import { GoogleLoginButton } from "../../components/auth";

const Login = () => {
  const navigate = useNavigate();
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
      window.dispatchEvent(new Event("auth-change"));
      navigate("/");
    } else {
      setError(response.errorMessage || "Invalid credentials");
    }
  };

  //const handleGoogleSuccess = (isNewUser: boolean) => {
  //  if (isNewUser) {
  //    // Optionally redirect to set username for new users
  //    navigate("/welcome");
  //  } else {
  //    navigate("/");
  //  }
  //};

  //const handleGoogleError = (errorMessage: string) => {
  //  setError(errorMessage);
  //};

  return (
    <div className="relative min-h-screen bg-[#101014] text-white bg-dots flex flex-col">
      <Seo
        title="Login - ArtCraft"
        description="Login to your ArtCraft account."
      />
      <div className="dotted-pattern absolute inset-0 z-[0] opacity-30" />

      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1C1C20] border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
            <p className="text-white/60 text-sm">Log in to your account</p>
          </div>

          <div className="space-y-4">
            {/*<GoogleLoginButton
              mode="login"
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
            */}

            <div className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wide ml-1">
                  Email or Username
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com or username"
                  className="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wide">
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
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary-600 text-white border-none justify-center font-bold h-12 mt-2"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
                ) : (
                  "Log in"
                )}
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-white/60">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary hover:text-primary-400 font-semibold transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </main>

      <div className="relative z-10 py-6 text-center text-white/20 text-xs">
        &copy; {new Date().getFullYear()} ArtCraft. All rights reserved.
      </div>
    </div>
  );
};

export default Login;
