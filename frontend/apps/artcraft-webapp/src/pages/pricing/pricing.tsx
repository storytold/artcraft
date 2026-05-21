import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { faCoins } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { UsersApi } from "@storyteller/api";
import Seo from "../../components/seo";
import { PricingTable, PricingPromoBanner } from "@storyteller/ui-pricing-table";
import { CreditsModal } from "../../components/credits-modal";

const SeedanceBanner = () => (
  <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-200 bg-primary/[0.12] border border-primary/25 rounded-full px-3 py-1">
        Early access
      </span>
      <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1">
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

    <div className="relative w-full rounded-2xl sm:rounded-[24px] overflow-hidden bg-[#080808] border border-white/[0.08]">
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
      <div className="rounded-xl bg-gradient-to-br from-primary/15 via-white/[0.03] to-white/[0.02] border border-primary/25 p-4">
        <div className="text-[12px] font-semibold uppercase tracking-wider text-primary mb-1">
          Seedance video credits
        </div>
        <div className="text-white/55 text-sm leading-snug">
          Included with every paid ArtCraft plan
        </div>
      </div>
      <div className="rounded-xl bg-[#080808] border border-white/[0.08] p-4">
        <div className="text-[12px] font-semibold uppercase tracking-wider text-white/70 mb-1">
          First in the world
        </div>
        <div className="text-white/55 text-sm leading-snug">
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
        setIsLoggedIn(res.success && !!res.data?.loggedIn && !!res.data?.user);
      } catch {
        // not logged in
      }
    };
    check();
  }, []);

  return (
    <div className="relative min-h-full bg-[#101014] text-white">
      <Seo
        title="Pricing - ArtCraft"
        description="Simple, transparent pricing for ArtCraft. Start for free and scale as you grow."
      />

      {/* Subtle radial accent at top, matches landing3. Clipped to its own
          wrapper so the outer page can grow naturally and let SidebarInset
          handle scrolling. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute inset-x-0 top-0 h-[700px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,129,255,0.18) 0%, transparent 70%)",
          }}
        />
      </div>

      <main className="relative z-10 px-4 sm:px-8 pt-10">
        {isSeedanceRef ? (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-8 xl:gap-12 items-start">
            <SeedanceBanner />
            <div className="w-full">
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
            <div className="text-center mb-14" data-reveal>
              <span className="inline-block text-sm font-semibold uppercase tracking-[0.18em] text-primary mb-3">
                Plans
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-[-0.035em] font-medium leading-[1.02] mb-5">
                Invest in <span className="font-serif-italic">yourself</span>.
              </h1>
              <p className="max-w-xl mx-auto text-base sm:text-lg text-white/55 leading-relaxed">
                Get a ton of generations and invest in a tool you'll always own.
                Your subscription helps keep ArtCraft free and open for
                everyone.
              </p>
            </div>
            <PricingTable
              showHeader={false}
              unifiedTheme
              showSeedanceFeatures
              showEnterprise
            />
          </div>
        )}
      </main>

      {isLoggedIn && (
        <div className="relative z-10 flex flex-col items-center px-4 pb-4 sm:px-8">
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
            className="mt-4 gap-2 rounded-full border border-white/[0.1] bg-white/[0.06] hover:bg-white/[0.1] px-5 py-2 h-11 text-[14px] font-semibold text-white"
            onClick={() => setCreditsModalOpen(true)}
          >
            <FontAwesomeIcon
              icon={faCoins}
              className="text-primary text-[13px]"
            />
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
