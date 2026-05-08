import {
  faArrowLeft,
  faEnvelope,
  faSpinnerThird,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PasswordResetApi } from "@storyteller/api";

import Seo from "../../components/seo";
import { PagePatternBackdrop } from "../../components/truchet-pattern";

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
    <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden flex flex-col">
      <Seo
        title="Reset Password - ArtCraft"
        description="Reset your ArtCraft password."
      />
      <PagePatternBackdrop variant="auth" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[700px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,129,255,0.18) 0%, transparent 70%)",
        }}
      />

      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1C1C20] border border-white/10 rounded-2xl p-6 py-8 shadow-2xl">
          {!submitted ? (
            <>
              <div className="text-center mb-8">
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
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm text-center">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wide ml-1">
                    Email or Username
                  </label>
                  <Input
                    id="reset-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    id="send-reset-btn"
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
                      "Send Reset Code"
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                <FontAwesomeIcon icon={faEnvelope} className="text-2xl" />
              </div>
              <h3 className="text-xl font-medium mb-2">Check your email</h3>
              <p className="text-white/60 text-sm mb-6">
                We've sent a password reset code to <br />
                <span className="text-white font-medium">{email}</span>
              </p>
              <Link to="/forgot-password/verify">
                <Button className="rounded-full w-full bg-primary hover:bg-primary-600 text-white border-none justify-center font-bold h-10 mb-3">
                  Enter Verification Code
                </Button>
              </Link>
              <Button
                className="rounded-full w-full bg-white/10 hover:bg-white/20 text-white border-none justify-center font-bold h-10"
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
              <FontAwesomeIcon icon={faArrowLeft} /> Back to Log in
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
