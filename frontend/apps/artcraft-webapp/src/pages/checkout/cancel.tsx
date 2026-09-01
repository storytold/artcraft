import { CircleXIcon } from "lucide-react";
import { DiscordIcon } from "@storyteller/icons";
import { Button } from "@storyteller/ui-button";
import { Link } from "react-router-dom";
import { SOCIAL_LINKS } from "../../config/links";
import Seo from "../../components/seo";

const CheckoutCancel = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ui-background text-white">
      <Seo
        title="Checkout Cancelled - ArtCraft"
        description="Your checkout was cancelled. No payment was made."
      />

      <main className="relative z-10 pt-20 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        {/* Cancel Card */}
        <div className="max-w-lg w-full">
          <div className="bg-[#101014] border border-white/15 p-8 md:p-12 text-center">
            {/* Cancel Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto border border-white/15 bg-white/10 flex items-center justify-center">
                <CircleXIcon
                  
                  className="text-5xl text-white/50" />
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
            <div className="bg-ui-controls border border-white/15 p-5 mb-8 text-left">
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
                className="px-8 py-3 justify-center"
              >
                View Plans Again
              </Button>
            </div>

            {/* Discord CTA */}
            <div className="mt-8 pt-6 border-t border-white/15 flex flex-col gap-2 items-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-white/70 text-sm">
                  Need help deciding?
                </span>
              </div>
              <Button
                as="link"
                href={SOCIAL_LINKS.DISCORD}
                target="_blank"
                className="bg-white text-black hover:bg-white/80 px-4 py-2 justify-center border-transparent"
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
