use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use artcraft_api_defs::common::responses::media_links::MediaLinks;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use chrono::{DateTime, Utc};
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use enums_public::by_table::media_files::public_media_file_model_type::PublicMediaFileModelType;
use log::{debug, error, warn};
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::batch_get_media_files_by_tokens;
use redis::Commands;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

use crate::http_server::common_responses::media::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::common_responses::media_file_origin_details::MediaFileOriginDetails;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::web_utils::bucket_urls::bucket_url_string_from_media_path::bucket_url_string_from_media_path;
use crate::state::server_state::ServerState;

#[derive(Serialize, ToSchema)]
pub struct ListPinnedMediaFilesSuccessResponse {
  pub success: bool,
  pub results: Vec<PinnedMediaFile>,
}

#[derive(Serialize, ToSchema)]
pub struct PinnedMediaFile {
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

  #[deprecated(note="Use MediaFileOriginDetails instead")]
  pub origin_category: MediaFileOriginCategory,

  #[deprecated(note="Use MediaFileOriginDetails instead")]
  pub origin_product_category: MediaFileOriginProductCategory,

  #[deprecated(note="Use MediaFileOriginDetails instead")]
  pub maybe_origin_model_type: Option<PublicMediaFileModelType>,

  #[deprecated(note="Use MediaFileOriginDetails instead")]
  pub maybe_origin_model_token: Option<String>,

  /// Details where the media file came from.
  pub origin: MediaFileOriginDetails,

  pub maybe_creator: Option<UserDetailsLight>,

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

/// The key we store pinned media file tokens under
const REDIS_KEY : &str = "pinned_media_files_list";

#[derive(Debug, ToSchema)]
pub enum ListPinnedMediaFilesError {
  NotAuthorized,
  ServerError,
}

impl std::fmt::Display for ListPinnedMediaFilesError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl ResponseError for ListPinnedMediaFilesError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListPinnedMediaFilesError::NotAuthorized => StatusCode::UNAUTHORIZED,
      ListPinnedMediaFilesError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }
}

/// List media files that were pinned by the staff (paginated).
#[utoipa::path(
  get,
  tag = "Media Files",
  path = "/v1/media_files/list_pinned",
  responses(
    (status = 200, description = "List Featured Media Files", body = ListPinnedMediaFilesSuccessResponse),
    (status = 401, description = "Not authorized", body = ListPinnedMediaFilesError),
    (status = 500, description = "Server error", body = ListPinnedMediaFilesError),
  ),
)]
pub async fn list_pinned_media_files_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, impl ResponseError> {

  let mut redis = server_state.redis_pool.get()
      .map_err(|err| {
        error!("Could not obtain redis: {err}");
        ListPinnedMediaFilesError::ServerError
      })?;

  let token_list : Option<String> = redis.get(REDIS_KEY)
      .map_err(|err| {
        error!("Could not get redis result: {err}");
        ListPinnedMediaFilesError::ServerError
      })?;

  let media_file_tokens = token_list
      .unwrap_or_else(|| "".to_string())
      .split(",")
      .into_iter()
      .map(|item| item.trim())
      .filter(|item| !item.is_empty())
      .map(|item| MediaFileToken::new_from_str(item))
      .collect::<Vec<MediaFileToken>>();

  debug!("Weight tokens from Redis: {:?}", media_file_tokens);

  let mut media_files = Vec::new();

  if !media_file_tokens.is_empty() {
    let query_results =
        batch_get_media_files_by_tokens(&server_state.mysql_pool, &media_file_tokens, false).await;

    media_files = match query_results {
      Ok(media_files) => media_files,
      Err(e) => {
        warn!("Query error: {:?}", e);
        return Err(ListPinnedMediaFilesError::ServerError);
      }
    };
  }

  let media_domain = get_media_domain(&http_request);

  let response = ListPinnedMediaFilesSuccessResponse {
    success: true,
    results: media_files.into_iter()
        .map(|m| {
          let public_bucket_path = MediaFileBucketPath::from_object_hash(
            &m.public_bucket_directory_hash,
            m.maybe_public_bucket_prefix.as_deref(),
            m.maybe_public_bucket_extension.as_deref()
          );

          PinnedMediaFile {
            token: m.token.clone(),
            media_class: m.media_class,
            media_type: m.media_type,
            maybe_engine_category: m.maybe_engine_category,
            maybe_animation_type: m.maybe_animation_type,
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
              &m.token,
              media_domain,
              server_state.server_environment,
              m.maybe_file_cover_image_public_bucket_hash.as_deref(),
              m.maybe_file_cover_image_public_bucket_prefix.as_deref(),
              m.maybe_file_cover_image_public_bucket_extension.as_deref(),
            ),
            origin: MediaFileOriginDetails::from_db_fields_str(
              m.origin_category,
              m.origin_product_category,
              m.maybe_origin_model_type,
              m.maybe_origin_model_token.as_deref(),
              m.maybe_origin_model_title.as_deref()),
            origin_category: m.origin_category,
            origin_product_category: m.origin_product_category,
            maybe_origin_model_type: m.maybe_origin_model_type
                .map(|m| PublicMediaFileModelType::from_enum(m)),
            maybe_origin_model_token: m.maybe_origin_model_token,
            maybe_creator: UserDetailsLight::from_optional_db_fields_owned(
              m.maybe_creator_user_token,
              m.maybe_creator_username,
              m.maybe_creator_display_name,
              m.maybe_creator_email_gravatar_hash
            ),
            is_user_upload: m.is_user_upload,
            is_intermediate_system_file: m.is_intermediate_system_file,
            maybe_title: m.maybe_title,
            maybe_text_transcript: m.maybe_text_transcript,
            maybe_style_name: m.maybe_prompt_args
                .as_ref()
                .and_then(|args| args.style_name.as_ref())
                .and_then(|style| style.to_style_name()),
            maybe_duration_millis: m.maybe_duration_millis,
            stats: SimpleEntityStats {
              positive_rating_count: m.maybe_ratings_positive_count.unwrap_or(0),
              bookmark_count: m.maybe_bookmark_count.unwrap_or(0),
            },
            created_at: m.created_at,
            updated_at: m.updated_at,
          }
        }).collect::<Vec<_>>(),
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ListPinnedMediaFilesError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
