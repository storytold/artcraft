import { faXmarkCircle } from "@fortawesome/pro-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { Link, useSearchParams } from "react-router-dom";
import { SOCIAL_LINKS } from "../../config/links";
import Seo from "../../components/seo";
import { PagePatternBackdrop } from "../../components/truchet-pattern";
import { useEffect, useState } from "react";
import { UsersApi } from "@storyteller/api";

const CheckoutCancel = () => {
  const [searchParams] = useSearchParams();
  const skipOnboarding = searchParams.get("skip_onboarding") === "true";
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      // Skip onboarding check if we already went through it
      if (skipOnboarding) {
        setIsLoading(false);
        return;
      }

      try {
        const usersApi = new UsersApi();
        const sessionResponse = await usersApi.GetSession();

        if (sessionResponse.success && sessionResponse.data?.loggedIn) {
          const onboarding = sessionResponse.data.onboarding;

          // If onboarding is undefined or has any required fields not set, redirect to onboarding
          if (
            !onboarding ||
            onboarding.password_not_set ||
            onboarding.email_not_set ||
            onboarding.email_not_confirmed
          ) {
            // Redirect to onboarding - it will add skip_onboarding=true after username step
            window.location.href =
              "/onboarding?redirect_to=" +
              encodeURIComponent("/checkout/cancel");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboarding();
  }, [skipOnboarding]);

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-[#101014] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#101014] text-white">
      <Seo
        title="Checkout Cancelled - ArtCraft"
        description="Your checkout was cancelled. No payment was made."
      />

      <PagePatternBackdrop variant="auth" />

      {/* Background gradient - subtle/neutral */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-gray-500/20 via-gray-600/10 to-gray-700/5 opacity-40 blur-[120px]"></div>
      </div>

      <main className="relative z-10 pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        {/* Cancel Card */}
        <div className="max-w-lg w-full">
          <div className="bg-[#1A1A1E] border border-white/10 rounded-3xl p-8 md:p-12 text-center">
            {/* Cancel Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faXmarkCircle}
                  className="text-5xl text-white/50"
                />
              </div>
            </div>

            {/* Header */}
            <h1 className="text-3xl md:text-4xl font-medium mb-4 text-white">
              Checkout Cancelled
            </h1>
            <p className="text-lg text-white/60 mb-8 max-w-md mx-auto">
              No worries! Your checkout was cancelled and no payment was made.
              You can try again whenever you're ready.
            </p>

            {/* Info Box */}
            <div className="bg-[#252529] rounded-2xl p-5 mb-8 text-left">
              <p className="text-white/70 text-sm">
                <span className="text-white font-medium">
                  Changed your mind?
                </span>{" "}
                No problem. You can return to the pricing page to complete your
                purchase at any time.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                as="link"
                href="/pricing"
                className="rounded-full bg-primary hover:bg-primary-600 px-8 py-3 text-sm font-bold rounded-xl justify-center"
              >
                View Plans Again
              </Button>
            </div>

            {/* Discord CTA */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-2 items-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-white/70 text-sm">
                  Need help deciding?
                </span>
              </div>
              <Button
                as="link"
                href={SOCIAL_LINKS.DISCORD}
                target="_blank"
                className="rounded-full bg-white text-black hover:bg-white/80 px-4 py-2 text-sm font-bold rounded-xl justify-center border-transparent"
              >
                <FontAwesomeIcon icon={faDiscord} />
                Join Discord
              </Button>
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-center mt-8 flex justify-center gap-4">
            <Link
              to="/"
              className="text-white/40 hover:text-white text-sm font-medium transition-colors"
            >
              Back to Home
            </Link>
            <span className="text-white/20">•</span>
            <Link
              to="/faq"
              className="text-white/40 hover:text-white text-sm font-medium transition-colors"
            >
              FAQ
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutCancel;
