// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use utoipa::ToSchema;

use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::http_server::common_responses::media::weights_cover_image_details::WeightsCoverImageDetails;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct SearchModelWeightsRequest {
  pub search_term: String,
  pub weight_type: Option<WeightsType>,
  pub weight_category: Option<WeightsCategory>,
  pub ietf_language_subtag: Option<String>,
  pub minimum_score: Option<u64>,
  pub sort_field: Option<SearchModelWeightsSortField>,
  pub sort_direction: Option<SearchModelWeightsSortDirection>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum SearchModelWeightsSortField {
  /// Sort based on the match score of the search term alone.
  MatchScore,
  /// Sort based on the creation date
  CreatedAt,
  /// Sort based on the model usage count
  UsageCount,
  /// Sort based on the model bookmark count
  BookmarkCount,
  /// Sort based on the model positive ratings count
  PositiveRatingCount,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum SearchModelWeightsSortDirection {
  Ascending,
  Descending,
}

#[derive(Serialize, ToSchema)]
pub struct SearchModelWeightsSuccessResponse {
  pub success: bool,
  pub weights: Vec<ModelWeightSearchResult>,
}

#[derive(Serialize, Clone, ToSchema)]
pub struct ModelWeightSearchResult {
  pub weight_token: ModelWeightToken,

  pub weight_type: WeightsType,
  pub weight_category: WeightsCategory,

  pub creator_set_visibility: Visibility,

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

  pub creator: UserDetailsLight,

  /// Information about the cover image.
  pub cover_image: WeightsCoverImageDetails,

  #[deprecated(note="switch to CoverImageDetails")]
  pub maybe_cover_image_public_bucket_path: Option<String>,

  // Whether the model weight is featured.
  pub is_featured: bool,

  /// Statistics about the weights
  pub stats: SimpleEntityStats,

  /// Number of times the model has been used.
  /// (This isn't in SimpleEntityStats since that also applies to media files, etc.)
  pub usage_count: u32,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, ToSchema)]
pub enum SearchModelWeightsError {
  ServerError,
}

impl ResponseError for SearchModelWeightsError {
  fn status_code(&self) -> StatusCode {
    match *self {
      SearchModelWeightsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      SearchModelWeightsError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for SearchModelWeightsError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// RETIRED: model weight search is shut down.
///
/// Always returns an empty result list (no Elasticsearch access) for the
/// legacy clients that still call the search endpoints.
pub async fn search_model_weights_impl(
  _http_request: HttpRequest,
  _request: SearchModelWeightsRequest,
  _server_state: web::Data<Arc<ServerState>>
) -> Result<Json<SearchModelWeightsSuccessResponse>, SearchModelWeightsError>
{
  Ok(Json(SearchModelWeightsSuccessResponse {
    success: true,
    weights: Vec::new(),
  }))
}
