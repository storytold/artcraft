use actix_web::error::ResponseError;
use actix_web::web::Json;
use actix_web::http::StatusCode;
use actix_web::web::Query;
use chrono::{DateTime, Utc};
use utoipa::{IntoParams, ToSchema};

use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::http_server::common_responses::media::weights_cover_image_details::WeightsCoverImageDetails;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListFeaturedWeightsQueryParams {
  pub sort_ascending: Option<bool>,
  pub page_size: Option<usize>,
  pub cursor: Option<String>,
  pub cursor_is_reversed: Option<bool>,

  /// NB: This can be one (or more comma-separated values) from `WeightsCategory`,
  /// which are the broad classes of model: text_to_speech, voice_conversion,
  /// image_generation, etc.
  ///
  /// Usage:
  ///   - `?filter_weights_categories=text_to_speech`
  ///   - `?filter_weights_categories=text_to_speech,voice_conversion`
  ///   - etc.
  pub filter_weights_categories: Option<String>,

  /// NB: This can be one (or more comma-separated values) from `WeightsType`,
  /// which are the types of models.
  ///
  /// Usage:
  ///   - `?filter_weights_types=rvc_v2`
  ///   - `?filter_weights_types=tt2,rvc_v2,vall_e`
  ///   - etc.
  pub filter_weights_types: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct ListFeaturedWeightsSuccessResponse {
  pub success: bool,
  pub results: Vec<FeaturedModelWeightForList>,
}

#[derive(Serialize, ToSchema)]
pub struct FeaturedModelWeightForList {
  pub weight_token: ModelWeightToken,

  pub weight_type: WeightsType,
  pub weight_category: WeightsCategory,

  pub title: String,

  /// If this is a voice model (voice conversion, TTS, etc.) and a language has been set,
  /// this will report it. Example values: "en", "en-US", "es-419", "ja-JP", etc.
  pub maybe_ietf_language_tag: Option<String>,

  /// If this is a voice model (voice conversion, TTS, etc.) and a language has been set,
  /// this will return the primary language subtag, e.g. "en", "es", etc. This excludes the
  /// portion after the dash (eg "en-US" would be reported as "en").
  pub maybe_ietf_primary_language_subtag: Option<String>,

  /// Optional SEO-friendly URL slug for the model weight.
  pub maybe_url_slug: Option<String>,

  pub creator: Option<UserDetailsLight>,

  /// Information about the cover image.
  pub cover_image: WeightsCoverImageDetails,

  /// Cover images are small descriptive images that can be set for any model.
  /// If a cover image is set, this is the path to the asset.
  #[deprecated(note="switch to CoverImageDetails")]
  pub maybe_cover_image_public_bucket_path: Option<String>,

  /// Statistics about the weights
  pub stats: SimpleEntityStats,

  /// Number of times the model has been used.
  /// (This isn't in SimpleEntityStats since that also applies to media files, etc.)
  pub usage_count: u32,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, ToSchema)]
pub enum ListFeaturedWeightsError {
  NotAuthorized,
  ServerError,
}

impl std::fmt::Display for ListFeaturedWeightsError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl ResponseError for ListFeaturedWeightsError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListFeaturedWeightsError::NotAuthorized => StatusCode::UNAUTHORIZED,
      ListFeaturedWeightsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }
}

/// RETIRED: featured model weights are shut down.
///
/// Always returns an empty result list (no database access) for the legacy
/// clients that still call this endpoint.
#[utoipa::path(
  get,
  tag = "Model Weights",
  path = "/v1/weights/list_featured",
  params(ListFeaturedWeightsQueryParams),
  responses(
    (status = 200, description = "List Weights", body = ListFeaturedWeightsSuccessResponse),
    (status = 401, description = "Not authorized", body = ListFeaturedWeightsError),
    (status = 500, description = "Server error", body = ListFeaturedWeightsError),
  ),
)]
pub async fn list_featured_weights_handler(
  _query: Query<ListFeaturedWeightsQueryParams>,
) -> Result<Json<ListFeaturedWeightsSuccessResponse>, ListFeaturedWeightsError> {
  Ok(Json(ListFeaturedWeightsSuccessResponse {
    success: true,
    results: Vec::new(),
  }))
}
