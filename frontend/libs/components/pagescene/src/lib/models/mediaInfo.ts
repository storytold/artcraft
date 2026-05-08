import { UserDetailsLight } from "./types";

import {
  MediaFileClass,
  MediaFileSubtype,
  MediaFileType,
  WeightCategory,
  WeightType,
} from "../enums";

export interface MediaInfo {
  token: string;
  media_type: MediaFileType;
  media_class: MediaFileClass | null;
  maybe_animation_type: string | null;
  maybe_media_subtype: MediaFileSubtype | null;
  maybe_engine_extension: string | null;
  maybe_batch_token: string;
  maybe_original_filename: string | null;
  maybe_creator_user: UserDetailsLight | null;
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
    maybe_weight_creator: UserDetailsLight;
    maybe_cover_image_public_bucket_path: string;
  };
  created_at: string;
  updated_at: string;
}

export interface MaybeResult {
  entity_token: string;
  entity_type: string;
  maybe_public_bucket_media_path: string;
  maybe_successfully_completed_at: string;
}

export interface Request {
  inference_category: string;
  maybe_model_title: string;
  maybe_model_token: string;
  maybe_model_type: string;
  maybe_raw_inference_text: string;
  maybe_style_name: string;
}

export interface Status {
  attempt_count: number;
  maybe_assigned_cluster: string;
  maybe_assigned_worker: string;
  maybe_extra_status_description: string;
  maybe_failure_category: string;
  progress_percentage: number;
  maybe_first_started_at: string;
  requires_keepalive: boolean;
  status: string;
}

export interface ActiveJob {
  created_at: string;
  job_token: string;
  maybe_result: MaybeResult;
  request: Request;
  status: Status;
  updated_at: string;
}
