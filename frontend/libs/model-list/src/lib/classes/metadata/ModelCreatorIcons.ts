import React, { ReactNode } from "react";
import { ModelCreator } from "./ModelCreator.js";

export const CREATOR_ICON_PATHS: Partial<Record<ModelCreator, string>> = {
  [ModelCreator.BlackForestLabs]:
    "/resources/images/services/blackforestlabs.svg",
  [ModelCreator.Kling]: "/resources/images/services/kling.svg",
  [ModelCreator.Midjourney]: "/resources/images/services/midjourney.svg",
  [ModelCreator.OpenAi]: "/resources/images/services/openai.svg",
  [ModelCreator.Bytedance]: "/resources/images/services/bytedance.svg",
  [ModelCreator.Google]: "/resources/images/services/google.svg",
  [ModelCreator.Recraft]: "/resources/images/services/recraft.svg",
  [ModelCreator.Tencent]: "/resources/images/services/tencent.svg",
  [ModelCreator.Krea]: "/resources/images/services/krea.svg",
  [ModelCreator.Fal]: "/resources/images/services/fal.svg",
  [ModelCreator.Replicate]: "/resources/images/services/replicate.svg",
  [ModelCreator.TensorArt]: "/resources/images/services/tensorart.svg",
  [ModelCreator.OpenArt]: "/resources/images/services/openart.svg",
  [ModelCreator.Higgsfield]: "/resources/images/services/higgsfield.svg",
  [ModelCreator.Alibaba]: "/resources/images/services/alibaba.svg",
  [ModelCreator.Vidu]: "/resources/images/services/vidu.svg",
  [ModelCreator.ArtCraft]: "/resources/images/services/artcraft.svg",
};

const DEFAULT_ICON_PATH = "/resources/images/services/generic.svg";

export const getCreatorIconPath = (creator: ModelCreator): string | undefined =>
  CREATOR_ICON_PATHS[creator];

export const getCreatorIcon = (
  creator: ModelCreator,
  className = "h-4 w-4 invert"
): ReactNode | null => {
  const path = getCreatorIconPath(creator) ?? DEFAULT_ICON_PATH;
  return React.createElement("img", {
    src: path,
    alt: `${creator} logo`,
    className,
  });
};
