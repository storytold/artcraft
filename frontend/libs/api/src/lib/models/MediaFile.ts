import { MediaFileClass } from "../enums/MediaFileClass";
import { MediaFileType, MediaFileSubtype } from "../enums/MediaFileType";
import { WeightCategory } from "../enums/WeightCategory";
import { WeightType } from "../enums/WeightType";
import { UserInfo } from "./Users";

export interface MediaFile {
  token: string;
  media_type: MediaFileType;
  media_class: MediaFileClass | null;
  maybe_animation_type: string | null;
  maybe_media_subtype: MediaFileSubtype | null;
  maybe_engine_extension: string | null;
  maybe_batch_token: string;
  maybe_original_filename: string | null;
  maybe_creator_user: UserInfo | null;
  maybe_prompt_token: string | null;
  origin: {
    origin_category: string;
    product_category: string;
    maybe_model: { title: string } | null;
  };
  origin_category: string;
  origin_product_category: string;
  maybe_origin_model_type: null | string;
  maybe_origin_model_token: null | string;
  maybe_duration_millis: number | null;
  maybe_style_name: null | string;
  public_bucket_path: string;
  public_bucket_url: string;
  media_links: {
    cdn_url: string;
    thumbnail_template: string;
  };
  cover_image: {
    maybe_cover_image_public_bucket_path: null | string;
    default_cover: {
      image_index: number;
      color_index: number;
    };
  };
  creator_set_visibility: string;
  maybe_title: null | string;
  maybe_text_transcript: null | string;
  stats: {
    positive_rating_count: number;
    bookmark_count: number;
  };
  maybe_model_weight_info: {
    title: string;
    weight_token: string;
    weight_category: WeightCategory;
    weight_type: WeightType;
    maybe_weight_creator: UserInfo;
    maybe_cover_image_public_bucket_path: string;
  };
  created_at: string;
  updated_at: string;
}
