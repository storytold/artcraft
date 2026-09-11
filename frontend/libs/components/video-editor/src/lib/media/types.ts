import type { MediaAssetData } from "../services/storage/types";

export type MediaType = "image" | "video" | "audio";

// Project-side view of an asset. The "data" half (id/name/type/dims/etc.)
// is shared with the persistence layer via MediaAssetData; the runtime
// adds the live File handle and an optional pre-resolved object URL.
export interface MediaAsset
  extends Omit<MediaAssetData, "size" | "lastModified"> {
  file: File;
  url?: string;
}
