import type { GuideDefinition } from "./types";
import { gridGuide } from "./definitions/grid";
import {
  tiktokGuide,
  igReelsGuide,
  ytShortsGuide,
  spotlightGuide,
} from "./definitions/platforms";

export type { GuideDefinition, GuideRenderProps } from "./types";

export const GUIDE_REGISTRY = [
  gridGuide,
  tiktokGuide,
  igReelsGuide,
  ytShortsGuide,
  spotlightGuide,
] as const satisfies readonly GuideDefinition[];

export type GuideId = (typeof GUIDE_REGISTRY)[number]["id"];

export function isGuideId(value: string): value is GuideId {
  return GUIDE_REGISTRY.some((guide) => guide.id === value);
}
