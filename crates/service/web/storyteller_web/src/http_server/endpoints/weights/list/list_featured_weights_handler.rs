use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Query;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::{IntoParams, ToSchema};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::common::view_as::ViewAs;
use enums_public::by_table::model_weights::public_weights_types::PublicWeightsType;
use mysql_queries::queries::model_weights::list::list_featured_weights::{list_featured_weights, ListFeaturedWeightsArgs};
use primitives::numerics::u64_to_u32_saturating::u64_to_u32_saturating;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::http_server::common_responses::media::weights_cover_image_details::WeightsCoverImageDetails;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::endpoints::weights::helpers::get_scoped_weights_categories::get_scoped_weights_categories;
use crate::http_server::endpoints::weights::helpers::get_scoped_weights_types::get_scoped_weights_types;
use crate::state::server_state::ServerState;
use crate::util::title_to_url_slug::title_to_url_slug;

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

  /// NB: This can be one (or more comma-separated values) from `PublicWeightsType`,
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

/// The key we store featured weights tokens under
const REDIS_KEY : &str = "featured_weights_list";

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

/// List model weights that the staff has selected as "the best" models on the site.
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
  http_request: HttpRequest,
  query: Query<ListFeaturedWeightsQueryParams>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, impl ResponseError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListFeaturedWeightsError::ServerError
      })?;

  let mut is_mod = false;

  let maybe_scoped_weights_types = get_scoped_weights_types(query.filter_weights_types.as_deref());
  let maybe_scoped_weights_categories = get_scoped_weights_categories(query.filter_weights_categories.as_deref());

  match maybe_user_session {
    None => {},
    Some(session) => {
      is_mod = session.can_ban_users;
    },
  };

  // TODO(bt,2023-12-04): Enforce real maximums and defaults
  let limit = query.page_size.unwrap_or(25);

  let sort_ascending = query.sort_ascending.unwrap_or(false);
  let cursor_is_reversed = query.cursor_is_reversed.unwrap_or(false);

  let cursor = if let Some(cursor) = query.cursor.as_deref() {
    let cursor = server_state.sort_key_crypto.decrypt_id(cursor)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          ListFeaturedWeightsError::ServerError
        })?;
    Some(cursor as usize)
  } else {
    None
  };

  let view_as = if is_mod {
    ViewAs::Moderator
  } else {
    ViewAs::AnotherUser
  };

  let query_results = list_featured_weights(ListFeaturedWeightsArgs {
    limit,
    maybe_offset: cursor,
    sort_ascending,
    cursor_is_reversed,
    view_as,
    maybe_scoped_weight_types: maybe_scoped_weights_types.as_ref(),
    maybe_scoped_weight_categories: maybe_scoped_weights_categories.as_ref(),
    mysql_pool: &server_state.mysql_pool,
  }).await;

  let results_page = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Query error: {:?}", e);
      return Err(ListFeaturedWeightsError::ServerError);
    }
  };

  let cursor_next = if let Some(id) = results_page.last_id {
    let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          ListFeaturedWeightsError::ServerError
        })?;
    Some(cursor)
  } else {
    None
  };

  let cursor_previous = if let Some(id) = results_page.first_id {
    let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          ListFeaturedWeightsError::ServerError
        })?;
    Some(cursor)
  } else {
    None
  };

  let media_domain = get_media_domain(&http_request);

  let response = ListFeaturedWeightsSuccessResponse {
    success: true,
    results: results_page.records.into_iter()
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

          FeaturedModelWeightForList {
            weight_token: w.token,
            maybe_url_slug: title_to_url_slug(&w.title),
            title: w.title,
            maybe_ietf_language_tag: w.maybe_ietf_language_tag,
            maybe_ietf_primary_language_subtag: w.maybe_ietf_primary_language_subtag,
            weight_type: PublicWeightsType::from_enum(w.weights_type),
            weight_category: w.weights_category,
            cover_image: cover_image_details,
            maybe_cover_image_public_bucket_path: maybe_cover_image,
            creator: UserDetailsLight::from_optional_db_fields(
              w.maybe_creator_user_token.as_ref(),
              w.maybe_creator_username.as_deref(),
              w.maybe_creator_display_name.as_deref(),
              w.maybe_creator_email_gravatar_hash.as_deref(),
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
      .map_err(|e| ListFeaturedWeightsError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
