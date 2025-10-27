import React, { ReactNode } from "react";
import { ModelCreator } from "./ModelCreator.js";
import { IsDesktopApp } from "@storyteller/tauri-utils";

const getServicesBasePath = (): string => {
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
};

export const getCreatorIconPath = (creator: ModelCreator): string => {
  const base = getServicesBasePath();
  const file = CREATOR_ICON_FILES[creator] ?? "generic.svg";
  return `${base}/${file}`;
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
