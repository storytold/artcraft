use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Path, Query};
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use artcraft_api_defs::common::responses::media_links::MediaLinks;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use chrono::{DateTime, Utc};
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::view_as::ViewAs;
use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use log::{info, warn};
use mysql_queries::queries::media_files::list::list_media_files_for_user::{list_media_files_for_user, ListMediaFileForUserArgs};
use tokens::tokens::media_files::MediaFileToken;
use utoipa::{IntoParams, ToSchema};

use crate::http_server::common_responses::media::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::common_responses::media_file_origin_details::MediaFileOriginDetails;
use crate::http_server::common_responses::pagination_page::PaginationPage;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::endpoints::media_files::helpers::get_scoped_engine_categories::get_scoped_engine_categories;
use crate::http_server::endpoints::media_files::helpers::get_scoped_media_classes::get_scoped_media_classes;
use crate::http_server::endpoints::media_files::helpers::get_scoped_media_types::get_scoped_media_types;
use crate::http_server::web_utils::bucket_urls::bucket_url_string_from_media_path::bucket_url_string_from_media_path;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use crate::util::allowed_studio_access::allowed_studio_access;

#[derive(Deserialize, ToSchema)]
pub struct ListMediaFilesForUserPathInfo {
  username: String,
}

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListMediaFilesForUserQueryParams {
  pub sort_ascending: Option<bool>,
  pub page_size: Option<usize>,
  pub page_index: Option<usize>,

  /// NB: This can be one (or more comma-separated values) from `MediaFileClass`,
  /// which are the broad category of media files: image, video, etc.
  ///
  /// Usage:
  ///   - `?filter_media_classes=audio`
  ///   - `?filter_media_classes=image,video`
  ///   - `?filter_media_classes=dimensional`
  ///   - etc.
  pub filter_media_classes: Option<String>,

  /// NB: This can be one (or more comma-separated values) from `MediaFileType`,
  /// which are mimetype-like / format-like categories of media files: glb, gltf,
  /// scene_json, jpg, png, mp4, wav, etc.
  ///
  /// Usage:
  ///   - `?filter_media_type=scene_json`
  ///   - `?filter_media_type=glb,gltf,fbx`
  ///   - `?filter_media_type=pmd,vmd,pmx`
  ///   - `?filter_media_type=jpg,png,gif`
  ///   - `?filter_media_type=wav,mp3`
  ///   - `?filter_media_type=mp4`
  ///   - etc.
  pub filter_media_type: Option<String>,

  /// NB: This can be one (or more comma-separated values) from `MediaFileEngineCategory`.
  ///
  /// Usage:
  ///   - `?filter_engine_categories=scene`
  ///   - `?filter_engine_categories=animation,character,object`
  ///   - etc.
  pub filter_engine_categories: Option<String>,

  /// Include user uploaded files in the results.
  /// By default, we do not return them unless this flag is set to true.
  pub include_user_uploads: Option<bool>,
}

#[derive(Serialize, ToSchema)]
pub struct ListMediaFilesForUserSuccessResponse {
  pub success: bool,
  pub results: Vec<MediaFileForUserListItem>,
  pub pagination: PaginationPage,
}

#[derive(Serialize, ToSchema)]
pub struct MediaFileForUserListItem {
  pub token: MediaFileToken,

  /// The coarse-grained class of media file: image, video, etc.
  pub media_class: MediaFileClass,

  /// Type of media will dictate which fields are populated and what
  /// the frontend should display (eg. video player vs audio player).
  /// This is closer in meaning to a "mime type".
  pub media_type: MediaFileType,

  /// If this is an engine/3D asset, this is the broad category (scene,
  /// animation, etc.) of that object.
  /// This can also be used for filtering in list/batch endpoints.
  pub maybe_engine_category: Option<MediaFileEngineCategory>,

  /// If this is an engine/3D asset for an animation or a rig that can
  /// be animated with either (or both) skeletal or blend shape animations,
  /// this describes the animation regime used or supported.
  pub maybe_animation_type: Option<MediaFileAnimationType>,

  /// Details where the media file came from.
  pub origin: MediaFileOriginDetails,

  #[deprecated(note="Use MediaFileOriginDetails instead")]
  pub origin_category: MediaFileOriginCategory,

  #[deprecated(note="Use MediaFileOriginDetails instead")]
  pub origin_product_category: MediaFileOriginProductCategory,

  #[deprecated(note="Use MediaFileOriginDetails instead")]
  pub maybe_origin_model_type: Option<MediaFileOriginModelType>,

  #[deprecated(note="Use MediaFileOriginDetails instead")]
  pub maybe_origin_model_token: Option<String>,

  /// (DEPRECATED) URL path to the media file
  #[deprecated(note="This field doesn't point to the full URL. Use media_links instead to leverage the CDN.")]
  pub public_bucket_path: String,

  /// (DEPRECATED) Full URL to the media file
  #[deprecated(note="This points to the bucket. Use media_links instead to leverage the CDN.")]
  pub public_bucket_url: String,

  /// Rich CDN links to the media, including thumbnails, previews, and more.
  pub media_links: MediaLinks,

  /// Information about the cover image. Many media files do not require a cover image,
  /// e.g. image files, video files with thumbnails, audio files, etc.
  /// 3D files require them.
  pub cover_image: MediaFileCoverImageDetails,

  pub creator_set_visibility: Visibility,

  /// The file was uploaded by the user.
  /// This does not include files generated on the client side, like studio renders.
  pub is_user_upload: bool,

  /// The file was created by the system.
  /// This includes files generated on the client side, like studio renders.
  pub is_intermediate_system_file: bool,

  /// The name or title of the media file (optional)
  pub maybe_title: Option<String>,

  /// Text transcripts for TTS, etc.
  pub maybe_text_transcript: Option<String>,

  /// For Comfy / Video Style Transfer jobs, this might include
  /// the name of the selected style.
  pub maybe_style_name: Option<StyleTransferName>,

  /// Duration for audio and video files, if available.
  /// Measured in milliseconds.
  pub maybe_duration_millis: Option<u64>,

  /// Statistics about the media file
  pub stats: SimpleEntityStats,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, ToSchema)]
pub enum ListMediaFilesForUserError {
  ServerError,
}

impl ResponseError for ListMediaFilesForUserError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListMediaFilesForUserError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListMediaFilesForUserError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

impl std::fmt::Display for ListMediaFilesForUserError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// List all of a user's media files (paginated).
///
/// This endpoint uses the session to automatically show all files for the given user, but only
/// show "public" files for external users.
#[utoipa::path(
  get,
  tag = "Media Files",
  path = "/v1/media_files/list/user/{username}",
  params(
     ListMediaFilesForUserQueryParams,
  ),
  responses(
    (status = 200, description = "List Featured Media Files", body = ListMediaFilesForUserSuccessResponse),
    (status = 500, description = "Server error", body = ListMediaFilesForUserError),
  ),
)]
pub async fn list_media_files_for_user_handler(
  http_request: HttpRequest,
  path: Path<ListMediaFilesForUserPathInfo>,
  query: Query<ListMediaFilesForUserQueryParams>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListMediaFilesForUserError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListMediaFilesForUserError::ServerError
      })?;

  let mut is_author = false;
  let mut is_mod = false;

  // NB: Temporary rollout flag for certain file types (BVH, etc).
  let mut is_allowed_studio_access = allowed_studio_access(
    maybe_user_session.as_ref(),
    &server_state.flags
  );

  match maybe_user_session {
    None => {},
    Some(session) => {
      is_author = session.username == path.username;
      is_mod = session.can_ban_users;
    },
  };

  // TODO(bt,2023-12-04): Enforce real maximums and defaults
  let sort_ascending = query.sort_ascending.unwrap_or(false);
  let page_size = query.page_size.unwrap_or_else(|| 25);
  let page_index = query.page_index.unwrap_or_else(|| 0);

  let view_as = if is_author {
    ViewAs::Author
  } else if is_mod {
    ViewAs::Moderator
  } else {
    ViewAs::AnotherUser
  };

  let mut maybe_filter_media_types = get_scoped_media_types(query.filter_media_type.as_deref());
  let mut maybe_filter_media_classes  = get_scoped_media_classes(query.filter_media_classes.as_deref());
  let mut maybe_filter_engine_categories = get_scoped_engine_categories(query.filter_engine_categories.as_deref());

  info!("Querying media files for user: {:?} type: {:?} as: {:?}", path.username, maybe_filter_media_types, view_as);

  let query_results = list_media_files_for_user(ListMediaFileForUserArgs {
    username: &path.username,
    maybe_filter_media_types: maybe_filter_media_types.as_ref(),
    maybe_filter_media_classes: maybe_filter_media_classes.as_ref(),
    maybe_filter_engine_categories: maybe_filter_engine_categories.as_ref(),
    include_user_uploads: query.include_user_uploads.unwrap_or(false),
    page_size,
    page_index,
    sort_ascending,
    view_as,
    mysql_pool: &server_state.mysql_pool,
  }).await;

  let results_page = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Query error: {:?}", e);
      return Err(ListMediaFilesForUserError::ServerError);
    }
  };

  let media_domain = get_media_domain(&http_request);

  let results = results_page.records.into_iter()
      .filter(|record| {
        if is_allowed_studio_access {
          return true;
        }
        // Don't allow access to certain media types.
        match record.media_type {
          MediaFileType::Bvh |
          MediaFileType::Fbx |
          MediaFileType::Glb |
          MediaFileType::Gltf |
          MediaFileType::SceneRon => return false,
          _ => {},
        }
        // // Don't allow access to certain products.
        // match record.origin_product_category {
        //   MediaFileOriginProductCategory::VideoFilter |
        //   MediaFileOriginProductCategory::Mocap |
        //   MediaFileOriginProductCategory::Workflow => return false,
        //   _ => {},
        // }
        true
      })
      .map(|record| {
        let public_bucket_path = MediaFileBucketPath::from_object_hash(
          &record.public_bucket_directory_hash,
          record.maybe_public_bucket_prefix.as_deref(),
          record.maybe_public_bucket_extension.as_deref(),
        );
        MediaFileForUserListItem {
          token: record.token.clone(),
          media_class: record.media_class,
          media_type: record.media_type,
          maybe_engine_category: record.maybe_engine_category,
          maybe_animation_type: record.maybe_animation_type,
          origin: MediaFileOriginDetails::from_db_fields_str(
            record.origin_category,
            record.origin_product_category,
            record.maybe_origin_model_type,
            record.maybe_origin_model_token.as_deref(),
            record.maybe_origin_model_title.as_deref()),
          origin_category: record.origin_category,
          origin_product_category: record.origin_product_category,
          maybe_origin_model_type: record.maybe_origin_model_type,
          maybe_origin_model_token: record.maybe_origin_model_token,
          media_links: MediaLinksBuilder::from_media_path_and_env(
            media_domain, server_state.server_environment, &public_bucket_path),
          public_bucket_path: public_bucket_path
              .get_full_object_path_str()
              .to_string(),
          public_bucket_url: bucket_url_string_from_media_path(&public_bucket_path, media_domain, server_state.server_environment),
          cover_image: MediaFileCoverImageDetails::from_optional_db_fields(
            &record.token,
            media_domain,
            server_state.server_environment,
            record.maybe_file_cover_image_public_bucket_hash.as_deref(),
            record.maybe_file_cover_image_public_bucket_prefix.as_deref(),
            record.maybe_file_cover_image_public_bucket_extension.as_deref(),
          ),
          creator_set_visibility: record.creator_set_visibility,
          is_user_upload: record.is_user_upload,
          is_intermediate_system_file: record.is_intermediate_system_file,
          maybe_title: record.maybe_title,
          maybe_text_transcript: record.maybe_text_transcript,
          maybe_style_name: record.maybe_prompt_args
              .as_ref()
              .and_then(|args| args.style_name.as_ref())
              .and_then(|style| style.to_style_name()),
          maybe_duration_millis: record.maybe_duration_millis,
          stats: SimpleEntityStats {
            positive_rating_count: record.maybe_ratings_positive_count.unwrap_or(0),
            bookmark_count: record.maybe_bookmark_count.unwrap_or(0),
          },
          created_at: record.created_at,
          updated_at: record.updated_at,
        }
      })
      .collect::<Vec<_>>();

  let response = ListMediaFilesForUserSuccessResponse {
    success: true,
    results,
    pagination: PaginationPage{
      current: results_page.current_page,
      total_page_count: results_page.total_page_count,
    }
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ListMediaFilesForUserError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
