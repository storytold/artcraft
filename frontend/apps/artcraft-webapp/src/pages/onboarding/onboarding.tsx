import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faInfoCircle,
  faSpinnerThird,
} from "@fortawesome/pro-solid-svg-icons";
import Seo from "../../components/seo";
import { UsersApi, BillingApi } from "@storyteller/api";

interface OnboardingData {
  email_not_set: boolean;
  email_not_confirmed: boolean;
  password_not_set: boolean;
  username_not_customized: boolean;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect_to") || "/checkout/success";

  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<
    "email" | "password" | "username" | "complete"
  >("email");
  const [isNewAccount, setIsNewAccount] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const getSuccessUrl = (afterUsernameStep = false) => {
    // If redirecting to success, append parameter
    const decodedRedirect = decodeURIComponent(redirectTo);
    if (decodedRedirect.includes("/checkout/success")) {
      const separator = decodedRedirect.includes("?") ? "&" : "?";
      return `${decodedRedirect}${separator}onboarding_complete=true`;
    }
    // If redirecting to checkout/cancel and we've completed username step, add skip_onboarding
    if (decodedRedirect.includes("/checkout/cancel") && afterUsernameStep) {
      const separator = decodedRedirect.includes("?") ? "&" : "?";
      return `${decodedRedirect}${separator}skip_onboarding=true`;
    }
    return decodedRedirect;
  };

  const getRedirectMessage = () => {
    const decodedRedirect = decodeURIComponent(redirectTo);
    if (decodedRedirect === "/") return "Redirecting you to the home page...";
    if (decodedRedirect === "/pricing")
      return "Redirecting you to view plans...";
    if (decodedRedirect.includes("success"))
      return "Redirecting you to your download...";
    return "Redirecting you...";
  };

  const handleCompletion = async (afterUsernameStep = false) => {
    const targetUrl = getSuccessUrl(afterUsernameStep);

    // If heading to success/download, verify subscription first
    if (targetUrl.includes("success") || targetUrl.includes("download")) {
      try {
        const billingApi = new BillingApi();
        const subResponse = await billingApi.ListActiveSubscriptions();

        if (subResponse.success && subResponse.data) {
          const hasActiveSub = subResponse.data.active_subscriptions.length > 0;
          if (!hasActiveSub) {
            navigate("/pricing");
            return;
          }
        }
      } catch (e) {}
    }

    // Determine step complete immediately
    setCurrentStep("complete");
    setTimeout(() => navigate(targetUrl), 2000);
  };

  const checkOnboardingStatus = async () => {
    try {
      const usersApi = new UsersApi();
      const sessionResponse = await usersApi.GetSession();

      if (!sessionResponse.success || !sessionResponse.data?.loggedIn) {
        navigate("/");
        return;
      }

      const onboarding = sessionResponse.data.onboarding;

      // If onboarding is undefined, assume full onboarding is needed (new account)
      if (!onboarding) {
        setOnboardingData({
          email_not_set: true,
          email_not_confirmed: true,
          password_not_set: true,
          username_not_customized: true,
        });
        setCurrentStep("email");
        setIsNewAccount(true);
        setIsLoading(false);
        return;
      }

      // If all onboarding fields are false, no onboarding needed
      if (
        !onboarding.password_not_set &&
        !onboarding.email_not_set &&
        !onboarding.email_not_confirmed &&
        !onboarding.username_not_customized
      ) {
        await handleCompletion();
        return;
      }

      setOnboardingData(onboarding);

      // Determine if this looks like a new account that needs setup
      if (onboarding.password_not_set) {
        setIsNewAccount(true);
      }

      // Determine the first step needed - prioritize email, then password, then username
      if (onboarding.email_not_set) {
        setCurrentStep("email");
      } else if (onboarding.password_not_set) {
        setCurrentStep("password");
      } else if (onboarding.username_not_customized) {
        setCurrentStep("username");
      } else {
        // All done!
        await handleCompletion();
      }
    } catch (err) {
      // console.error("❌ Error checking onboarding status:", err);
      navigate(getSuccessUrl());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const usersApi = new UsersApi();

      if (currentStep === "email") {
        const response = await usersApi.EditEmail({
          emailAddress: email,
        });

        if (!response.success) {
          const errorMsg = response.errorMessage || "Failed to set email";
          throw new Error(errorMsg);
        }

        // Immediately update local state to reflect that email is now set
        const updatedOnboardingData = {
          ...onboardingData!,
          email_not_set: false,
        };
        setOnboardingData(updatedOnboardingData);

        // Re-fetch session to get updated onboarding state from backend
        const sessionResponse = await usersApi.GetSession();
        if (sessionResponse.success && sessionResponse.data?.onboarding) {
          const backendOnboarding = sessionResponse.data.onboarding;
          setOnboardingData(backendOnboarding);

          // Determine next step based on actual backend state
          if (backendOnboarding.password_not_set) {
            setCurrentStep("password");
          } else if (backendOnboarding.username_not_customized) {
            setCurrentStep("username");
          } else {
            await handleCompletion();
          }
        } else {
          // Fallback to our locally updated state if session fetch fails
          if (updatedOnboardingData.password_not_set) {
            setCurrentStep("password");
          } else if (updatedOnboardingData.username_not_customized) {
            setCurrentStep("username");
          } else {
            await handleCompletion();
          }
        }
        setEmail("");
      } else if (currentStep === "password") {
        if (password !== passwordConfirmation) {
          setError("Passwords do not match");
          setIsSubmitting(false);
          return;
        }

        const response = await usersApi.ChangePassword({
          password,
          passwordConfirmation,
        });

        if (!response.success) {
          const errorMsg = response.errorMessage || "Failed to set password";
          throw new Error(errorMsg);
        }

        // Immediately update local state to reflect that password is now set
        const updatedOnboardingData = {
          ...onboardingData!,
          password_not_set: false,
        };
        setOnboardingData(updatedOnboardingData);

        // Re-fetch session to get updated onboarding state from backend
        const sessionResponse = await usersApi.GetSession();
        if (sessionResponse.success && sessionResponse.data?.onboarding) {
          const backendOnboarding = sessionResponse.data.onboarding;
          setOnboardingData(backendOnboarding);

          // Determine next step based on actual backend state
          if (backendOnboarding.username_not_customized) {
            setCurrentStep("username");
          } else {
            await handleCompletion();
          }
        } else {
          // Fallback to our locally updated state if session fetch fails
          if (updatedOnboardingData.username_not_customized) {
            setCurrentStep("username");
          } else {
            await handleCompletion();
          }
        }
        setPassword("");
        setPasswordConfirmation("");
      } else if (currentStep === "username") {
        const response = await usersApi.EditUsername({
          displayName: username,
        });

        if (!response.success) {
          const errorMsg = response.errorMessage || "Failed to set username";
          throw new Error(errorMsg);
        }

        // Immediately update local state to reflect that username is now customized
        setOnboardingData({
          ...onboardingData!,
          username_not_customized: false,
        });

        await handleCompletion(true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (currentStep === "username") {
      // Username is low priority, can skip
      await handleCompletion(true);
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-[#101014] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (currentStep === "complete") {
    return (
      <div className="relative min-h-screen bg-[#101014] text-white">
        <Seo
          title="Setup Complete - ArtCraft"
          description="Your account setup is complete."
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-green-500/40 via-primary/30 to-purple-600/20 opacity-40 blur-[120px]"></div>
        </div>

        <main className="relative z-10 pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-5xl text-green-400"
                />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-medium mb-4 text-white">
              All Set!
            </h1>
            <p className="text-lg text-white/70 mb-8">{getRedirectMessage()}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#101014] text-white">
      <Seo
        title="Complete Your Setup - ArtCraft"
        description="Just a few more details to get you started with ArtCraft."
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-20 blur-[120px]"></div>
      </div>

      <main className="relative z-10 pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="max-w-md w-full">
          {isNewAccount && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-start gap-3 animate-fade-in shadow-lg shadow-blue-900/10">
              <FontAwesomeIcon
                icon={faInfoCircle}
                className="text-blue-400 mt-1 flex-shrink-0 text-lg"
              />
              <div>
                <h3 className="text-blue-200 font-medium mb-1">
                  Account Created
                </h3>
                <p className="text-blue-300/80 text-sm leading-relaxed">
                  We've automatically created an account for you. Please
                  complete your setup below to secure it.
                </p>
              </div>
            </div>
          )}

          <div className="bg-[#1C1C20] border border-white/10 rounded-2xl p-6 py-8 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold mb-2">
                {currentStep === "password" &&
                  (isNewAccount ? "Secure Your Account" : "Set Your Password")}
                {currentStep === "email" &&
                  (isNewAccount
                    ? "Complete Your Profile"
                    : "Verify Your Email")}
                {currentStep === "username" && "Choose A Username"}
              </h1>
              <p className="text-white/60 text-sm">
                {currentStep === "password" &&
                  "Create a password to access your account across devices."}
                {currentStep === "email" &&
                  (isNewAccount
                    ? "Enter your email address to secure your account and receive important updates."
                    : "Please provide a valid email address for your account updates.")}
                {currentStep === "username" &&
                  "Pick a unique display name for the community (optional)."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}

              {currentStep === "password" && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wide ml-1">
                      Password
                    </label>
                    <Input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors"
                      placeholder="Enter your password"
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wide ml-1">
                      Confirm Password
                    </label>
                    <Input
                      type="password"
                      id="passwordConfirmation"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required
                      inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors"
                      placeholder="Confirm your password"
                      minLength={8}
                    />
                  </div>
                </>
              )}

              {currentStep === "email" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wide ml-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              )}

              {currentStep === "username" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wide ml-1">
                    Username
                  </label>
                  <Input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors"
                    placeholder="Your display name"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-600 text-white border-none justify-center font-bold h-10"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <FontAwesomeIcon
                      icon={faSpinnerThird}
                      className="animate-spin"
                    />
                  ) : (
                    "Continue"
                  )}
                </Button>
                {currentStep === "username" && (
                  <Button
                    type="button"
                    onClick={handleSkip}
                    className="bg-white/10 hover:bg-white/20 text-white border-none justify-center font-bold h-10 px-6"
                  >
                    Skip
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
