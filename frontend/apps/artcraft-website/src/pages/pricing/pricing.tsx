import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { faCoins } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { UsersApi } from "@storyteller/api";
import Footer from "../../components/footer";
import Seo from "../../components/seo";
import { PricingTable } from "../../components/pricing-table";
import { CreditsModal } from "../../components/credits-modal";

const SeedanceBanner = () => (
  <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-center gap-2">
      <span className="bg-primary/20 border border-primary/40 text-primary px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
        Early Access
      </span>
      <span className="bg-white/10 border border-white/15 text-white/70 px-3 py-1 rounded-full text-xs font-medium">
        Available Today in ArtCraft
      </span>
    </div>

    <div>
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-2">
        Seedance 2.0 is here -{" "}
        <span className="text-primary">now in ArtCraft</span>
      </h1>
      <p className="text-white/65 text-sm md:text-base leading-relaxed">
        Generate jaw-dropping AI videos with Seedance 2.0 before it's available
        anywhere else. Every paid plan includes video credits - start creating
        right now.
      </p>
    </div>

    {/* Video embed */}
    <div className="relative w-full rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,170,186,0.15)] border border-white/10">
      <div style={{ paddingTop: "56.25%" }} className="relative">
        <iframe
          src="https://player.vimeo.com/video/1169289718?autoplay=1&muted=1&loop=1&background=0&byline=0&portrait=0&title=0"
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Seedance in ArtCraft"
        />
      </div>
    </div>

    {/* Feature callouts */}
    <div className="grid grid-cols-2 gap-2">
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
        <div className="text-xs font-semibold text-primary mb-0.5">
          Seedance Video Credits
        </div>
        <div className="text-white/55 text-xs leading-snug">
          Included with every paid ArtCraft plan
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <div className="text-xs font-semibold text-white mb-0.5">
          First in the World
        </div>
        <div className="text-white/55 text-xs leading-snug">
          Seedance launches in ArtCraft ahead of anywhere else
        </div>
      </div>
    </div>
  </div>
);

const Pricing = () => {
  const [searchParams] = useSearchParams();
  const isSeedanceRef = searchParams.get("ref") === "sd2fakeyou";
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const api = new UsersApi();
        const res = await api.GetSession();
        setIsLoggedIn(
          res.success && !!res.data?.loggedIn && !!res.data?.user,
        );
      } catch {
        // not logged in
      }
    };
    check();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#101014] text-white bg-dots">
      <Seo
        title="Pricing - ArtCraft"
        description="Simple, transparent pricing for ArtCraft. Start for free and scale as you grow."
      />
      <div className="dotted-pattern absolute inset-0 z-[0] opacity-50 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 flex justify-center pointer-events-none z-0">
        <div className="w-[900px] h-[900px] -mt-[200px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-20 blur-[120px]" />
      </div>

      {isSeedanceRef ? (
        <main className="relative z-10 pt-32 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-8 xl:gap-12 items-start">
            <SeedanceBanner />
            <div className="w-full">
              <PricingTable
                title="Get Early Access"
                subtitle="Every plan includes Seedance video credits. Invest in a tool you'll always own."
                compact
                showSeedanceFeatures
                showEnterprise
              />
            </div>
          </div>
        </main>
      ) : (
        <main className="relative z-10 pt-28 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <PricingTable
            title="Invest in Yourself"
            subtitle="You'll get a ton of generations and you'll be investing in a tool that you'll always own."
            showSeedanceFeatures
            showEnterprise
          />
        </main>
      )}

      {isLoggedIn && (
        <div className="relative z-10 flex flex-col items-center px-4 pb-12 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 text-white/40">
            <div className="h-px w-8 bg-white/20" />
            <span className="text-sm">Or</span>
            <div className="h-px w-8 bg-white/20" />
          </div>
          <p className="mt-3 text-lg text-white/70">
            Purchase one-time credit packs
          </p>
          <Button
            variant="secondary"
            className="mt-4 gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 font-semibold text-white backdrop-blur-sm hover:bg-white/10"
            onClick={() => setCreditsModalOpen(true)}
          >
            <FontAwesomeIcon icon={faCoins} className="text-primary" />
            Buy Credits
          </Button>
        </div>
      )}

      {/* Footnotes */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 text-center">
        <p className="text-md text-white/50 leading-relaxed">
          &dagger; ArtCraft can be used without paying for a subscription. You
          can bring your own compute and third party subscriptions. We hope
          you'll subscribe, though, as that helps accelerate our development.
        </p>
      </div>

      {isLoggedIn && (
        <CreditsModal
          isOpen={creditsModalOpen}
          onClose={() => setCreditsModalOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
};

export default Pricing;
