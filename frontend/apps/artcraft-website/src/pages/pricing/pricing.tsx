import Footer from "../../components/footer";
import Seo from "../../components/seo";
import { PricingTable } from "../../components/pricing-table";

const Pricing = () => {
  return (
    <div className="relative min-h-screen bg-[#101014] text-white bg-dots">
      <Seo
        title="Pricing - ArtCraft"
        description="Simple, transparent pricing for ArtCraft. Start for free and scale as you grow."
      />
      <div className="dotted-pattern absolute inset-0 z-[0] opacity-50 pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-20 blur-[120px]"></div>
      </div>

      <main className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <PricingTable
          title="Invest in Yourself"
          subtitle="You'll get a ton of generations and you'll be investing in a tool that you'll always own."
        />
      </main>

      {/* Footnotes */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 text-center">
        <p className="text-md text-white/80 leading-relaxed">
          &dagger; ArtCraft can be used without paying for a subscription. You
          can bring your own compute and third party subscriptions. We hope
          you'll subscribe, though, as that helps accelerate our development.
          Pricing table is a placeholder. We charge below FAL API pricing, which
          is highly competitive.
        </p>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing;
