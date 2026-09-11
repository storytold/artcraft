use serde_derive::{Deserialize, Serialize};
use tokens::tokens::app_session::AppSessionToken;
use utoipa::ToSchema;

/// This is used in Artcraft versions 0.0.1 (several) through 0.3.0
/// Clients to this version do not send generation count data (even if the endpoint supports it).
pub const LOG_ACTIVE_USER_V1_PATH: &str = "/v1/analytics/active_user";

/// This is used in Artcraft versions 0.4.0 and later.
pub const LOG_ACTIVE_USER_V2_PATH: &str = "/v1/analytics/active_user_v2";

#[derive(Serialize, Deserialize, ToSchema, Debug, Default)]
pub struct LogAppActiveUserRequest {
  /// Clientside-generated session token.
  /// If present, it'll be validated against an expected format.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub maybe_app_session_token: Option<AppSessionToken>,

  /// An override for the application platform/OS (windows, mac, linux).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub maybe_os_platform: Option<String>,

  /// An override for the version of the OS (e.g. 10.15.7, 11, 22.04).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub maybe_os_version: Option<String>,

  /// An override for the application name.
  /// If set together with `maybe_app_version`, the two will be
  /// concatenated as `{maybe_app_name}/{maybe_app_version}`.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub maybe_app_name: Option<String>,

  /// An override for the application version.
  /// If set together with `maybe_app_name`, the two will be
  /// concatenated as `{maybe_app_name}/{maybe_app_version}`.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub maybe_app_version: Option<String>,

  /// How long the user has been active in the app, in seconds.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub maybe_session_duration_seconds: Option<u64>,

  // ========== GENERATION COUNTS ==========

  /// Number of items generated across all types.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub total_generation_count: Option<u16>,

  /// Number of images generated.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_generation_count: Option<u16>,

  /// Number of videos generated.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub video_generation_count: Option<u16>,

  /// Number of objects generated (meshes, etc.).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub object_generation_count: Option<u16>,

  /// Number of images generated with text to image.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub text_to_image_count: Option<u16>,

  /// Number of images generated with image to image (image edits).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_to_image_count: Option<u16>,

  /// Number of videos generated with text to video.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub text_to_video_count: Option<u16>,

  /// Number of videos generated with image to video.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_to_video_count: Option<u16>,

  /// Number of objects generated with text to object.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub text_to_object_count: Option<u16>,

  /// Number of objects generated with image to object.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_to_object_count: Option<u16>,

  /// Number of prompts from the image page.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_page_prompt_count: Option<u16>,

  /// Number of prompts from the video page.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub video_page_prompt_count: Option<u16>,

  /// Number of prompts from the edit page.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub edit_page_prompt_count: Option<u16>,

  /// Number of prompts from the stage page.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub stage_page_prompt_count: Option<u16>,

  /// Number of prompts from the object page.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub object_page_prompt_count: Option<u16>,

  /// Number of prompts from other pages.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub other_page_prompt_count: Option<u16>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct LogAppActiveUserResponse {
  pub success: bool,
  
  /// How long to wait until the next analytics event, in milliseconds.
  /// The client should honor this and is free to add jitter.
  pub wait_for_retry_millis: u64,
}
