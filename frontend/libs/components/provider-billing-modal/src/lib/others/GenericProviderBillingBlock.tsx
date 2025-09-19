import { GenerationProvider } from "@storyteller/common";

interface GenericProviderBillingBlockProps {
  provider: GenerationProvider;
}

export function GenericProviderBillingBlock({
  provider
}: GenericProviderBillingBlockProps) {

  const serviceProviderName = getServiceProviderName(provider);

  return (
    <div>
      Please set up {serviceProviderName} on their website 
      to use it with Artcraft.
    </div>
  );
}

function getServiceProviderName(provider: GenerationProvider) : string {
  switch (provider) {
    case GenerationProvider.Sora:
      return "Sora";
    case GenerationProvider.Fal:
      return "Fal";
    case GenerationProvider.Midjourney:
      return "Midjourney";
    case GenerationProvider.Artcraft:
    default:
      return "Artcraft";
  }
}
