import { PricingContent } from "@storyteller/ui-pricing-modal";

interface ArtcraftBillingBlockProps {
}

export function ArtcraftBillingBlock({
}: ArtcraftBillingBlockProps) {

  return (
    <div className="w-full">
      <PricingContent 
        title="Video Generation is Resource Intensive"
        subtitle="Creating high-quality videos requires significant computing power. To generate more, you'll need to subscribe for monthly credits. Your support also helps us keep building and improving ArtCraft!"
      />
    </div>
  );
}
