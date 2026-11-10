import { useTranslation } from "@storyteller/i18n";
import { GenerationProvider } from "@storyteller/common";

interface GenericProviderBillingBlockProps {
  provider: GenerationProvider;
}

export function GenericProviderBillingBlock({
  provider,
}: GenericProviderBillingBlockProps) {
  const { t: tr } = useTranslation();

  const serviceProviderName = getServiceProviderName(provider);

  return (
    <div className="flex w-full flex-col gap-3 text-base-fg">
      <p className="hud-label text-base-fg/55">{tr("Billing")}</p>
      <h2 className="font-display text-2xl font-medium tracking-[-0.02em]">
        {tr("Set up {{provider}}", { provider: serviceProviderName })}
      </h2>
      <p className="text-sm leading-relaxed text-base-fg/60">
        {tr(
          "Please set up {{provider}} on their website to use it with ArtCraft.",
          { provider: serviceProviderName },
        )}
      </p>
    </div>
  );
}

function getServiceProviderName(provider: GenerationProvider): string {
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
