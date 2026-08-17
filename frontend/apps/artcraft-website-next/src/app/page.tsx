import RevealManager from "@/components/reveal-manager";
import Hero from "@/components/landing/hero";
import CapabilityTicker from "@/components/landing/capability-ticker";
import Features from "@/components/landing/features";
import Ownership from "@/components/landing/ownership";
import MadeWith from "@/components/landing/made-with";
import FinalCta from "@/components/landing/final-cta";

export default function Home() {
  return (
    <>
      <RevealManager />
      <Hero />
      <CapabilityTicker />
      <Features />
      <Ownership />
      <MadeWith />
      <FinalCta />
    </>
  );
}
