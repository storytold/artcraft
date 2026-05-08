/// A common type returned by several endpoints.
/// Basic information to display a user and their avatar.
import {
  MediaFileClass,
  MediaFileSubtype,
  MediaFileType,
  WeightCategory,
  WeightType,
} from "../enums";
import { MediaInfo } from "./mediaInfo";
import { Pagination } from "./pagination";

export interface UserDetailsLight {
  user_token: string;
  /// Username (lowercase)
  username: string;
  /// Username with user-specified capitalization
  display_name: string;
  gravatar_hash: string;
  default_avatar: DefaultAvatarInfo;
}

export interface DefaultAvatarInfo {
  image_index: number;
  color_index: number;
}

export interface MediaFile {
  token: string;
  media_type: MediaFileType;
  media_class: MediaFileClass | null;
  maybe_media_subtype: MediaFileSubtype | null;
  public_bucket_path: string;
  maybe_engine_extension: string | null;
  maybe_batch_token: string;
  maybe_title: string | null;
  maybe_original_filename: string | null;
  maybe_creator_user: UserDetailsLight | null;
  maybe_prompt_token: string | null;
  creator_set_visibility: string;
  created_at: Date;
  updated_at: Date;
  maybe_model_weight_info: {
    title: string;
    weight_token: string;
    weight_category: WeightCategory;
    weight_type: WeightType;
    maybe_weight_creator: UserDetailsLight;
    maybe_cover_image_public_bucket_path: string;
  };
}
export interface GetMediaListResponse {
  pagination: Pagination;
  success: boolean;
  results: MediaInfo[];
}

export interface GetMediaFileResponse {
  success: boolean;
  media_file?: MediaFile;
}

export interface VoiceConversionModelListItem {
  token: string;
  model_type: string;
  title: string;

  creator: CreatorDetails;
  creator_set_visibility: string;

  ietf_language_tag: string;
  ietf_primary_language_subtag: string;
  is_front_page_featured: boolean;

  created_at: string;
  updated_at: string;
}

export interface CreatorDetails {
  user_token: string;
  username: string;
  display_name: string;
  gravatar_hash: string;
}

export interface VoiceConversionModelListResponse {
  success: boolean;
  models: Array<VoiceConversionModelListItem>;
}
