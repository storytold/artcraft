// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Json, Path, Query};
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::{IntoParams, ToSchema};

use crate::http_server::common_responses::media::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::http_server::common_responses::media::media_links::MediaLinks;
use crate::http_server::common_responses::media::weights_cover_image_details::WeightsCoverImageDetails;
use crate::http_server::common_responses::pagination_page::PaginationPage;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use enums_public::by_table::model_weights::public_weights_types::PublicWeightsType;
use mysql_queries::queries::users::user_bookmarks::list_user_bookmarks::{list_user_bookmarks_by_maybe_entity_type, ListUserBookmarksForUserArgs};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::user_bookmarks::UserBookmarkToken;

#[derive(Deserialize, ToSchema)]
pub struct ListUserBookmarksPathInfo {
  username: String,
}

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListUserBookmarksQueryData {
  sort_ascending: Option<bool>,
  page_size: Option<usize>,
  page_index: Option<usize>,

  // TODO(bt,2023-12-28): Should these scope clauses be in an enum / one_of so that callers can only apply one type of
  //  scope at a time? They're kind of meaningless when used in conjunction.

  /// Scope to a particular type of entity (there are lots). Note that some types are deprecated
  /// and will no longer be valid soon: TtsModel, TtsResult, W2lTemplate, W2lResult,
  /// VoiceConversionModel. See `maybe_scoped_weight_type`, `maybe_scoped_weight_category`,
  /// and `maybe_scoped_media_file_type` instead.
  maybe_scoped_entity_type: Option<UserBookmarkEntityType>,

  /// If set, we implicitly scope bookmarks to model weights (UserBookmarkEntityType::ModelWeight)
  maybe_scoped_weight_type: Option<WeightsType>,

  /// If set, we implicitly scope bookmarks to model weights (UserBookmarkEntityType::ModelWeight)
  maybe_scoped_weight_category: Option<WeightsCategory>,

  /// If set, we implicitly scope bookmarks to media files (UserBookmarkEntityType::MediaFile)
  maybe_scoped_media_file_type: Option<MediaFileType>,
}

#[derive(Serialize, ToSchema)]
pub struct ListUserBookmarksForUserSuccessResponse {
  pub success: bool,
  pub results: Vec<UserBookmarkListItem>,
  pub pagination: PaginationPage,
}

#[derive(Serialize, ToSchema)]
pub struct UserBookmarkListItem {
  pub token: UserBookmarkToken,

  pub details: UserBookmarkDetailsForUserList,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, ToSchema)]
pub struct UserBookmarkDetailsForUserList {
  // TODO: This needs titles or some other summary metadata.
  pub entity_type: UserBookmarkEntityType,
  pub entity_token: String,

  // TODO: Populate this for TTS
  pub maybe_summary_text: Option<String>,

  // TODO: Populate this for images, video, etc.
  pub maybe_thumbnail_url: Option<String>,

  /// This is only populated if the item is a media file.
  pub maybe_media_file_data: Option<MediaFileData>,

  /// This is only populated if the item is a model weight.
  pub maybe_weight_data: Option<WeightsData>,

  /// Statistics about the bookmarked item
  pub stats: SimpleEntityStats,
}

#[derive(Serialize, ToSchema)]
pub struct MediaFileData {
  pub media_type: MediaFileType,

  /// (DEPRECATED) URL path to the media file
  #[deprecated(note="This field doesn't point to the full URL. Use media_links instead to leverage the CDN.")]
  pub public_bucket_path: String,

  /// Rich CDN links to the media, including thumbnails, previews, and more.
  pub media_links: MediaLinks,

  /// Details on the cover: defaults, possible custom image, etc.
  /// Don't use the cover if `media_links` has suitable thumbnails.
  pub cover: MediaFileCoverImageDetails,

  /// Creator of the media file
  pub maybe_creator: Option<UserDetailsLight>,
}

#[derive(Serialize, ToSchema)]
pub struct WeightsData {
  pub title: String,
  pub weight_type: PublicWeightsType,
  pub weight_category: WeightsCategory,

  /// Cover images are small descriptive images that can be set for any model.
  /// If a cover image is set, this is the path to the asset.
  pub maybe_cover_image_public_bucket_path: Option<String>,

  /// Details on the cover: defaults, possible custom image, etc.
  pub cover: WeightsCoverImageDetails,

  /// Creator of the weight
  /// NB: Technically this should not be optional, but since the join is
  /// incredibly telescopic, we may as well make it optional for now.
  pub maybe_creator: Option<UserDetailsLight>,
}

#[derive(Debug, ToSchema)]
pub enum ListUserBookmarksForUserError {
  ServerError,
}

impl ResponseError for ListUserBookmarksForUserError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListUserBookmarksForUserError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListUserBookmarksForUserError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ListUserBookmarksForUserError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[utoipa::path(
  get,
  tag = "User Bookmarks",
  path = "/v1/user_bookmarks/list/user/{username}",
  params(
  ("username", description = "The username of the user whose bookmarks to list."),
    ListUserBookmarksQueryData
  ),
  responses(
    (status = 200, description = "List User Bookmarks", body = ListUserBookmarksForUserSuccessResponse),
    (status = 500, description = "Server error", body = ListUserBookmarksForUserError),
  ),
)]
pub async fn list_user_bookmarks_for_user_handler(
  http_request: HttpRequest,
  path: Path<ListUserBookmarksPathInfo>,
  query: Query<ListUserBookmarksQueryData>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<ListUserBookmarksForUserSuccessResponse>, ListUserBookmarksForUserError>
{
  let sort_ascending = query.sort_ascending.unwrap_or(false);
  let page_size = query.page_size.unwrap_or(25);
  let page_index = query.page_index.unwrap_or(0);

  let query_results =
      list_user_bookmarks_by_maybe_entity_type(ListUserBookmarksForUserArgs{
        username: path.username.as_ref(),
        maybe_filter_entity_type: query.maybe_scoped_entity_type,
        maybe_filter_weight_type: query.maybe_scoped_weight_type,
        maybe_filter_weight_category: query.maybe_scoped_weight_category,
        maybe_filter_media_file_type: query.maybe_scoped_media_file_type,
        sort_ascending,
        page_size,
        page_index,
        mysql_pool: &server_state.mysql_pool,
      }).await;

  let results_page = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Query error: {:?}", e);
      return Err(ListUserBookmarksForUserError::ServerError);
    }
  };

  let media_domain = get_media_domain(&http_request);

  let response = ListUserBookmarksForUserSuccessResponse {
    success: true,
    results: results_page.results.into_iter()
        .map(|user_bookmark| {
          let maybe_media_file_bucket_path = user_bookmark.maybe_media_file_public_bucket_hash
              .as_deref()
              .map(|hash| {
                MediaFileBucketPath::from_object_hash(
                  hash,
                  user_bookmark.maybe_media_file_public_bucket_prefix.as_deref(),
                  user_bookmark.maybe_media_file_public_bucket_extension.as_deref())
              });

          let maybe_media_file_media_links = maybe_media_file_bucket_path.as_ref()
              .map(|bucket_path| MediaLinks::from_media_path(media_domain, bucket_path));

          let mut maybe_media_file_cover = None;
          let mut maybe_model_weight_cover = None;

          match user_bookmark.entity_type {
            UserBookmarkEntityType::MediaFile => {
              maybe_media_file_cover = Some(MediaFileCoverImageDetails::from_optional_db_fields(
                &MediaFileToken::new_from_str(&user_bookmark.entity_token),
                media_domain,
                user_bookmark.maybe_media_file_cover_image_public_bucket_hash.as_deref(),
                user_bookmark.maybe_media_file_cover_image_public_bucket_prefix.as_deref(),
                user_bookmark.maybe_media_file_cover_image_public_bucket_extension.as_deref(),
              ));
            }
            UserBookmarkEntityType::ModelWeight => {
              maybe_model_weight_cover = Some(WeightsCoverImageDetails::from_optional_db_fields(
                media_domain,
                &ModelWeightToken::new_from_str(&user_bookmark.entity_token),
                user_bookmark.maybe_model_weight_cover_image_public_bucket_hash.as_deref(),
                user_bookmark.maybe_model_weight_cover_image_public_bucket_prefix.as_deref(),
                user_bookmark.maybe_model_weight_cover_image_public_bucket_extension.as_deref(),
              ));
            }
            _ => {}
          }

          // TODO: Deprecated
          let maybe_model_weight_cover_image = user_bookmark.maybe_model_weight_cover_image_public_bucket_hash
              .as_deref()
              .map(|hash| {
                MediaFileBucketPath::from_object_hash(
                  hash,
                  user_bookmark.maybe_model_weight_cover_image_public_bucket_prefix.as_deref(),
                  user_bookmark.maybe_model_weight_cover_image_public_bucket_extension.as_deref())
                    .get_full_object_path_str()
                    .to_string()
              });

          let maybe_media_file_creator = UserDetailsLight::from_optional_db_fields(
            user_bookmark.maybe_media_file_creator_user_token.as_ref(),
            user_bookmark.maybe_media_file_creator_username.as_deref(),
            user_bookmark.maybe_media_file_creator_display_name.as_deref(),
            user_bookmark.maybe_media_file_creator_gravatar_hash.as_deref(),
          );

          let maybe_model_weight_creator = UserDetailsLight::from_optional_db_fields(
            user_bookmark.maybe_model_weight_creator_user_token.as_ref(),
            user_bookmark.maybe_model_weight_creator_username.as_deref(),
            user_bookmark.maybe_model_weight_creator_display_name.as_deref(),
            user_bookmark.maybe_model_weight_creator_gravatar_hash.as_deref(),
          );

          UserBookmarkListItem {
            token: user_bookmark.token,
            details: UserBookmarkDetailsForUserList {
              entity_type: user_bookmark.entity_type,
              entity_token: user_bookmark.entity_token,
              maybe_media_file_data: match user_bookmark.entity_type {
                UserBookmarkEntityType::MediaFile =>
                  match (maybe_media_file_bucket_path, maybe_media_file_media_links, maybe_media_file_cover) {
                    (Some(path), Some(links), Some(cover)) => Some(MediaFileData {
                      // TODO(bt,2023-12-28): Proper default, optional, or "unknown" values would be better.
                      media_type: user_bookmark.maybe_media_file_type.unwrap_or(MediaFileType::Image),
                      media_links: links,
                      cover,
                      public_bucket_path: path.get_full_object_path_str().to_string(),
                      maybe_creator: maybe_media_file_creator,
                    }),
                    _ => None,
                  },
                _ => None, // NB: Must be a media file
              },
              maybe_weight_data: match user_bookmark.entity_type {
                UserBookmarkEntityType::ModelWeight =>
                  match maybe_model_weight_cover {
                    Some(cover) => Some(WeightsData {
                      // TODO(bt,2023-12-28): Proper default, optional, or "unknown" values would be better.
                      title: user_bookmark.maybe_entity_descriptive_text.clone().unwrap_or_else(|| "weight".to_string()),
                      weight_type: PublicWeightsType::from_enum(user_bookmark.maybe_model_weight_type.unwrap_or(WeightsType::Tacotron2)),
                      weight_category: user_bookmark.maybe_model_weight_category.unwrap_or(WeightsCategory::TextToSpeech),
                      cover,
                      maybe_cover_image_public_bucket_path: maybe_model_weight_cover_image,
                      maybe_creator: maybe_model_weight_creator,
                    }),
                    None => None,
                  },
                _ => None, // NB: Must be a weight
              },
              maybe_summary_text: user_bookmark.maybe_entity_descriptive_text,
              // TODO(bt,2023-11-21): Thumbnails need proper support. We should build them as a
              //  first-class system before handling the backfill here.
              maybe_thumbnail_url: None,

              stats: SimpleEntityStats {
                positive_rating_count: user_bookmark.maybe_ratings_positive_count.unwrap_or(0),
                bookmark_count: user_bookmark.maybe_bookmark_count.unwrap_or(0),
              },
            },
            created_at: user_bookmark.created_at,
            updated_at: user_bookmark.updated_at,
          }
        })
        .collect(),
    pagination: PaginationPage{
      current: results_page.current_page,
      total_page_count: results_page.total_page_count,
    }
  };

  Ok(Json(response))
}
