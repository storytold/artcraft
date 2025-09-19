import { AssetType } from "../enums";

export interface MediaItem {
  version: number;
  type: AssetType;
  maybe_animation_type?: string;
  media_type?: string;
  media_id: string;
  object_uuid?: string;
  name: string;
  description?: string;
  publicBucketPath?: string;
  length?: number;
  thumbnail?: string;
  isMine?: boolean;
  isBookmarked?: boolean;
  imageIndex?: number;
}
