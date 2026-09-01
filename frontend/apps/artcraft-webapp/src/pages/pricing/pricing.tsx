import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CoinsIcon } from "lucide-react";
import { Button } from "@storyteller/ui-button";
import { BillingApi, UsersApi } from "@storyteller/api";
import Seo from "../../components/seo";
import {
  PricingTable,
  PricingPromoBanner,
} from "@storyteller/ui-pricing-table";
import { CreditsModal } from "../../components/credits-modal";
import { Reveal } from "../../components/motion/reveal";

const SeedanceBanner = () => (
  <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white bg-white/10 border border-white/30 px-3 py-1">
        Early access
      </span>
      <span className="inline-flex items-center font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65 bg-white/5 border border-white/15 px-3 py-1">
        Available today in ArtCraft
      </span>
    </div>

    <div>
      <h1 className="text-3xl md:text-4xl lg:text-5xl tracking-[-0.035em] font-medium leading-[1.05] mb-3">
        Seedance 2.0 is <span className="font-serif-italic">here</span>
      </h1>
      <p className="text-white/55 text-base md:text-lg leading-relaxed">
        Generate jaw-dropping AI videos with Seedance 2.0 before it's available
        anywhere else. Every paid plan includes video credits, so you can start
        creating right now.
      </p>
    </div>

    <div className="relative w-full overflow-hidden bg-[#080808] border border-white/15">
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

    <div className="grid grid-cols-2 gap-3">
      <div className="bg-[#101014] border border-white/30 p-4">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white mb-1">
          Seedance video credits
        </div>
        <div className="text-white/55 text-sm leading-snug">
          Included with every paid ArtCraft plan
        </div>
      </div>
      <div className="bg-[#101014] border border-white/15 p-4">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70 mb-1">
          First in the world
        </div>
        <div className="text-white/55 text-sm leading-snug">
          Seedance launches in ArtCraft ahead of anywhere else
        </div>
      </div>
    </div>
  </div>
);

// Compact "top up" CTA shown above the plan table for users who already have a
// plan, so returning subscribers can buy one-time credit packs without scrolling.
const BuyMoreCreditsCta = ({ onClick }: { onClick: () => void }) => (
  <div className="mb-8 flex flex-col items-center text-center">
    <p className="text-base text-white/65">Need more credits?</p>
    <Button
      variant="secondary"
      className="mt-3 gap-2 border border-white/15 bg-transparent hover:bg-white/10 px-5 py-2 h-11 text-white"
      onClick={onClick}
    >
      <CoinsIcon className="text-[13px]" />
      Buy more credits
    </Button>
  </div>
);

const Pricing = () => {
  const [searchParams] = useSearchParams();
  const isSeedanceRef = searchParams.get("ref") === "sd2fakeyou";
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const api = new UsersApi();
        const res = await api.GetSession();
        const loggedIn =
          res.success && !!res.data?.loggedIn && !!res.data?.user;
        setIsLoggedIn(loggedIn);
        if (!loggedIn) return;
        const subs = await new BillingApi().ListActiveSubscriptions();
        setHasPlan(
          !!subs.success &&
            !!subs.data?.active_subscriptions?.some(
              (sub) => sub.namespace === "artcraft",
            ),
        );
      } catch {
        // not logged in
      }
    };
    check();
  }, []);

  return (
    <div className="relative min-h-full bg-ui-background text-white">
      <Seo
        title="Pricing - ArtCraft"
        description="Simple, transparent pricing for ArtCraft. Start for free and scale as you grow."
      />

      <main className="relative z-10 px-4 sm:px-8 pt-10">
        {isSeedanceRef ? (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-8 xl:gap-12 items-start">
            <SeedanceBanner />
            <div className="w-full">
              {hasPlan && (
                <BuyMoreCreditsCta onClick={() => setCreditsModalOpen(true)} />
              )}
              <PricingTable
                showHeader={false}
                unifiedTheme
                compact
                showSeedanceFeatures
                showEnterprise
              />
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <PricingPromoBanner className="mb-10 sm:mb-12" />
            <Reveal
              as="div"
              inView={false}
              y={20}
              className="text-center mb-14"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-[-0.035em] font-medium leading-[1.02] mb-5">
                Invest in <span className="font-serif-italic">yourself</span>.
              </h1>
              <p className="max-w-xl mx-auto text-base sm:text-lg text-white/55 leading-relaxed">
                Get a ton of generations and invest in a tool you'll always own.
                Your subscription helps keep ArtCraft free and open for
                everyone.
              </p>
            </Reveal>
            {hasPlan && (
              <BuyMoreCreditsCta onClick={() => setCreditsModalOpen(true)} />
            )}
            <PricingTable
              showHeader={false}
              unifiedTheme
              showSeedanceFeatures
              showEnterprise
            />
          </div>
        )}
      </main>

      {isLoggedIn && !hasPlan && (
        <div className="relative z-10 flex flex-col items-center px-4 pb-4 sm:px-8 pt-6">
          <div className="inline-flex items-center gap-2 text-white/40">
            <div className="h-px w-8 bg-white/20" />
            <span className="text-sm">Or</span>
            <div className="h-px w-8 bg-white/20" />
          </div>
          <p className="mt-3 text-base text-white/65">
            Purchase one-time credit packs
          </p>
          <Button
            variant="secondary"
            className="mt-4 gap-2 border border-white/15 bg-transparent hover:bg-white/10 px-5 py-2 h-11 text-white"
            onClick={() => setCreditsModalOpen(true)}
          >
            <CoinsIcon className="text-[13px]" />
            Buy Credits
          </Button>
        </div>
      )}

      {/* Footnote */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-8 pb-16 text-center mt-6">
        <p className="text-sm text-white/45 leading-relaxed">
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
    </div>
  );
};

export default Pricing;
