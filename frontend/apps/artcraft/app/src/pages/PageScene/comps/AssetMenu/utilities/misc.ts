import { AssetType, FilterEngineCategories } from "~/enums";
import { FetchStatus } from "~/pages/PageScene/enums";
import { MediaInfo, MediaItem } from "~/pages/PageScene/models";
import { BucketConfig } from "~/api/BucketConfig";

export const isAnyStatusFetching = (statuses: FetchStatus[]): boolean => {
  return statuses.some((status) => status === FetchStatus.IN_PROGRESS);
};

export const responseMapping = (
  data: MediaInfo[],
  filterEngineCategories: FilterEngineCategories[],
): MediaItem[] => {
  //TODO: ASSET TYPES and ENGINE CATEGORIES NEED TO MATCH!!!!
  //TODO: GET RID OF ASSET TYPES!!
  const objectCategories = [
    FilterEngineCategories.CREATURE,
    FilterEngineCategories.IMAGE_PLANE,
    FilterEngineCategories.LOCATION,
    FilterEngineCategories.OBJECT,
    FilterEngineCategories.SET_DRESSING,
    FilterEngineCategories.SKYBOX,
    FilterEngineCategories.VIDEO_PLANE,
  ];
  const assetType = objectCategories.includes(filterEngineCategories[0])
    ? AssetType.OBJECT
    : filterEngineCategories[0];

  return data.map((item) => {
    const bucketConfig = new BucketConfig();
    const itemThumb = bucketConfig.getCdnUrl(
      item.cover_image.maybe_cover_image_public_bucket_path ?? "",
      600,
      100,
    );
    return {
      colorIndex: item.cover_image.default_cover.color_index,
      imageIndex: item.cover_image.default_cover.image_index,
      media_id: item.token,
      name: item.maybe_title ?? "Unknown",
      type: assetType as AssetType,
      media_type: item.media_type,
      maybe_animation_type: item.maybe_animation_type
        ? item.maybe_animation_type
        : undefined,
      length: ((item.maybe_duration_millis ?? 1000) / 1000) * 60,
      version: 1,
      ...(item.cover_image.maybe_cover_image_public_bucket_path
        ? {
            thumbnail: itemThumb,
          }
        : {}),
    };
  });
};
