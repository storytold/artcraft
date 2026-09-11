import { PricingContent } from "@storyteller/ui-pricing-modal";

interface ArtcraftBillingBlockProps {
  isVideoPage?: boolean;
}

export function ArtcraftBillingBlock({
  isVideoPage = false,
}: ArtcraftBillingBlockProps) {
  const title = isVideoPage
    ? "Video Generation is Resource Intensive"
    : "Subscribe for Credits to Generate";

  const subtitle = isVideoPage
    ? `Creating high-quality videos requires significant computing power. 
       To generate more, you can subscribe to ArtCraft or buy ArtCraft credits. 
       You can also add 3rd party providers and use your existing services.
       Your support helps us keep building and improving ArtCraft! 
       We're building the image and video tool that you can own forever.`
    : `To generate more, subscribe to ArtCraft or buy credits. 
       You can also add 3rd party providers and use your existing services.
       Your support helps fund open source development and keeps ArtCraft improving! 
       We're building the creative tool that you can own forever.`;

  return (
    <div className="w-full">
      <PricingContent title={title} subtitle={subtitle} />
    </div>
  );
}
