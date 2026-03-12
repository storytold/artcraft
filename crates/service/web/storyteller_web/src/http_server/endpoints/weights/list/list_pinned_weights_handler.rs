use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::{debug, error, warn};
use redis::Commands;
use utoipa::ToSchema;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums_public::by_table::model_weights::public_weights_types::PublicWeightsType;
use mysql_queries::queries::model_weights::list::list_weights_by_tokens::list_weights_by_tokens;
use primitives::numerics::u64_to_u32_saturating::u64_to_u32_saturating;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::http_server::common_responses::media::weights_cover_image_details::WeightsCoverImageDetails;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::state::server_state::ServerState;
use crate::util::title_to_url_slug::title_to_url_slug;

#[derive(Serialize, ToSchema)]
pub struct ListPinnedWeightsSuccessResponse {
  pub success: bool,
  pub results: Vec<PinnedModelWeightForList>,
}

#[derive(Serialize, ToSchema)]
pub struct PinnedModelWeightForList {
  pub weight_token: ModelWeightToken,

  pub weight_type: PublicWeightsType,
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

  pub creator: UserDetailsLight,

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

/// The key we store pinned weights tokens under
const REDIS_KEY : &str = "pinned_weights_list";

#[derive(Debug, ToSchema)]
pub enum ListPinnedWeightsError {
  NotAuthorized,
  ServerError,
}

impl std::fmt::Display for ListPinnedWeightsError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl ResponseError for ListPinnedWeightsError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListPinnedWeightsError::NotAuthorized => StatusCode::UNAUTHORIZED,
      ListPinnedWeightsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }
}

/// List weights that were pinned by the moderators.
#[utoipa::path(
  get,
  tag = "Model Weights",
  path = "/v1/weights/list_pinned",
  responses(
    (status = 200, description = "List Weights", body = ListPinnedWeightsSuccessResponse),
    (status = 401, description = "Not authorized", body = ListPinnedWeightsError),
    (status = 500, description = "Server error", body = ListPinnedWeightsError),
  ),
)]
pub async fn list_pinned_weights_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, impl ResponseError> {

  let mut redis = server_state.redis_pool.get()
      .map_err(|err| {
        error!("Could not obtain redis: {err}");
        ListPinnedWeightsError::ServerError
      })?;

  let token_list : Option<String> = redis.get(REDIS_KEY)
      .map_err(|err| {
        error!("Could not get redis result: {err}");
        ListPinnedWeightsError::ServerError
      })?;

  let weight_tokens = token_list
      .unwrap_or_else(|| "".to_string())
      .split(",")
      .into_iter()
      .map(|item: &str| item.trim())
      .filter(|item| !item.is_empty())
      .map(|item| ModelWeightToken::new_from_str(item))
      .collect::<Vec<ModelWeightToken>>();

  debug!("Weight tokens from Redis: {:?}", weight_tokens);

  let mut weights = Vec::new();

  if !weight_tokens.is_empty() {
    let query_results =
        list_weights_by_tokens(&server_state.mysql_pool, &weight_tokens, false).await;

    weights = match query_results {
      Ok(weights) => weights,
      Err(e) => {
        warn!("Query error: {:?}", e);
        return Err(ListPinnedWeightsError::ServerError);
      }
    };
  }

  let media_domain = get_media_domain(&http_request);

  let response = ListPinnedWeightsSuccessResponse {
    success: true,
    results: weights.into_iter()
        .map(|w| {
          let cover_image_details = WeightsCoverImageDetails::from_optional_db_fields(
            media_domain,
            server_state.server_environment,
            &w.token,
            w.maybe_cover_image_public_bucket_hash.as_deref(),
            w.maybe_cover_image_public_bucket_prefix.as_deref(),
            w.maybe_cover_image_public_bucket_extension.as_deref(),
          );

          let maybe_cover_image = w.maybe_cover_image_public_bucket_hash
              .as_deref()
              .map(|hash| {
                MediaFileBucketPath::from_object_hash(
                  hash,
                  w.maybe_cover_image_public_bucket_prefix.as_deref(),
                  w.maybe_cover_image_public_bucket_extension.as_deref())
                    .get_full_object_path_str()
                    .to_string()
              });

          PinnedModelWeightForList {
            weight_token: w.token,
            maybe_url_slug: title_to_url_slug(&w.title),
            title: w.title,
            maybe_ietf_language_tag: w.maybe_ietf_language_tag,
            maybe_ietf_primary_language_subtag: w.maybe_ietf_primary_language_subtag,
            weight_type: PublicWeightsType::from_enum(w.weights_type),
            weight_category: w.weights_category,
            cover_image: cover_image_details,
            maybe_cover_image_public_bucket_path: maybe_cover_image,
            creator: UserDetailsLight::from_db_fields(
              &w.creator_user_token,
              &w.creator_username,
              &w.creator_display_name,
              &w.creator_email_gravatar_hash
            ),
            stats: SimpleEntityStats {
              positive_rating_count: w.maybe_ratings_positive_count.unwrap_or(0),
              bookmark_count: w.maybe_bookmark_count.unwrap_or(0),
            },
            usage_count: u64_to_u32_saturating(w.cached_usage_count),
            created_at: w.created_at,
            updated_at: w.updated_at,
          }
        }).collect::<Vec<_>>(),
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ListPinnedWeightsError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
