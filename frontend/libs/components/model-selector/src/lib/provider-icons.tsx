import { getCreatorIcon, ModelCreator } from "@storyteller/model-list";
import { IsDesktopApp } from "@storyteller/tauri-utils";
import { GenerationProvider } from "@storyteller/api-enums";
import { ReactNode } from "react";

const GENERATION_PROVIDER_TO_CREATOR: Partial<Record<GenerationProvider, ModelCreator>> = {
  [GenerationProvider.Artcraft]: ModelCreator.ArtCraft,
  [GenerationProvider.Grok]: ModelCreator.Grok,
  [GenerationProvider.Midjourney]: ModelCreator.Midjourney,
  [GenerationProvider.Sora]: ModelCreator.OpenAi,
  [GenerationProvider.WorldLabs]: ModelCreator.WorldLabs,
  [GenerationProvider.Fal]: ModelCreator.Fal,
};

export const getProviderIcon = (
  provider: GenerationProvider,
  className = "h-4 w-4 icon-auto-contrast"
): ReactNode => {
  const creator = GENERATION_PROVIDER_TO_CREATOR[provider];
  if (creator) return getCreatorIcon(creator, className);
  return (
    <img
      src={
        IsDesktopApp()
          ? "/resources/images/services/generic.svg"
          : "/images/services/generic.svg"
      }
      alt="generic logo"
      className={className}
    />
  );
};

export const getProviderDisplayName = (provider: GenerationProvider): string => {
  switch (provider) {
    case GenerationProvider.Artcraft:
      return "ArtCraft";
    case GenerationProvider.Fal:
      return "FAL";
    case GenerationProvider.Grok:
      return "Grok";
    case GenerationProvider.Midjourney:
      return "Midjourney";
    case GenerationProvider.Sora:
      return "Sora / ChatGPT";
    case GenerationProvider.WorldLabs:
      return "World Labs";
    default:
      return "Unknown Provider";
  }
};
