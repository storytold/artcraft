import type {
  AnimationPropertyGroup,
  AnimationPropertyPath,
  ElementAnimations,
} from "./types";
import { ANIMATION_PROPERTY_GROUPS } from "./types";
import { getKeyframeAtTime } from "./keyframe-query";

// "Logical" keyframe groups — e.g. the user keyframes "scale" and we
// store separate scaleX/scaleY keys under the hood. These helpers
// answer "does the group have a key at this time?" by checking each
// member path.

export interface GroupKeyframeRef {
  propertyPath: AnimationPropertyPath;
  keyframeId: string;
}

export function getGroupKeyframesAtTime({
  animations,
  group,
  time,
}: {
  animations: ElementAnimations | undefined;
  group: AnimationPropertyGroup;
  time: number;
}): GroupKeyframeRef[] {
  return ANIMATION_PROPERTY_GROUPS[group].flatMap((propertyPath) => {
    const keyframe = getKeyframeAtTime({ animations, propertyPath, time });
    return keyframe ? [{ propertyPath, keyframeId: keyframe.id }] : [];
  });
}

export function hasGroupKeyframeAtTime({
  animations,
  group,
  time,
}: {
  animations: ElementAnimations | undefined;
  group: AnimationPropertyGroup;
  time: number;
}): boolean {
  return getGroupKeyframesAtTime({ animations, group, time }).length > 0;
}
