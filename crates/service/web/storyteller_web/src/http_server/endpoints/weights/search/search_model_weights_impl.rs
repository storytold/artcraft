// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::collections::HashSet;
use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::error;
use utoipa::ToSchema;

use crate::http_server::common_responses::media::weights_cover_image_details::WeightsCoverImageDetails;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use crate::util::title_to_url_slug::title_to_url_slug;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use elasticsearch_schema::searches::search_model_weights::search_model_weights::{search_model_weights, ModelWeightsSortDirection, ModelWeightsSortField, SearchArgs};
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use primitives::numerics::i32_to_u32_zero_clamped::i32_to_u32_zero_clamped;
use tokens::tokens::model_weights::ModelWeightToken;

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

#[derive(Serialize, ToSchema)]
pub struct SearchModelWeightsSuccessResponse {
  pub success: bool,
  pub weights: Vec<ModelWeightSearchResult>,
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

pub async fn search_model_weights_impl(
  http_request: HttpRequest,
  request: SearchModelWeightsRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<SearchModelWeightsSuccessResponse>, SearchModelWeightsError>
{
  let maybe_weights_categories = request.weight_category
      .map(|weight_category| {
        let mut set = HashSet::new();
        set.insert(weight_category);
        set
      });

  let maybe_weights_types = request.weight_type
      .map(|weight_type| {
        let mut set = HashSet::new();
        set.insert(weight_type);
        set
      });

  let sort_field = match request.sort_field {
    Some(SearchModelWeightsSortField::MatchScore) => Some(ModelWeightsSortField::MatchScore),
    Some(SearchModelWeightsSortField::CreatedAt) => Some(ModelWeightsSortField::CreatedAt),
    Some(SearchModelWeightsSortField::UsageCount) => Some(ModelWeightsSortField::UsageCount),
    Some(SearchModelWeightsSortField::BookmarkCount) => Some(ModelWeightsSortField::BookmarkCount),
    Some(SearchModelWeightsSortField::PositiveRatingCount) => Some(ModelWeightsSortField::PositiveRatingCount),
    None => None,
  };

  let sort_direction = match request.sort_direction {
    Some(SearchModelWeightsSortDirection::Ascending) => Some(ModelWeightsSortDirection::Ascending),
    Some(SearchModelWeightsSortDirection::Descending) => Some(ModelWeightsSortDirection::Descending),
    None => None,
  };

  let results = search_model_weights(SearchArgs {
    search_term: &request.search_term,
    maybe_creator_user_token: None,
    maybe_ietf_primary_language_subtag: request.ietf_language_subtag.as_deref(),
    maybe_weights_categories,
    maybe_weights_types,
    sort_field,
    sort_direction,
    minimum_score: request.minimum_score,
    client: &server_state.elasticsearch,
  })
      .await
      .map_err(|err| {
        error!("Searching error: {:?}", err);
        SearchModelWeightsError::ServerError
      })?;

  let media_domain = get_media_domain(&http_request);

  let results = results.into_iter()
      .map(|result| {
        let cover_image_details = WeightsCoverImageDetails::from_optional_db_fields(
          media_domain,
          server_state.server_environment,
          &result.token,
          result.maybe_cover_image_public_bucket_hash.as_deref(),
          result.maybe_cover_image_public_bucket_prefix.as_deref(),
          result.maybe_cover_image_public_bucket_extension.as_deref(),
        );

        let maybe_cover_image = result.maybe_cover_image_public_bucket_hash
            .as_deref()
            .map(|hash| {
              MediaFileBucketPath::from_object_hash(
                &hash,
                result.maybe_cover_image_public_bucket_prefix.as_deref(),
                result.maybe_cover_image_public_bucket_extension.as_deref())
                  .get_full_object_path_str()
                  .to_string()
            });

        ModelWeightSearchResult {
          weight_token: result.token,
          weight_type: result.weights_type,
          weight_category: result.weights_category,
          maybe_url_slug: title_to_url_slug(&result.title),
          title: result.title,
          creator: UserDetailsLight::from_db_fields(
            &result.creator_user_token,
            &result.creator_username,
            &result.creator_display_name,
            &result.creator_gravatar_hash,
          ),
          cover_image: cover_image_details,
          maybe_cover_image_public_bucket_path: maybe_cover_image,
          is_featured: result.is_featured.unwrap_or(false),
          stats: SimpleEntityStats {
            positive_rating_count: result.ratings_positive_count,
            bookmark_count: result.bookmark_count,
          },
          usage_count: i32_to_u32_zero_clamped(result.cached_usage_count.unwrap_or(0)),
          maybe_ietf_language_tag: result.maybe_ietf_language_tag,
          maybe_ietf_primary_language_subtag: result.maybe_ietf_primary_language_subtag,
          creator_set_visibility: result.creator_set_visibility,
          created_at: result.created_at,
          updated_at: result.updated_at,
        }
      })
      .collect::<Vec<_>>();

  // TODO(bt,2023-10-27): For some reason Elasticsearch returns duplicates. Maybe we populated the
  //  DB twice? Need to filter them out, or React chokes and gets stuck on duplicates. (Effectively
  //  freezing them into the UI, despite component updates)

  let mut added_tokens = HashSet::new();
  let mut new_results = Vec::with_capacity(results.len());

  for result in results.into_iter() {
    if added_tokens.contains(&result.weight_token) {
      continue;
    }
    added_tokens.insert(result.weight_token.clone());
    new_results.push(result);
  }

  Ok(Json(SearchModelWeightsSuccessResponse {
    success: true,
    weights: new_results,
  }))
}
