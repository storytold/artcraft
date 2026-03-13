use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest, HttpResponse};
use artcraft_api_defs::common::responses::media_links::MediaLinks;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use chrono::{DateTime, Utc};
use elasticsearch_schema::searches::search_media_files::{search_media_files, SearchArgs};
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use log::warn;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;
use utoipa::{IntoParams, ToSchema};

use crate::http_server::common_responses::media::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::endpoints::media_files::helpers::get_scoped_engine_categories::get_scoped_engine_categories;
use crate::http_server::endpoints::media_files::helpers::get_scoped_media_classes::get_scoped_media_classes;
use crate::http_server::endpoints::media_files::helpers::get_scoped_media_types::get_scoped_media_types;
use crate::http_server::web_utils::bucket_urls::bucket_url_string_from_media_path::bucket_url_string_from_media_path;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use crate::util::allowed_explore_media_access::allowed_explore_media_access;

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct SearchMediaFilesQueryParams {
  /// REQUIRED: The search term.
  ///
  /// This supports typeahead, but the request should still be debounced.
  pub search_term: String,

  /// NB: This can be one (or more comma-separated values) from `MediaFileClass`,
  /// which are the broad category of media files: image, video, etc.
  ///
  /// Usage:
  ///   - `?filter_media_classes=audio`
  ///   - `?filter_media_classes=image,video`
  ///   - etc.
  pub filter_media_classes: Option<String>,

  /// NB: This can be one (or more comma-separated values) from `MediaFileType`,
  /// which are mimetype-like / format-like categories of media files: glb, gltf,
  /// scene_json, etc.
  ///
  /// Usage:
  ///   - `?filter_media_type=scene_json`
  ///   - `?filter_media_type=glb,gltf`
  ///   - etc.
  pub filter_media_type: Option<String>,

  /// NB: This can be one (or more comma-separated values) from `MediaFileEngineCategory`.
  ///
  /// Usage:
  ///   - `?filter_engine_categories=scene`
  ///   - `?filter_engine_categories=animation,character,object`
  ///   - etc.
  pub filter_engine_categories: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct SearchMediaFilesSuccessResponse {
  pub success: bool,
  pub results: Vec<SearchMediaFileListItem>,
}

#[derive(Serialize, ToSchema)]
pub struct SearchMediaFileListItem {
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

  pub maybe_creator: Option<UserDetailsLight>,

  //  /// Statistics about the media file
  //  pub stats: SimpleEntityStats,

  pub creator_set_visibility: Visibility,

  // Whether the media file is featured.
  pub is_featured: bool,

  /// The file was uploaded by the user.
  /// This does not include files generated on the client side, like studio renders.
  pub is_user_upload: bool,

  /// The file was created by the system.
  /// This includes files generated on the client side, like studio renders.
  pub is_intermediate_system_file: bool,

  /// The name or title of the media file (optional)
  pub maybe_title: Option<String>,

  //  /// Text transcripts for TTS, etc.
  //  pub maybe_text_transcript: Option<String>,

  //  /// For Comfy / Video Style Transfer jobs, this might include
  //  /// the name of the selected style.
  //  pub maybe_style_name: Option<StyleTransferName>,

  //  /// Duration for audio and video files, if available.
  //  /// Measured in milliseconds.
  //  pub maybe_duration_millis: Option<u64>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, ToSchema)]
pub enum SearchMediaFilesError {
  ServerError,
  NotAuthorized,
}

impl ResponseError for SearchMediaFilesError {
  fn status_code(&self) -> StatusCode {
    match *self {
      SearchMediaFilesError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      SearchMediaFilesError::NotAuthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      SearchMediaFilesError::ServerError => "server error".to_string(),
      SearchMediaFilesError::NotAuthorized => "not authorized".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

impl std::fmt::Display for SearchMediaFilesError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Search for media files for the active user based on various criteria.
///
/// This only returns media files owned by the active user.
#[utoipa::path(
  get,
  tag = "Media Files",
  path = "/v1/media_files/search_session",
  params(SearchMediaFilesQueryParams),
  responses(
    (status = 200, description = "Success response", body = SearchMediaFilesSuccessResponse),
    (status = 401, description = "Not authorized", body = SearchMediaFilesError),
    (status = 500, description = "Server error", body = SearchMediaFilesError),
  ),
)]
pub async fn search_session_media_files_handler(
    http_request: HttpRequest,
    query: Query<SearchMediaFilesQueryParams>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<Json<SearchMediaFilesSuccessResponse>, SearchMediaFilesError>
{
  // NB(bt,2024-07-01): This isn't great. Though we HMAC our cookies, this could
  // result in bad situations where we don't invalidate sessions, etc. We're only
  // doing this to prevent the database round trip on a fast "lookup" API.
  let session_result = server_state
      .session_cookie_manager
      .decode_session_payload_from_request(&http_request);

  let session = match session_result {
    Ok(Some(session)) => session,
    Ok(None) => {
      return Err(SearchMediaFilesError::NotAuthorized);
    },
    Err(err) => {
      warn!("Session decode error: {:?}", err);
      return Err(SearchMediaFilesError::ServerError);
    }
  };

  let user_token = match session.maybe_user_token {
    Some(user_token) => UserToken::new_from_str(&user_token),
    None => return Err(SearchMediaFilesError::NotAuthorized),
  };

  let mut maybe_filter_media_types = get_scoped_media_types(query.filter_media_type.as_deref());
  let mut maybe_filter_media_classes  = get_scoped_media_classes(query.filter_media_classes.as_deref());
  let mut maybe_filter_engine_categories = get_scoped_engine_categories(query.filter_engine_categories.as_deref());

  let results = search_media_files(SearchArgs {
    search_term: &query.search_term,
    is_featured: None,
    maybe_creator_user_token: Some(&user_token),
    maybe_media_classes: maybe_filter_media_classes,
    maybe_media_types: maybe_filter_media_types,
    maybe_engine_categories: maybe_filter_engine_categories,
    client: &server_state.elasticsearch,
  }).await;

  let results = match results {
    Ok(results) => results,
    Err(err) => {
      warn!("Searching error: {:?}", err);
      return Err(SearchMediaFilesError::ServerError);
    }
  };

  let media_domain = get_media_domain(&http_request);

  let results = results.into_iter()
      .map(|result| {
        let public_bucket_path = MediaFileBucketPath::from_object_hash(
          &result.public_bucket_directory_hash,
          result.maybe_public_bucket_prefix.as_deref(),
          result.maybe_public_bucket_extension.as_deref());
        SearchMediaFileListItem {
          token: result.token.clone(),
          media_class: result.media_class,
          media_type: result.media_type,
          maybe_engine_category: result.maybe_engine_category,
          maybe_animation_type: result.maybe_animation_type,
          media_links: MediaLinksBuilder::from_media_path_and_env(
            media_domain, 
            server_state.server_environment,
            &public_bucket_path
          ),
          public_bucket_path: public_bucket_path
              .get_full_object_path_str()
              .to_string(),
          public_bucket_url: bucket_url_string_from_media_path(&public_bucket_path, media_domain, server_state.server_environment),
          cover_image: MediaFileCoverImageDetails::from_optional_db_fields(
            &result.token,
            media_domain,
            server_state.server_environment,
            result.maybe_cover_image_public_bucket_hash.as_deref(),
            result.maybe_cover_image_public_bucket_prefix.as_deref(),
            result.maybe_cover_image_public_bucket_extension.as_deref(),
          ),
          maybe_creator: UserDetailsLight::from_optional_db_fields_owned(
            result.maybe_creator_user_token,
            result.maybe_creator_username,
            result.maybe_creator_display_name,
            result.maybe_creator_gravatar_hash,
          ),
          //  stats: SimpleEntityStats {
          //    positive_rating_count: result.maybe_ratings_positive_count.unwrap_or(0),
          //    bookmark_count: result.maybe_bookmark_count.unwrap_or(0),
          //  },
          is_featured: result.is_featured,
          is_user_upload: result.is_user_upload.unwrap_or(false),
          is_intermediate_system_file: result.is_intermediate_system_file.unwrap_or(false),
          creator_set_visibility: result.creator_set_visibility,
          maybe_title: result.maybe_title,
          //  maybe_text_transcript: result.maybe_text_transcript,
          //  maybe_style_name: result.maybe_prompt_args
          //      .as_ref()
          //      .and_then(|args| args.style_name.as_ref())
          //      .and_then(|style| style.to_style_name()),
          //  maybe_duration_millis: result.maybe_duration_millis,
          created_at: result.created_at,
          updated_at: result.updated_at,
        }
      })
      .collect::<Vec<_>>();

  Ok(Json(SearchMediaFilesSuccessResponse {
    success: true,
    results,
  }))
}
