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
    case GenerationProvider.Grok:
      return "Grok";
    case GenerationProvider.Midjourney:
      return "Midjourney";
    case GenerationProvider.WorldLabs:
      return "World Labs";
    case GenerationProvider.Higgsfield:
      return "Higgsfield";
    case GenerationProvider.Krea:
      return "Krea";
    case GenerationProvider.Leonardo:
      return "Leonardo";
    case GenerationProvider.Magnific:
      return "Magnific";
    case GenerationProvider.Openart:
      return "OpenArt";
    case GenerationProvider.Picsart:
      return "Picsart";
    case GenerationProvider.Pixverse:
      return "PixVerse";
    case GenerationProvider.Runway:
      return "Runway";
    case GenerationProvider.Artcraft:
    default:
      return "Artcraft";
  }
}
