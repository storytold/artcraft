use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use enums::common::generation::common_splat_model::CommonSplatModel;
use tokens::tokens::media_files::MediaFileToken;

/// Shared request body for both the splat cost estimate and splat generation endpoints.
#[derive(Clone, Serialize, Deserialize, ToSchema, Debug)]
pub struct OmniGenSplatCostAndGenerateRequest {
  /// REQUIRED (even if marked optional)
  /// Idempotency token to prevent duplicate requests.
  pub idempotency_token: Option<String>,

  /// REQUIRED (even if marked optional)
  /// Which model to use.
  pub model: Option<CommonSplatModel>,

  /// The text prompt for the splat generation.
  pub prompt: Option<String>,

  /// Reference images (optional).
  /// NOTE: Spherical/panorama coordinates are not yet supported per-image;
  /// multiple images are treated as multi-view input of the same world.
  pub reference_image_media_tokens: Option<Vec<MediaFileToken>>,

  /// Reference video (optional).
  pub reference_video_media_token: Option<MediaFileToken>,

  /// Whether the single reference image is a 360-degree panorama.
  pub is_panoramic: Option<bool>,

  /// Whether to disable prompt recaptioning.
  pub disable_recaption: Option<bool>,
}
