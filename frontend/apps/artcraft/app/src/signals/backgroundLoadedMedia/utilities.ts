import type { MediaInfo, AudioMediaItem } from "@storyteller/ui-pagescene";
import { AssetType } from "~/enums";

export const remapResponseToAudioMediaItems = (
  newitems: MediaInfo[],
  previousItems: AudioMediaItem[],
) => {
  return newitems.map((item) => {
    const remappeddItem: AudioMediaItem = {
      version: 1,
      type: AssetType.AUDIO,
      category: getCategory(item),
      media_id: item.token,
      object_uuid: item.token,
      name: getTitle(item),
      description: item.maybe_text_transcript || "",
      publicBucketPath: item.public_bucket_path,
      length: getLength(item),
      thumbnail: "/resources/placeholders/audio_placeholder.png",
      isMine: true,
      isNew:
        previousItems.length > 0
          ? checkIsNew(previousItems, item.token)
          : false,
      // isBookmarked?: boolean;
    };
    return remappeddItem;
  });
};

// Helper functions to massage Media Info to AudioMediaItem
// that's usable as a signal.
function getTitle(item: MediaInfo) {
  // console.log(item);
  if (item.maybe_title) return item.maybe_title;
  if (item.origin && item.origin.maybe_model && item.origin.maybe_model.title)
    return item.origin.maybe_model.title;
  return "Media Audio";
}
function getCategory(item: MediaInfo) {
  if (
    item.origin &&
    item.origin.product_category &&
    item.origin.product_category !== "unknown"
  )
    return item.origin.product_category;
  if (item.origin_category) return item.origin_category;
  return "unknown";
}
function checkIsNew(previousItems: AudioMediaItem[], token: string) {
  const foundItem = previousItems.find((item) => {
    return token === item.media_id && item.isNew !== true;
  });
  return foundItem === undefined;
}
function getLength(item: MediaInfo) {
  return item.maybe_duration_millis
    ? (item.maybe_duration_millis / 1000) * 60
    : undefined;
}
