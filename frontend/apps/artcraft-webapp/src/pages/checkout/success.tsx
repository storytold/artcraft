import {
  faCheckCircle,
  faDownload,
  faDesktop,
  faRocket,
} from "@fortawesome/pro-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { Link, useSearchParams } from "react-router-dom";
import { isMobile, isMacOs } from "react-device-detect";
import { DOWNLOAD_LINKS } from "../../config/github_download_links";
import { SOCIAL_LINKS } from "../../config/links";
import Seo from "../../components/seo";
import { UsersApi } from "@storyteller/api";
import { useEffect, useState } from "react";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const downloadUrl = isMacOs ? DOWNLOAD_LINKS.MACOS : DOWNLOAD_LINKS.WINDOWS;
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      // If coming from completed onboarding, skip the check
      if (searchParams.get("onboarding_complete") === "true") {
        setIsCheckingOnboarding(false);
        return;
      }

      try {
        const usersApi = new UsersApi();
        const sessionResponse = await usersApi.GetSession();

        if (sessionResponse.success && sessionResponse.data?.loggedIn) {
          const onboarding = sessionResponse.data.onboarding;

          // If onboarding is undefined or has any required fields not set, redirect to onboarding
          // This handles the case where the backend hasn't populated onboarding data yet
          if (
            !onboarding ||
            onboarding.password_not_set ||
            onboarding.email_not_set ||
            onboarding.email_not_confirmed
          ) {
            // Use window.location for a hard redirect to ensure it works
            // Include redirect_to so user comes back here after onboarding
            // Do NOT set isCheckingOnboarding to false - keep showing loading spinner
            window.location.href =
              "/onboarding?redirect_to=" +
              encodeURIComponent("/checkout/success");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }

      // Only set loading to false if we're actually staying on this page
      setIsCheckingOnboarding(false);
    };

    checkOnboarding();
  }, [searchParams]);

  if (isCheckingOnboarding) {
    return (
      <div className="relative min-h-screen bg-[#101014] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#101014] text-white">
      <Seo
        title="Payment Successful - ArtCraft"
        description="Your ArtCraft subscription is now active. Download and start creating!"
      />

      {/* Background gradient - celebratory green/purple */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-green-500/40 via-primary/30 to-purple-600/20 opacity-40 blur-[120px]"></div>
      </div>

      <main className="relative z-10 pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        {/* Success Card */}
        <div className="max-w-2xl w-full">
          <div className="bg-[#1A1A1E] border border-white/10 rounded-3xl p-8 md:p-12 text-center">
            {/* Success Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-5xl text-green-400"
                />
              </div>
            </div>

            {/* Header */}
            <h1 className="text-3xl md:text-4xl font-medium mb-4 text-white">
              Thank You for Your Support!
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-md mx-auto">
              Your subscription is now active. Thank you for helping keep
              ArtCraft open-source and free for everyone. You're now ready to
              create amazing AI-generated art!
            </p>

            {/* Next Steps */}
            <div className="bg-[#252529] rounded-2xl p-6 mb-8 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faRocket}
                    className="text-primary text-sm"
                  />
                </div>
                <h2 className="text-lg font-medium text-white">Next Steps</h2>
              </div>

              <div className="space-y-3">
                {[
                  "Download ArtCraft if you haven't already",
                  "Log in with your account",
                  "Your subscription is automatically activated",
                  "Start creating with all premium features!",
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 shrink-0 rounded-full bg-primary/50 flex items-center justify-center text-xs font-bold text-white mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-white/80">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            {!isMobile ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  as="link"
                  href={downloadUrl}
                  className="rounded-full bg-primary hover:bg-primary-600 px-8 py-3 text-sm font-bold rounded-xl justify-center"
                >
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Download ArtCraft
                </Button>
              </div>
            ) : (
              <div className="bg-[#431407] border border-orange-900/50 rounded-2xl p-6 text-orange-200 text-sm leading-relaxed">
                <div className="flex items-center justify-center mb-3 text-orange-400">
                  <FontAwesomeIcon icon={faDesktop} className="text-2xl" />
                </div>
                ArtCraft is a desktop application. <br />
                Please head to your computer to download and start creating.
              </div>
            )}

            {/* Download Links */}
            {!isMobile && (
              <div className="mt-6 flex justify-center gap-6 text-sm font-medium text-white/40">
                <a
                  href={DOWNLOAD_LINKS.WINDOWS}
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  Windows
                </a>
                <a
                  href={DOWNLOAD_LINKS.MACOS}
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  Mac
                </a>
              </div>
            )}

            {/* Discord CTA */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-2 items-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-white/70 text-sm">
                  Join our community
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
              to="/pricing"
              className="text-white/40 hover:text-white text-sm font-medium transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutSuccess;
