import {
  faArrowLeft,
  faEye,
  faEyeSlash,
  faSpinnerThird,
  faCheckCircle,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PasswordResetApi, BillingApi } from "@storyteller/api";

import Seo from "../../components/seo";
import { PagePatternBackdrop } from "../../components/truchet-pattern";

const VerifyReset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-fill token from URL query param if present
  const tokenFromUrl = searchParams.get("token") || "";

  const [verificationCode, setVerificationCode] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/");
  const [redirectLabel, setRedirectLabel] = useState("Back to Homepage");

  const handleRedeemReset = async () => {
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!verificationCode.trim()) {
      errors.verificationCode = "Verification code is required.";
    }
    if (!newPassword) {
      errors.newPassword = "New password is required.";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters.";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    const api = new PasswordResetApi();
    const response = await api.RedeemPasswordReset({
      resetToken: verificationCode.trim(),
      newPassword: newPassword,
      newPasswordValidation: confirmPassword,
    });

    setIsLoading(false);

    if (response.success) {
      setSuccess(true);
      window.dispatchEvent(new Event("auth-change"));

      // Check if user has an active subscription to decide redirect
      try {
        const billingApi = new BillingApi();
        const billingResponse = await billingApi.ListActiveSubscriptions();
        if (
          billingResponse.success &&
          billingResponse.data &&
          billingResponse.data.active_subscriptions.length > 0
        ) {
          setRedirectTo("/");
          setRedirectLabel("Back to Homepage");
        } else {
          setRedirectTo("/pricing");
          setRedirectLabel("Continue");
        }
      } catch {
        // Default to homepage if billing check fails
        setRedirectTo("/");
        setRedirectLabel("Back to Homepage");
      }
    } else {
      setError(
        response.errorMessage ||
          "Failed to reset password. Please check your code and try again.",
      );
    }
  };

  return (
    <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden flex flex-col">
      <Seo
        title="Verify Password Reset - ArtCraft"
        description="Enter your verification code and new password."
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
          {!success ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold mb-2">
                  Password Reset Verification
                </h1>
                <p className="text-white/60 text-sm">
                  Enter the code sent to your email address.
                </p>
              </div>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRedeemReset();
                }}
              >
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Verification Code */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wide ml-1">
                    Verification Code
                  </label>
                  <Input
                    id="verification-code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter verification code"
                    isError={!!fieldErrors.verificationCode}
                    inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors"
                  />
                  {fieldErrors.verificationCode && (
                    <p className="text-red-400 text-xs ml-1">
                      {fieldErrors.verificationCode}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wide ml-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      isError={!!fieldErrors.newPassword}
                      inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      <FontAwesomeIcon
                        icon={showNewPassword ? faEyeSlash : faEye}
                      />
                    </button>
                  </div>
                  {fieldErrors.newPassword && (
                    <p className="text-red-400 text-xs ml-1">
                      {fieldErrors.newPassword}
                    </p>
                  )}
                </div>

                {/* Verify New Password */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wide ml-1">
                    Verify New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Enter new password again"
                      isError={!!fieldErrors.confirmPassword}
                      inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      <FontAwesomeIcon
                        icon={showConfirmPassword ? faEyeSlash : faEye}
                      />
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-red-400 text-xs ml-1">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    id="change-password-btn"
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
                      "Change Password"
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-8 text-center text-sm">
                <Link
                  to="/forgot-password"
                  className="text-white/40 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faArrowLeft} /> Request a new code
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-2xl" />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  Password Reset Successfully
                </h3>
                <p className="text-white/60 text-sm mb-8">
                  Your password has been changed and you've been logged in
                  successfully.
                </p>
                <Button
                  id="back-to-homepage-btn"
                  className="rounded-full w-full bg-primary hover:bg-primary-600 text-white border-none justify-center font-bold h-10"
                  onClick={() => navigate(redirectTo)}
                >
                  {redirectLabel}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      <div className="relative z-10 py-6 text-center text-white/20 text-xs">
        &copy; {new Date().getFullYear()} ArtCraft. All rights reserved.
      </div>
    </div>
  );
};

export default VerifyReset;
