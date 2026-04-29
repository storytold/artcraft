import { FilterMediaType, MediaFileAnimationType } from "~/enums";
import { MediaItem } from "~/pages/PageScene/models";

export const filterMMDCharacters = (item: MediaItem) => {
  return (
    item.maybe_animation_type === MediaFileAnimationType.MikuMikuDance ||
    item.media_type === FilterMediaType.PMD ||
    item.media_type === FilterMediaType.PMX
  );
};

export const filterMixamoCharacters = (item: MediaItem) => {
  return (
    item.maybe_animation_type === MediaFileAnimationType.Mixamo ||
    (item.media_type !== FilterMediaType.PMD &&
      item.media_type !== FilterMediaType.PMX)
  );
};

export const filterMMDAnimations = (item: MediaItem) => {
  return (
    item.maybe_animation_type === MediaFileAnimationType.MikuMikuDance ||
    item.media_type === FilterMediaType.VMD
  );
};

export const filterMixamoAnimations = (item: MediaItem) => {
  return (
    // item.maybe_animation_type === MediaFileAnimationType.Mixamo &&
    item.media_type !== FilterMediaType.VMD
  );
};
