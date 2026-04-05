use std::collections::HashSet;
use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use actix_web_lab::extract::Query;
use artcraft_api_defs::common::responses::media_links::MediaLinks;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use chrono::{DateTime, Utc};
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_subtype::MediaFileSubtype;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use log::warn;
use mysql_queries::queries::media_files::get::batch_get_media_files::batch_get_media_files;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::prompts::PromptToken;
use utoipa::{IntoParams, ToSchema};

use crate::http_server::common_responses::media::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::endpoints::media_files::common_responses::live_portrait::MediaFileLivePortraitDetails;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::web_utils::bucket_urls::bucket_url_string_from_media_path::bucket_url_string_from_media_path;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

// =============== Request ===============

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct BatchGetMediaFilesQueryParams {
  /// A grab bag of tokens of various types.
  /// Technically we should pair with token types, as that's the unique index.
  /// But since each token family generally has its own prefix, this should be fine.
  ///
  /// NB: We're using actix_web_lab's Query<T>, because the default actix_web Query<T> doesn't support URL
  /// decoding sequences yet.
  /// See https://github.com/actix/actix-web/issues/1301
  ///
  pub tokens: HashSet<String>,
}

// =============== Success Response ===============

#[derive(Serialize, ToSchema)]
pub struct BatchGetMediaFilesSuccessResponse {
  pub success: bool,
  pub media_files: Vec<BatchMediaFileInfo>,
}

#[derive(Serialize, ToSchema)]
pub struct BatchMediaFileInfo {
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

  /// If the media file has a subtype, we'll report it.
  /// This is mostly used for Bevy engine files.
  #[deprecated(note="This was for the Bevy engine. Do not use.")]
  pub maybe_media_subtype: Option<MediaFileSubtype>,

  /// Extension for the engine to load over remote:// URLs.
  #[deprecated(note="This was for the Bevy engine. Do not use.")]
  pub maybe_engine_extension: Option<String>,

  /// If the file was generated as part of a batch, this is the token for the batch.
  pub maybe_batch_token: Option<BatchGenerationToken>,

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

  //// Provenance Data
  //pub origin_product: MediaFileOriginProductCategory,
  //pub origin_category: MediaFileOriginCategory,
  //pub maybe_origin_model_type: Option<MediaFileOriginModelType>,
  //pub maybe_origin_model_token: Option<String>,
  //pub maybe_origin_filename: Option<String>,

  /// Possible model info (if generated by inference)
  pub maybe_model_weight_info: Option<BatchGetMediaFilesModelInfo>,

  /// User info
  pub maybe_creator_user: Option<UserDetailsLight>,

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

  /// OPTIONAL. Details on live portrait generated media files,
  /// if this is a live portrait generated file.
  pub maybe_live_portrait_details: Option<MediaFileLivePortraitDetails>,

  /// For Comfy / Video Style Transfer jobs, this might include
  /// the name of the selected style.
  pub maybe_style_name: Option<StyleTransferName>,

  /// The foreign key to the prompt used to generate the media, if applicable.
  pub maybe_prompt_token: Option<PromptToken>,

  /// The original filename for uploaded files, if they were provided.
  /// In the future we'll provide our own internal optional filenames.
  pub maybe_original_filename: Option<String>,

  /// Duration for audio and video files, if available.
  /// Measured in milliseconds.
  pub maybe_duration_millis: Option<u64>,

  /// We can simulate media files for "tts_results" records.
  /// If this is set as true, this informs the frontend and API callers not to treat
  /// the token as a media file and improperly assume it can be used with the rest of
  /// the media file APIs.
  pub is_emulated_media_file: bool,

  /// Statistics about the media file
  pub stats: SimpleEntityStats,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  //pub maybe_moderator_fields: Option<ModeratorFields>,
}

//#[derive(Serialize)]
//pub struct ModeratorFields {
//  pub creator_ip_address: String,
//  pub creator_is_banned_if_user: bool,
//  pub maybe_creator_deleted_at: Option<DateTime<Utc>>,
//  pub maybe_mod_deleted_at: Option<DateTime<Utc>>,
//}

#[derive(Serialize, ToSchema)]
pub struct BatchGetMediaFilesModelInfo {
  pub weight_token: ModelWeightToken,
  pub weight_type: WeightsType,
  pub weight_category: WeightsCategory,
  pub title: String,

  /// Cover images are small descriptive images that can be set for any model.
  /// If a cover image is set, this is the path to the asset.
  pub maybe_cover_image_public_bucket_path: Option<String>,

  /// NB: Technically this shouldn't be a nullable field, but since there are so many
  /// joins we'll relax that this must exist (for now).
  pub maybe_weight_creator: Option<UserDetailsLight>,
}

// =============== Error Response ===============

#[derive(Debug, ToSchema)]
pub enum BatchGetMediaFilesError {
  ServerError,
  NotFound,
}

impl ResponseError for BatchGetMediaFilesError {
  fn status_code(&self) -> StatusCode {
    match *self {
      BatchGetMediaFilesError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      BatchGetMediaFilesError::NotFound => StatusCode::NOT_FOUND,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      BatchGetMediaFilesError::ServerError => "server error".to_string(),
      BatchGetMediaFilesError::NotFound => "not found".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for BatchGetMediaFilesError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

/// List many media files at the same time by supplying their tokens. You'll have to provide the tokens.
#[utoipa::path(
  get,
  tag = "Media Files",
  path = "/v1/media_files/batch",
  responses(
    (status = 200, description = "Found", body = BatchGetMediaFilesSuccessResponse),
    (status = 404, description = "Not found", body = BatchGetMediaFilesError),
    (status = 500, description = "Server error", body = BatchGetMediaFilesError),
  ),
  params(
    BatchGetMediaFilesQueryParams,
  )
)]
pub async fn batch_get_media_files_handler(
  http_request: HttpRequest,
  query: Query<BatchGetMediaFilesQueryParams>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<BatchGetMediaFilesSuccessResponse>, BatchGetMediaFilesError> {
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        BatchGetMediaFilesError::ServerError
      })?;

  let mut show_deleted_results = false;
  let mut is_moderator = false;

  if let Some(user_session) = maybe_user_session {
    // NB: Moderators can see deleted results.
    // Original creators cannot see them (unless they're moderators!)
    show_deleted_results = user_session.can_delete_other_users_tts_results;
    // Moderators get to see all the fields.
    is_moderator = user_session.can_delete_other_users_tts_results
        || user_session.can_edit_other_users_tts_models;
  }

  let tokens = query.tokens.iter()
      .map(|token| MediaFileToken::new_from_str(&token))
      .collect::<Vec<_>>();

  // NB(bt,2024-03-24): I'm sorry, this is gross. We're not respecting sorting, input ordering,
  // de-duplication, (if we swap types), etc. Gotta go fast.
  let result = batch_get_media_files(
    &tokens,
    show_deleted_results,
    &server_state.mysql_pool
  ).await;

  let media_files = match result {
    Ok(media_files) => media_files,
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(BatchGetMediaFilesError::ServerError);
    }
  };

  let media_domain = get_media_domain(&http_request);

  let media_files = media_files.into_iter()
      .map(|result| {
        let public_bucket_path = MediaFileBucketPath::from_object_hash(
          &result.public_bucket_directory_hash,
          result.maybe_public_bucket_prefix.as_deref(),
          result.maybe_public_bucket_extension.as_deref());

        let maybe_cover_image_public_bucket_path = match result.maybe_model_cover_image_public_bucket_hash
            .as_deref()
        {
          None => None,
          Some(hash) => Some(MediaFileBucketPath::from_object_hash(
            &hash,
            result.maybe_model_cover_image_public_bucket_prefix.as_deref(),
            result.maybe_model_cover_image_public_bucket_extension.as_deref())
              .get_full_object_path_str()
              .to_string()
          )
        };

        // NB: Some engine pages will need to know the engine extension to load the file.
        let maybe_engine_extension = match result.media_type {
          MediaFileType::Bvh => Some(".bvh".to_string()),
          MediaFileType::Glb => Some(".glb".to_string()),
          MediaFileType::Gltf => Some(".gltf".to_string()),
          MediaFileType::SceneRon => Some(".scn.ron".to_string()),
          _ => None,
        };

        BatchMediaFileInfo {
          token: result.token.clone(),
          media_class: result.media_class,
          media_type: result.media_type,
          maybe_engine_category: result.maybe_engine_category,
          maybe_animation_type: result.maybe_animation_type,
          maybe_media_subtype: result.maybe_media_subtype,
          maybe_engine_extension,
          maybe_batch_token: result.maybe_batch_token,
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
            result.maybe_file_cover_image_public_bucket_hash.as_deref(),
            result.maybe_file_cover_image_public_bucket_prefix.as_deref(),
            result.maybe_file_cover_image_public_bucket_extension.as_deref(),
          ),
          maybe_title: result.maybe_title,
          maybe_text_transcript: result.maybe_text_transcript,
          maybe_live_portrait_details: result.extra_media_file_info
              .as_ref()
              .map(|info| MediaFileLivePortraitDetails::maybe_from_extra_info(&info))
              .flatten(),
          maybe_style_name: result.maybe_prompt_args
              .as_ref()
              .and_then(|args| args.style_name.as_ref())
              .and_then(|style| style.to_style_name()),
          maybe_model_weight_info: match result.maybe_model_weights_token {
            None => None,
            Some(weight_token) => Some(BatchGetMediaFilesModelInfo {
              weight_token,
              // TODO(bt,2023-12-28): Instead of giving bogus defaults on None, make these optional or return
              //  None for *everything* on any field being absent.
              weight_type: result.maybe_model_weights_type.unwrap_or(WeightsType::Tacotron2),
              weight_category: result.maybe_model_weights_category.unwrap_or(WeightsCategory::TextToSpeech),
              title: result.maybe_model_weights_title.unwrap_or_else(|| "model".to_string()),
              maybe_cover_image_public_bucket_path,
              maybe_weight_creator: UserDetailsLight::from_optional_db_fields_owned(
                result.maybe_model_weight_creator_user_token,
                result.maybe_model_weight_creator_username,
                result.maybe_model_weight_creator_display_name,
                result.maybe_model_weight_creator_gravatar_hash,
              ),
            })
          },
          maybe_creator_user: UserDetailsLight::from_optional_db_fields_owned(
            result.maybe_creator_user_token,
          result.maybe_creator_username,
          result.maybe_creator_display_name,
          result.maybe_creator_gravatar_hash,
          ),
          creator_set_visibility: result.creator_set_visibility,
          is_user_upload: result.is_user_upload,
          is_intermediate_system_file: result.is_intermediate_system_file,
          maybe_prompt_token: result.maybe_prompt_token,
          maybe_original_filename: result.maybe_origin_filename,
          maybe_duration_millis: result.maybe_duration_millis,
          is_emulated_media_file: false,
          stats: SimpleEntityStats {
            positive_rating_count: result.maybe_ratings_positive_count.unwrap_or(0),
            bookmark_count: result.maybe_bookmark_count.unwrap_or(0),
          },
          created_at: result.created_at,
          updated_at: result.updated_at,
        }
      })
      .collect();

  Ok(Json(BatchGetMediaFilesSuccessResponse {
    success: true,
    media_files,
  }))
}
