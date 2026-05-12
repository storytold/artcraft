import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { UsersApi } from "@storyteller/api";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

interface GoogleLoginButtonProps {
  onSuccess: (isNewUser: boolean) => void;
  onError: (error: string) => void;
  mode?: "login" | "signup";
  className?: string;
}

export function GoogleLoginButton({
  onSuccess,
  onError,
  mode = "login",
  className = "",
}: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    if (!credentialResponse.credential) {
      onError("No credential received from Google");
      return;
    }

    setIsLoading(true);
    try {
      const api = new UsersApi();
      const result = await api.GoogleSSO({
        credential: credentialResponse.credential,
        maybeReferralUrl: (window as any).cached_referrer,
        maybeLandingUrl: (window as any).cached_landing_url,
      });
      if (result.success) {
        window.dispatchEvent(new Event("auth-change"));
        onSuccess(result.data?.usernameNotYetCustomized ?? false);
      } else {
        onError(result.errorMessage || "Authentication failed");
      }
    } catch (err) {
      onError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative w-full h-12 ${className}`}>
      {/* Custom visual button - shown behind */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center gap-3 bg-white text-black rounded-lg font-medium border border-gray-200 hover:bg-gray-50 transition-colors">
        {isLoading ? (
          <FontAwesomeIcon
            icon={faSpinnerThird}
            className="animate-spin text-lg text-gray-600"
          />
        ) : (
          <>
            <GoogleIcon />
            <span>Continue with Google</span>
          </>
        )}
      </div>

      {/* Google's actual button - invisible overlay that receives clicks */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden cursor-pointer flex items-center justify-center"
        style={{ opacity: 0.01, zIndex: 10, transform: "scaleY(1.2)" }}
      >
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => onError("Google login failed")}
          size="large"
          width={400}
          text="continue_with"
        />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
