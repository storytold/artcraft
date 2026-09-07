import { useEffect, useState } from "react";
import { CircleCheckIcon, ReceiptTextIcon } from "lucide-react";
import { DiscordIcon } from "@storyteller/icons";
import { Button } from "@storyteller/ui-button";
import { Link } from "react-router-dom";
import { BillingApi, UsersApi } from "@storyteller/api";
import { SOCIAL_LINKS } from "../../config/links";
import Seo from "../../components/seo";

// Friendly names for the artcraft product slugs returned by the billing API.
const PLAN_DISPLAY_NAMES: Record<string, string> = {
  artcraft_basic: "Basic",
  artcraft_pro: "Pro",
  artcraft_max: "Max",
};

// Landing page for the Stripe billing portal's return URL (/portal_closed).
// The portal is used both for switching plans and for simply viewing billing,
// so unlike Stripe Checkout there is no success/cancel distinction: a user who
// just upgraded and a user who closed the tab arrive here the same way. We
// look up the account's actual subscription state instead of guessing, so an
// upgraded user never sees a "Checkout Cancelled" screen.
const CheckoutPortalReturn = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activePlanName, setActivePlanName] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const session = await new UsersApi().GetSession();
        if (session.success && session.data?.loggedIn && session.data?.user) {
          const subs = await new BillingApi().ListActiveSubscriptions();
          const artcraftSub = subs.data?.active_subscriptions?.find(
            (sub) => sub.namespace === "artcraft",
          );
          if (subs.success && artcraftSub) {
            setActivePlanName(
              PLAN_DISPLAY_NAMES[artcraftSub.product_slug] ||
                artcraftSub.product_slug,
            );
          }
        }
      } catch (error) {
        console.error("Error fetching subscription state:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlan();
  }, []);

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-[#101014] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const hasPlan = !!activePlanName;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#101014] text-white">
      <Seo
        title="Billing Updated - ArtCraft"
        description="You've returned from the billing portal."
      />

      {/* Background gradient: green when we can confirm an active plan,
          neutral otherwise. */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div
          className={
            hasPlan
              ? "w-[900px] h-[900px] rounded-full bg-gradient-to-br from-green-500/40 via-primary/30 to-purple-600/20 opacity-40 blur-[120px]"
              : "w-[900px] h-[900px] rounded-full bg-gradient-to-br from-gray-500/20 via-gray-600/10 to-gray-700/5 opacity-40 blur-[120px]"
          }
        ></div>
      </div>

      <main className="relative z-10 pt-20 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="max-w-lg w-full">
          <div className="bg-[#1A1A1E] border border-white/10 rounded-3xl p-8 md:p-12 text-center">
            {/* Icon */}
            <div className="mb-6">
              <div
                className={
                  hasPlan
                    ? "w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center"
                    : "w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center"
                }
              >
                {hasPlan ? (
                  <CircleCheckIcon className="text-5xl text-green-400" />
                ) : (
                  <ReceiptTextIcon className="text-5xl text-white/50" />
                )}
              </div>
            </div>

            {/* Header */}
            <h1 className="text-3xl md:text-4xl font-medium mb-4 text-white">
              {hasPlan
                ? `You're on the ${activePlanName} plan`
                : "Billing Session Closed"}
            </h1>
            <p className="text-lg text-white/60 mb-8 max-w-md mx-auto">
              {hasPlan
                ? "Your billing session is complete. If you switched plans, the change has been applied to your account."
                : "You've left the billing portal. No changes? You can review the plans anytime."}
            </p>

            {/* Info Box */}
            <div className="bg-[#252529] rounded-2xl p-5 mb-8 text-left">
              <p className="text-white/70 text-sm">
                {hasPlan ? (
                  <>
                    <span className="text-white font-medium">
                      Switched plans?
                    </span>{" "}
                    If your credit adjustments don't appear, please contact us
                    on Discord.
                  </>
                ) : (
                  <>
                    <span className="text-white font-medium">
                      Changed your mind?
                    </span>{" "}
                    No problem. You can return to the pricing page to manage
                    your subscription at any time.
                  </>
                )}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {hasPlan ? (
                <Button
                  as="link"
                  href="/"
                  className="rounded-full bg-primary hover:bg-primary-600 px-8 py-3 text-sm font-bold rounded-xl justify-center"
                >
                  Start Creating
                </Button>
              ) : (
                <Button
                  as="link"
                  href="/pricing"
                  className="rounded-full bg-primary hover:bg-primary-600 px-8 py-3 text-sm font-bold rounded-xl justify-center"
                >
                  View Plans
                </Button>
              )}
            </div>

            {/* Discord CTA */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-2 items-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-white/70 text-sm">
                  {hasPlan
                    ? "Questions about your plan?"
                    : "Need help deciding?"}
                </span>
              </div>
              <Button
                as="link"
                href={SOCIAL_LINKS.DISCORD}
                target="_blank"
                className="rounded-full bg-white text-black hover:bg-white/80 px-4 py-2 text-sm font-bold rounded-xl justify-center border-transparent"
              >
                <DiscordIcon />
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

export default CheckoutPortalReturn;
