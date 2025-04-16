#![forbid(unused_mut)]

use std::fmt::Debug;
use std::fmt::{Display, Formatter};
use std::path::{Path, PathBuf};
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::bucket_client::BucketClient;
use log::{debug, error, info};
use log::warn;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use openai_sora_client::credentials::SoraCredentials;
use openai_sora_client::image_gen::SoraError;
use openai_sora_client::sentinel_refresh::generate::token::generate_token;
use openai_sora_client::sentinel_refresh::refresh_sentinel;
use serde::Deserialize;
use serde::Serialize;
use shared_service_components::sora_redis_credentials::set_sora_credential_field_in_redis::set_sora_credential_field_in_redis;
use shared_service_components::sora_redis_credentials::keys::RedisSoraCredentialSubkey;
use sqlx::MySqlPool;
use tempdir::TempDir;
use utoipa::ToSchema;
use web::Data;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{GenericInferenceArgs, InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::payloads::generic_inference_args::inner_payloads::sora_image_gen_args::SoraImageGenArgs;
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{insert_generic_inference_job, InsertGenericInferenceArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use openai_sora_client::image_gen::common::{ImageSize, NumImages};
use openai_sora_client::image_gen::sora_image_gen_remix::{sora_image_gen_remix, SoraImageGenRemixRequest};
use openai_sora_client::upload::upload_media_from_file::{sora_media_upload_from_file, SoraMediaUploadRequest};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::http_server::endpoints::image_studio::get_sora_credentials_from_request::get_sora_credentials_from_request;
use crate::http_server::endpoints::tts::get_tts_inference_job_status::GetTtsInferenceStatusError;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use crate::util::allowed_studio_access::allowed_studio_access;

/// This is the number of images (batch size) to generate for each request.
/// We should allow all users to have multiple images generated at once as this
/// is what other providers do.
const MINIMUM_IMAGE_COUNT: u32 = 1;

/// The maximum number of images (batch size) to generate for each request.
const MAXIMUM_IMAGE_COUNT: u32 = 2;

/// Debug requests can get routed to special "debug-only" workers, which can
/// be used to trial new code, run debugging, etc.
const DEBUG_HEADER_NAME: &str = "enable-debug-mode";

/// The routing tag header can send workloads to particular k8s hosts.
/// This is useful for catching the live logs or intercepting the job.
const ROUTING_TAG_HEADER_NAME: &str = "routing-tag";

#[derive(Deserialize, ToSchema)]
pub struct EnqueueStudioImageGenRequest {
  pub uuid_idempotency_token: String,

  /// Image media file; the engine or canvas snapshot (screenshot).
  pub snapshot_media_token: MediaFileToken,

  /// The user's image generation prompt.
  pub prompt: String,

  /// Turn off the system prompt.
  pub disable_system_prompt: Option<bool>,

  /// Additional images to include (optional). Up to nine images.
  pub maybe_additional_images: Option<Vec<MediaFileToken>>,

  pub maybe_number_of_samples: Option<u32>,
}

#[derive(Serialize, ToSchema)]
pub struct EnqueueImageGenRequestSuccessResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

#[derive(Debug, ToSchema)]
pub enum EnqueueImageGenRequestError {
  BadInput(String),
  NotAuthorized,
  ServerError,
  RateLimited,
  TooManyConcurrentTasks,
}

impl ResponseError for EnqueueImageGenRequestError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EnqueueImageGenRequestError::BadInput(_) => StatusCode::BAD_REQUEST,
      EnqueueImageGenRequestError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EnqueueImageGenRequestError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      EnqueueImageGenRequestError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
      EnqueueImageGenRequestError::TooManyConcurrentTasks => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      EnqueueImageGenRequestError::BadInput(reason) => reason.to_string(),
      EnqueueImageGenRequestError::NotAuthorized => "unauthorized".to_string(),
      EnqueueImageGenRequestError::ServerError => "server error".to_string(),
      EnqueueImageGenRequestError::RateLimited => "rate limited".to_string(),
      EnqueueImageGenRequestError::TooManyConcurrentTasks => "too many concurrent tasks".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

impl Display for EnqueueImageGenRequestError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Prompt image generation using image studio
#[utoipa::path(
  post,
  tag = "Image Studio",
  path = "/v1/image_studio/prompt",
  responses(
        (
            status = 200,
            description = "Enqueue TTS generically",
            body = EnqueueImageGenRequestSuccessResponse,
        ),
        (status = 400, description = "Bad input", body = EnqueueImageGenRequestError),
        (status = 401, description = "Not authorized", body = EnqueueImageGenRequestError),
        (status = 429, description = "Rate limited", body = EnqueueImageGenRequestError),
        (status = 500, description = "Server error", body = EnqueueImageGenRequestError)
  ),
  params(("request" = EnqueueStudioImageGenRequest, description = "Payload for Image Generation Request"))
)]
pub async fn enqueue_studio_image_generation_handler(http_request: HttpRequest, request: Json<EnqueueStudioImageGenRequest>, server_state: Data<Arc<ServerState>>) -> Result<HttpResponse, EnqueueImageGenRequestError> {
  validate_request(&request)?;

  let mut mysql_connection = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySql pool error: {:?}", err);
    EnqueueImageGenRequestError::ServerError
  })?;

  // ==================== USER SESSION ==================== //

  let maybe_user_session = server_state.session_checker.maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection).await.map_err(|e| {
    warn!("Session checker error: {:?}", e);
    EnqueueImageGenRequestError::ServerError
  })?;

  let mut maybe_user_token: Option<UserToken> = None;

  if let Some(user_session) = maybe_user_session.as_ref() {
    maybe_user_token = Some(UserToken::new_from_str(&user_session.user_token));
  }

  // ==================== PLANS ==================== //

  // Plan should handle "first anonymous use" and "investor" cases.
  let plan = get_correct_plan_for_session(server_state.server_environment_old, maybe_user_session.as_ref());

  // Separate priority for animation.
  let priority_level = plan.web_vc_base_priority_level();

  // ==================== DEBUG MODE + ROUTING TAG ==================== //

  let is_debug_request = get_request_header_optional(&http_request, DEBUG_HEADER_NAME).is_some();

  let maybe_routing_tag = get_request_header_optional(&http_request, ROUTING_TAG_HEADER_NAME).map(|routing_tag| routing_tag.trim().to_string());

  // ==================== BANNED USERS ==================== //

  if let Some(ref user) = maybe_user_session {
    if user.role.is_banned {
      return Err(EnqueueImageGenRequestError::NotAuthorized);
    }
  }

  // DETECT premium user and queue

  // ==================== RATE LIMIT ==================== //

  let rate_limiter = match maybe_user_session {
    None => &server_state.redis_rate_limiters.logged_out,
    Some(ref _user) => &server_state.redis_rate_limiters.logged_in,
  };

  if let Err(_err) = rate_limiter.rate_limit_request(&http_request) {
    return Err(EnqueueImageGenRequestError::RateLimited);
  }

  // Get up IP address
  let ip_address = get_request_ip(&http_request);

  // ==================== HANDLE IDEMPOTENCY ==================== //

  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(EnqueueImageGenRequestError::BadInput(reason));
  }

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection).await.map_err(|err| {
    error!("Error inserting idempotency token: {:?}", err);
    EnqueueImageGenRequestError::BadInput("invalid idempotency token".to_string())
  })?;

  // ==================== DOWNLOAD FILES AND UPLOAD TO SORA ==================== //

  // TODO: Maybe this moves to a job.

  let work_temp_dir = server_state.temp_dir_creator.new_tempdir("image_studio").unwrap();

  let public_bucket_client = server_state.public_bucket_client.clone();

  let scene_media_token = request.snapshot_media_token.clone();

  let scene_media_path = query_and_download_media_file(&scene_media_token, &work_temp_dir, &public_bucket_client, &server_state.mysql_pool).await.map_err(|err| {
    error!("Failed to download scene media file: {:?}", err);
    EnqueueImageGenRequestError::ServerError
  })?;

  let mut files_to_upload = Vec::with_capacity(1 + request.maybe_additional_images.as_ref().map(|v| v.len()).unwrap_or(0));

  files_to_upload.push(scene_media_path.clone());

  let additional_images = request.maybe_additional_images.clone().unwrap_or_else(|| vec![]);

  for media_file_token in &additional_images {
    let media_file_path = query_and_download_media_file(&media_file_token, &work_temp_dir, &public_bucket_client, &server_state.mysql_pool).await.map_err(|err| {
      error!("Failed to download additional media file: {:?}", err);
      EnqueueImageGenRequestError::ServerError
    })?;

    files_to_upload.push(media_file_path.clone());
  }

  // ==================== HANDLE SORA CREDENTIALS ==================== //

  let mut redis = server_state.redis_pool.get().map_err(|e| {
    error!("redis error: {:?}", e);
    EnqueueImageGenRequestError::ServerError
  })?;

  let sora_credentials = get_sora_credentials_from_request(&http_request, &mut redis).map_err(|e| {
    error!("sora credential error: {:?}", e);
    EnqueueImageGenRequestError::ServerError
  })?;

  // ==================== HANDLE SORA UPLOAD ==================== //

  let mut sora_media_tokens = Vec::with_capacity(files_to_upload.len());

  for file_path in files_to_upload {
    let sora_upload_response = sora_media_upload_from_file(file_path, &sora_credentials).await.map_err(|err| {
      error!("Failed to upload scene media to Sora: {:?}", err);
      EnqueueImageGenRequestError::ServerError
    })?;

    debug!("Uploaded media to Sora : {:?}", sora_upload_response);
    sora_media_tokens.push(sora_upload_response.id);
  }

  // ==================== HANDLE SORA PROMPT ==================== //

  let number_of_samples = match request.maybe_number_of_samples {
    Some(val) => {
      if val > MAXIMUM_IMAGE_COUNT {
        MAXIMUM_IMAGE_COUNT
      } else if val < MINIMUM_IMAGE_COUNT {
        MINIMUM_IMAGE_COUNT
      } else {
        val
      }
    },
    None => 1,
  };

  let prompt = create_prompt(&request);

  let mut response = sora_image_gen_remix(SoraImageGenRemixRequest {
    prompt: prompt.clone(),
    num_images: NumImages::One,
    image_size: ImageSize::Square,
    sora_media_tokens: sora_media_tokens.clone(),
    credentials: &sora_credentials
  }).await;

  debug!("Sora image gen response: {:?}", response);

  if let Err(SoraError::SentinelBlock(msg)) = &response {
    error!("Sora sentinel block, attempting refresh: {}", msg);

    match generate_token().await {
      Ok(sentinel_token) => {
        set_sora_credential_field_in_redis(
          &mut redis,
          RedisSoraCredentialSubkey::Sentinel,
          &sentinel_token
        ).map_err(|e| {
          EnqueueImageGenRequestError::ServerError
        })?;

        let updated_sora_credentials = get_sora_credentials_from_request(&http_request, &mut redis).map_err(|e| {
          error!("sora credential error: {:?}", e);
          EnqueueImageGenRequestError::ServerError
        })?;

        // Retry the request with new sentinel
        response = sora_image_gen_remix(SoraImageGenRemixRequest {
          prompt: prompt.clone(),
          num_images: NumImages::One,
          image_size: ImageSize::Square,
          sora_media_tokens: sora_media_tokens.clone(),
          credentials: &updated_sora_credentials
        }).await;
      },
      Err(e) => {
        //  Fallback to the old refresh stragegy relying on the external service
        match refresh_sentinel().await {
          Ok(new_sentinel) => {
            // Update the credentials with new sentinel
            let updated_sora_credentials = get_sora_credentials_from_request(&http_request, &mut redis).map_err(|e| {
              error!("sora credential error: {:?}", e);
              EnqueueImageGenRequestError::ServerError
            })?;

            // Retry the request with new sentinel
            response = sora_image_gen_remix(SoraImageGenRemixRequest {
              prompt: prompt.clone(),
              num_images: NumImages::One,
              image_size: ImageSize::Square,
              sora_media_tokens: sora_media_tokens.clone(),
              credentials: &updated_sora_credentials
            }).await;
          },
          Err(e) => {
            error!("Failed to refresh Sora sentinel: {:?}", e);
          }
        }
      }
    }
  }

  let response = response.map_err(|err| {
    match err {
      SoraError::TokenExpired(msg) => {
        error!("Sora token expired, needs refresh: {}", msg);
        // TODO: Implement token refresh logic here
        EnqueueImageGenRequestError::ServerError
      },
      SoraError::SentinelBlock(msg) => {
        error!("Sora sentinel block still occurring after refresh: {}", msg);
        EnqueueImageGenRequestError::ServerError
      },
      SoraError::TooManyConcurrentTasks(msg) => {
        error!("Sora too many concurrent tasks: {}", msg);
        EnqueueImageGenRequestError::TooManyConcurrentTasks
      },
      _ => {
        error!("Failed to call Sora image generation: {:?}", err);
        EnqueueImageGenRequestError::ServerError
      },
    }
  })?;

  debug!("Sora image gen response: {:?}", response);

  // Store the actual inference args that will go to the database
  let inference_args = SoraImageGenArgs {
    prompt: Some(prompt),
    scene_snapshot_media_token: Some(request.snapshot_media_token.clone()),
    maybe_additional_media_file_tokens: Some(additional_images),
    maybe_number_of_samples: Some(number_of_samples),
    maybe_sora_media_upload_tokens: Some(sora_media_tokens),
    maybe_sora_task_id: Some(response.task_id)
  };

  // create the inference args here
  let maybe_avt_token = server_state.avt_cookie_manager.get_avt_token_from_request(&http_request);

  // create the job record here!
  let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
    uuid_idempotency_token: &request.uuid_idempotency_token,
    job_type: InferenceJobType::ImageGenApi,
    maybe_product_category: None, // This is not a product anymore
    inference_category: InferenceCategory::ImageGeneration,
    maybe_model_type: Some(InferenceModelType::ImageGenApi), // NB: Model is static during inference
    maybe_model_token: None,                                 // NB: Model is static during inference
    maybe_input_source_token: None,
    maybe_input_source_token_type: None,
    maybe_download_url: None,
    maybe_cover_image_media_file_token: None,
    maybe_raw_inference_text: None,
    maybe_max_duration_seconds: None,
    maybe_inference_args: Some(GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::ImageGeneration),
      args: Some(PolymorphicInferenceArgs::Sg(inference_args)),
    }),
    maybe_creator_user_token: maybe_user_token.as_ref(),
    maybe_avt_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility: Visibility::Public,
    priority_level,
    requires_keepalive: false, //reverse ...  TODO fix this. we set it base on account is premium or not ...
    is_debug_request,
    maybe_routing_tag: maybe_routing_tag.as_deref(),
    mysql_pool: &server_state.mysql_pool,
  })
  .await;

  let job_token = match query_result {
    Ok((job_token, _id)) => job_token,
    Err(err) => {
      warn!("New generic inference job creation DB error: {:?}", err);
      if err.had_duplicate_idempotency_token() {
        return Err(EnqueueImageGenRequestError::BadInput("Duplicate idempotency token".to_string()));
      }
      return Err(EnqueueImageGenRequestError::ServerError);
    },
  };

  let response: EnqueueImageGenRequestSuccessResponse = EnqueueImageGenRequestSuccessResponse { success: true, inference_job_token: job_token };

  let body = serde_json::to_string(&response).map_err(|_e| EnqueueImageGenRequestError::ServerError)?;

  // Error handling 101 rust result type returned like so.
  Ok(HttpResponse::Ok().content_type("application/json").body(body))
}

fn validate_request(request: &Json<EnqueueStudioImageGenRequest>) -> Result<(), EnqueueImageGenRequestError> {
  Ok(())
}

#[derive(Debug)]
pub enum DownloadMediaFileError {
  IoError(std::io::Error),
  MediaFileNotFound,
  Other(anyhow::Error),
}

impl From<anyhow::Error> for DownloadMediaFileError {
  fn from(err: anyhow::Error) -> Self {
    DownloadMediaFileError::Other(err)
  }
}

async fn query_and_download_media_file(media_file_token: &MediaFileToken, download_dir: &TempDir, bucket_client: &BucketClient, mysql_pool: &MySqlPool) -> Result<PathBuf, DownloadMediaFileError> {
  let media_file_result = get_media_file(&media_file_token, false, mysql_pool).await;

  let media_file = match media_file_result {
    Ok(Some(result)) => result,
    Ok(None) => {
      warn!("could not find media file in database: {:?}", media_file_token);
      return Err(DownloadMediaFileError::MediaFileNotFound);
    },
    Err(e) => {
      error!("could not query media file: {:?}", e);
      return Err(DownloadMediaFileError::Other(e));
    },
  };

  let media_file_bucket_path = MediaFileBucketPath::from_object_hash(
    &media_file.public_bucket_directory_hash,
    media_file.maybe_public_bucket_prefix.as_deref(),
    media_file.maybe_public_bucket_extension.as_deref());

  let extension = media_file.maybe_public_bucket_extension.clone().unwrap_or_else(|| ".jpg".to_string());
  let download_filename = format!("download_file_{}.{}", media_file.token.as_str(), extension);
  let download_file_path = download_dir.path().join(download_filename);

  info!("Downloading from bucket...");

  bucket_client.download_file_to_disk(&media_file_bucket_path.to_full_object_pathbuf(), &download_file_path).await?;

  Ok(download_file_path)
}

const SYSTEM_PROMPT_SINGLE_IMAGE: &str =
  "Use the image as a reference for the composition exactly. Copy the character pose, layout, scene, and the objects exactly - no deviation.";

const SYSTEM_PROMPT_MULTI_IMAGE: &str =
  "Use the first image as a reference for the composition exactly. Copy the character pose, layout, scene, and the objects exactly from the first image - no deviation.";

fn create_prompt(request: &EnqueueStudioImageGenRequest) -> String {
  let disable_system_prompt = request.disable_system_prompt
      .clone()
      .unwrap_or(false);

  if disable_system_prompt {
    return request.prompt.clone();
  }

  let extra_image_count = request.maybe_additional_images
      .as_ref()
      .map(|v| v.len())
      .unwrap_or(0);

  if extra_image_count == 0 {
    format!("{} {}", SYSTEM_PROMPT_SINGLE_IMAGE, request.prompt)
  } else {
    format!("{} {}", SYSTEM_PROMPT_MULTI_IMAGE, request.prompt)
  }
}
