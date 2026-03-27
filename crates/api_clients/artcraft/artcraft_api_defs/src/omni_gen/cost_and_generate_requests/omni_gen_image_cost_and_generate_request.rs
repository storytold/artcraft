use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_image_model::CommonImageModel;
use enums::common::generation::common_quality::CommonQuality;
use enums::common::generation::common_resolution::CommonResolution;
use tokens::tokens::media_files::MediaFileToken;

/// Shared request body for both the image cost estimate and image generation endpoints.
#[derive(Serialize, Deserialize, ToSchema, Debug)]
pub struct OmniGenImageCostAndGenerateRequest {
  /// REQUIRED (even if marked optional)
  /// Idempotency token to prevent duplicate requests.
  /// If not supplied, we'll generate one for the required providers.
  pub idempotency_token: Option<String>,

  /// REQUIRED (even if marked optional)
  /// Which model to use.
  pub model: Option<CommonImageModel>,

  /// The prompt for the image generation.
  pub prompt: Option<String>,

  /// Input images for image editing.
  /// If present, we're doing image editing (image-to-image).
  /// If absent, we're doing text-to-image.
  pub image_media_tokens: Option<Vec<MediaFileToken>>,

  /// The resolution to use.
  pub resolution: Option<CommonResolution>,

  /// The aspect ratio to use.
  pub aspect_ratio: Option<CommonAspectRatio>,

  /// The quality to use.
  pub quality: Option<CommonQuality>,

  /// How many images to generate.
  pub image_batch_count: Option<u16>,

  /// Only for angle manipulation models.
  pub horizontal_angle: Option<f64>,

  /// Only for angle manipulation models.
  pub vertical_angle: Option<f64>,

  /// Only for angle manipulation models.
  pub zoom: Option<f64>,
}
