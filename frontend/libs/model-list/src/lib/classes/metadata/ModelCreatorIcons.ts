import React, { ReactNode } from "react";
import { ModelCreator } from "./ModelCreator.js";
import { IsDesktopApp } from "@storyteller/tauri-utils";

export const getServicesBasePath = (): string => {
  return IsDesktopApp() ? "/resources/images/services" : "/images/services";
};

const CREATOR_ICON_FILES: Partial<Record<ModelCreator, string>> = {
  [ModelCreator.BlackForestLabs]: "blackforestlabs.svg",
  [ModelCreator.Kling]: "kling.svg",
  [ModelCreator.Midjourney]: "midjourney.svg",
  [ModelCreator.OpenAi]: "openai.svg",
  [ModelCreator.Bytedance]: "bytedance.svg",
  [ModelCreator.Google]: "google.svg",
  [ModelCreator.Recraft]: "recraft.svg",
  [ModelCreator.Tencent]: "tencent.svg",
  [ModelCreator.Krea]: "krea.svg",
  [ModelCreator.Fal]: "fal.svg",
  [ModelCreator.Replicate]: "replicate.svg",
  [ModelCreator.TensorArt]: "tensorart.svg",
  [ModelCreator.OpenArt]: "openart.svg",
  [ModelCreator.Higgsfield]: "higgsfield.svg",
  [ModelCreator.Alibaba]: "alibaba.svg",
  [ModelCreator.Vidu]: "vidu.svg",
  [ModelCreator.ArtCraft]: "artcraft.svg",
  [ModelCreator.Grok]: "grok.svg",
  [ModelCreator.Hailuo]: "minimax.svg",
  [ModelCreator.WorldLabs]: "worldlabs.svg",
  [ModelCreator.Suno]: "suno.svg",
};

// Full-color brand icons (LobeHub icon set, under services/color/) shown in
// model picker LIST ROWS. Creators absent here fall back to the mono icon
// rendered with the `icon-auto-contrast` invert filter. Trigger buttons keep
// using the mono `getCreatorIcon` path.
const CREATOR_COLOR_ICON_FILES: Partial<Record<ModelCreator, string>> = {
  [ModelCreator.Bytedance]: "bytedance.svg",
  [ModelCreator.Google]: "google.svg",
  [ModelCreator.Kling]: "kling.svg",
  [ModelCreator.Hailuo]: "minimax.svg",
  [ModelCreator.Vidu]: "vidu.svg",
  [ModelCreator.Alibaba]: "alibaba.svg",
  [ModelCreator.Stability]: "stability.svg",
  [ModelCreator.Tencent]: "tencent.svg",
  [ModelCreator.Fal]: "fal.svg",
};

export interface CreatorIconSource {
  src: string;
  // Color icons render as-is; mono fallbacks need the `icon-auto-contrast`
  // invert filter to stay visible on dark surfaces.
  isColor: boolean;
}

export const getCreatorIconPath = (creator: ModelCreator): string => {
  const base = getServicesBasePath();
  const file = CREATOR_ICON_FILES[creator] ?? "generic.svg";
  return `${base}/${file}`;
};

export const getCreatorIconSource = (
  creator: ModelCreator,
): CreatorIconSource => {
  const colorFile = CREATOR_COLOR_ICON_FILES[creator];
  if (colorFile) {
    return { src: `${getServicesBasePath()}/color/${colorFile}`, isColor: true };
  }
  return { src: getCreatorIconPath(creator), isColor: false };
};

export const getCreatorIcon = (
  creator: ModelCreator,
  className = "h-4 w-4 icon-auto-contrast"
): ReactNode | null => {
  const path = getCreatorIconPath(creator);
  return React.createElement("img", {
    src: path,
    alt: `${creator} logo`,
    className,
  });
};

// Row icon for model picker lists: full-color when available, mono otherwise.
export const getCreatorListIcon = (creator: ModelCreator): ReactNode => {
  const { src, isColor } = getCreatorIconSource(creator);
  return React.createElement("img", {
    src,
    alt: `${creator} logo`,
    className: isColor ? "h-4 w-4" : "h-4 w-4 icon-auto-contrast",
  });
};
