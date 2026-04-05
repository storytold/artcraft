use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Path, Query};
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::{IntoParams, ToSchema};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::common::view_as::ViewAs;
use enums::common::visibility::Visibility;
use enums::by_table::model_weights::weights_types::WeightsType;
use mysql_queries::queries::model_weights::list::list_weights_by_user::{list_weights_by_creator_username, ListWeightsForUserArgs};
use primitives::numerics::u64_to_u32_saturating::u64_to_u32_saturating;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::http_server::common_responses::media::weights_cover_image_details::WeightsCoverImageDetails;
use crate::http_server::common_responses::pagination_page::PaginationPage;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::state::server_state::ServerState;
use crate::util::title_to_url_slug::title_to_url_slug;

#[derive(Serialize, Clone, ToSchema)]
pub struct Weight {
  weight_token: ModelWeightToken,
  weight_type: String,
  weight_category: String,

  title: String,

  /// If this is a voice model (voice conversion, TTS, etc.) and a language has been set,
  /// this will report it. Example values: "en", "en-US", "es-419", "ja-JP", etc.
  maybe_ietf_language_tag: Option<String>,

  /// If this is a voice model (voice conversion, TTS, etc.) and a language has been set,
  /// this will return the primary language subtag, e.g. "en", "es", etc. This excludes the
  /// portion after the dash (eg "en-US" would be reported as "en").
  maybe_ietf_primary_language_subtag: Option<String>,

  creator: UserDetailsLight,
  creator_set_visibility: Visibility,

  /// Optional SEO-friendly URL slug for the model weight.
  maybe_url_slug: Option<String>,

  // TODO(bt,2023-12-24): These aren't really appropriate for a list endpoint.
  //  Hopefully we don't break the frontend by omitting these.
  //description_markdown: String,
  //description_rendered_html: String,
  
  file_size_bytes: i32,
  file_checksum_sha2: String,

  /// Information about the cover image.
  cover_image: WeightsCoverImageDetails,

  /// Cover images are small descriptive images that can be set for any model.
  /// If a cover image is set, this is the path to the asset.
  #[deprecated(note="switch to CoverImageDetails")]
  maybe_cover_image_public_bucket_path: Option<String>,

  /// Statistics about the weights
  stats: SimpleEntityStats,

  /// Number of times the model has been used.
  /// (This isn't in SimpleEntityStats since that also applies to media files, etc.)
  usage_count: u32,

  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,
}


#[derive(Serialize,ToSchema)]
pub struct ListWeightsByUserSuccessResponse {
  pub success: bool,
  pub results: Vec<Weight>,
  pub pagination: PaginationPage,
}

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListWeightsForUserQueryParams {
  pub sort_ascending: Option<bool>,
  pub page_size: Option<usize>,
  pub page_index: Option<usize>,

  /// Optional. Scope to only the exact weight type.
  /// Shouldn't be used with weight category scoping
  pub maybe_scoped_weight_type: Option<WeightsType>,

  /// Optional. Scope to only the exact weight category, which may include
  /// multiple types of model (eg voice_conversion includes RVC, SVC, etc.)
  /// Shouldn't be used with weight type scoping
  pub maybe_scoped_weight_category: Option<WeightsCategory>,
}

#[derive(Deserialize,ToSchema)]
pub struct ListWeightsByUserPathInfo {
  username: String,
}

#[derive(Debug,ToSchema)]
pub enum ListWeightsByUserError {
  NotAuthorized,
  ServerError,
}

impl fmt::Display for ListWeightsByUserError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl ResponseError for ListWeightsByUserError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListWeightsByUserError::NotAuthorized => StatusCode::UNAUTHORIZED,
      ListWeightsByUserError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }
}

#[utoipa::path(
  get,
  tag = "Model Weights",
  path = "/v1/weights/by_user/{username}",
  responses(
      (status = 200, description = "List Weights by user", body = ListWeightsByUserSuccessResponse),
      (status = 401, description = "Not authorized", body = ListWeightsByUserError),
      (status = 500, description = "Server error", body = ListWeightsByUserError),
  ),
  params(
      ("path" = ListWeightsByUserPathInfo, description = "Payload for Request"),
      ListWeightsForUserQueryParams
  )
)]
pub async fn list_weights_by_user_handler(
  http_request: HttpRequest,
  path: Path<ListWeightsByUserPathInfo>,
  query: Query<ListWeightsForUserQueryParams>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListWeightsByUserError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListWeightsByUserError::ServerError
      })?;

  let mut is_author = false;
  let mut is_mod = false;

  match maybe_user_session {
    None => {},
    Some(session) => {
      is_author = session.username == path.username;
      is_mod = session.can_ban_users;

    },
  };

  let view_as = if is_author {
    ViewAs::Author
  } else if is_mod {
    ViewAs::Moderator
  } else {
    ViewAs::AnotherUser
  };

  let username = path.username.as_ref();
  let limit = query.page_size.unwrap_or(25);
  let sort_ascending = query.sort_ascending.unwrap_or(false);
  let page_size = query.page_size.unwrap_or_else(|| 25);
  let page_index = query.page_index.unwrap_or_else(|| 0);

  let query_results = list_weights_by_creator_username(
    ListWeightsForUserArgs{
        creator_username: username,
        page_size,
        page_index,
        sort_ascending,
        view_as,
        maybe_scoped_weight_category: query.maybe_scoped_weight_category,
        maybe_scoped_weight_type: query.maybe_scoped_weight_type,
        mysql_pool: &server_state.mysql_pool,
    }
  ).await.map_err(|e| {
    warn!("Error querying for weights: {:?}", e);
    ListWeightsByUserError::ServerError
  });

  let results_page = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Error querying for weights: {:?}", e);
      return Err(ListWeightsByUserError::ServerError);
    }
  };

  let media_domain = get_media_domain(&http_request);

  let weights: Vec<Weight> = results_page.records.into_iter().map(|weight| {

    let cover_image_details = WeightsCoverImageDetails::from_optional_db_fields(
      media_domain,
      server_state.server_environment,
      &weight.token,
      weight.maybe_cover_image_public_bucket_hash.as_deref(),
      weight.maybe_cover_image_public_bucket_prefix.as_deref(),
      weight.maybe_cover_image_public_bucket_extension.as_deref(),
    );

    let maybe_cover_image = weight.maybe_cover_image_public_bucket_hash
        .as_deref()
        .map(|hash| {
          MediaFileBucketPath::from_object_hash(
            hash,
            weight.maybe_cover_image_public_bucket_prefix.as_deref(),
            weight.maybe_cover_image_public_bucket_extension.as_deref())
              .get_full_object_path_str()
              .to_string()
        });

    Weight {
      weight_token: weight.token,
      maybe_url_slug: title_to_url_slug(&weight.title),
      title: weight.title,
      weight_type: weight.weights_type.to_string(),
      weight_category: weight.weights_category.to_string(),
      maybe_ietf_language_tag: weight.maybe_ietf_language_tag,
      maybe_ietf_primary_language_subtag: weight.maybe_ietf_primary_language_subtag,
      creator: UserDetailsLight::from_db_fields(
        &weight.creator_user_token,
        &weight.creator_username,
        &weight.creator_display_name,
        &weight.creator_email_gravatar_hash,
      ),
      cover_image: cover_image_details,
      maybe_cover_image_public_bucket_path: maybe_cover_image,
      file_size_bytes: weight.file_size_bytes,
      file_checksum_sha2: weight.file_checksum_sha2,
      creator_set_visibility: weight.creator_set_visibility,
      stats: SimpleEntityStats {
        positive_rating_count: weight.maybe_ratings_positive_count.unwrap_or(0),
        bookmark_count: weight.maybe_bookmark_count.unwrap_or(0),
      },
      usage_count: u64_to_u32_saturating(weight.cached_usage_count),
      created_at: weight.created_at,
      updated_at: weight.updated_at,
    }
  }).collect();

  let response: ListWeightsByUserSuccessResponse = ListWeightsByUserSuccessResponse {
    success: true,
    results: weights,
    pagination: PaginationPage {
      current: results_page.current_page,
      total_page_count: results_page.total_page_count,
    },
  };

  
  let body = serde_json::to_string(&response)
      .map_err(|e| ListWeightsByUserError::ServerError)?;
  
  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}