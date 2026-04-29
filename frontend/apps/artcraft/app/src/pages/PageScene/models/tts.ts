/*
 * Types for Listing TTS Models
 */

import { GenerateTtsAudioErrorType } from "~/pages/PageScene/enums";

export interface TtsModelListResponsePayload {
  success: boolean;
  models: Array<TtsModelListItem>;
}

export interface UserRatings {
  positive_count: number;
  negative_count: number;
  // Total count does not take into account "neutral" ratings.
  total_count: number;
}

export interface TtsModelListItem {
  model_token: string;
  tts_model_type: string;
  creator_user_token: string;
  creator_username: string;
  creator_display_name: string;
  creator_gravatar_hash: string;
  ietf_language_tag: string;
  ietf_primary_language_subtag: string;
  updatable_slug: string;
  title: string;
  is_front_page_featured: boolean;
  is_twitch_featured: boolean;
  user_ratings: UserRatings;
  category_tokens: string[];
  created_at: string;
  updated_at: string;
}

/*
 * Types for Making a TTS Generation Request
 */
export interface GenerateTtsAudioRequest {
  uuid_idempotency_token: string;
  tts_model_token: string;
  inference_text: string;
  // TODO(2022-03): TEMPORARY
  is_storyteller_demo?: boolean;
}

export interface GenerateTtsAudioResponse {
  success?: boolean;
  inference_job_token?: string;
  // Which queue to poll
  inference_job_token_type?: string;
  error?: GenerateTtsAudioErrorType;
}

export interface EndpointSuccessResponse {
  success: boolean;
  inference_job_token: string;
  inference_job_token_type?: string;
}

export interface EndpointErrorResponse {
  success: boolean;
}

export type EndpointResponse = EndpointSuccessResponse | EndpointErrorResponse;

export interface StatusLike {
  status: number;
}
