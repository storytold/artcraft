import { ArrowLeftIcon, LoaderCircleIcon, MailIcon } from "lucide-react";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PasswordResetApi } from "@storyteller/api";

import Seo from "../../components/seo";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleRequestReset = async () => {
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email or username.");
      return;
    }

    setIsLoading(true);

    const api = new PasswordResetApi();
    const response = await api.RequestPasswordReset({
      usernameOrEmail: email.trim(),
    });

    setIsLoading(false);

    if (response.success) {
      setSubmitted(true);
    } else {
      setError(
        response.errorMessage ||
          "Failed to send reset email. Please try again.",
      );
    }
  };

  return (
    <div className="relative min-h-screen bg-ui-background text-white overflow-hidden flex flex-col">
      <Seo
        title="Reset Password - ArtCraft"
        description="Reset your ArtCraft password."
      />

      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#101014] border border-white/15 p-6 py-8">
          {!submitted ? (
            <>
              <div className="text-center mb-8">
                <img
                  src="/images/artcraft-icon.png"
                  alt="ArtCraft"
                  className="mx-auto mb-6 h-12 w-auto select-none pointer-events-none"
                  draggable={false}
                />
                <h1 className="text-2xl font-semibold mb-2">Reset Password</h1>
                <p className="text-white/60 text-sm">
                  Enter your email to receive reset instructions
                </p>
              </div>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRequestReset();
                }}
              >
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 text-sm text-center">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60 ml-1">
                    Email or Username
                  </label>
                  <Input
                    id="reset-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    inputClassName="w-full bg-ui-controls border border-white/15 focus:border-white/40 px-4 py-3 text-white placeholder-white/20 outline-none transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    id="send-reset-btn"
                    className="w-full justify-center h-10"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      "Send Reset Code"
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 border border-white/15 bg-green-500/10 flex items-center justify-center mx-auto mb-4 text-green-500">
                <MailIcon className="text-2xl" />
              </div>
              <h3 className="text-xl font-medium mb-2">Check your email</h3>
              <p className="text-white/60 text-sm mb-6">
                We've sent a password reset code to <br />
                <span className="text-white font-medium">{email}</span>
              </p>
              <Link to="/forgot-password/verify">
                <Button className="w-full justify-center h-10 mb-3">
                  Enter Verification Code
                </Button>
              </Link>
              <Button
                className="w-full bg-transparent border border-white/15 hover:bg-white/10 text-white justify-center h-10"
                onClick={() => setSubmitted(false)}
              >
                Try another email
              </Button>
            </div>
          )}

          <div className="mt-8 text-center text-sm">
            <Link
              to="/login"
              className="text-white/40 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeftIcon /> Back to Log in
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

export default ForgotPassword;
