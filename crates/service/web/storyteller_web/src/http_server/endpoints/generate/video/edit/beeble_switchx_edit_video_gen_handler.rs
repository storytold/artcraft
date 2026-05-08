use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use sqlx::Acquire;

use artcraft_api_defs::generate::video::edit::beeble_switchx_edit_video::{
  BeebleSwitchXEditVideoRequest, BeebleSwitchXEditVideoResponse,
};
use beeble_client::requests::create_upload_url::upload_bytes::upload_bytes_to_beeble;
use beeble_client::requests::start_generation::start_generation::{
  start_generation, BeebleAlphaMode, BeebleGenerationType, StartGenerationArgs,
  StartGenerationRequest,
};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::generic_inference::beeble::insert_generic_inference_job_for_beeble_queue_with_apriori_job_token::{
  insert_generic_inference_job_for_beeble_queue_with_apriori_job_token,
  InsertGenericInferenceForBeebleWithAprioriJobTokenArgs,
};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file_with_connection;
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;

/// Beeble SwitchX Video Edit
#[utoipa::path(
  post,
  tag = "Generate Videos",
  path = "/v1/generate/video/edit/beeble_switchx",
  request_body = BeebleSwitchXEditVideoRequest,
  responses(
    (status = 200, description = "Success", body = BeebleSwitchXEditVideoResponse),
    (status = 400, description = "Bad input"),
    (status = 401, description = "Unauthorized"),
    (status = 402, description = "Payment required"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn beeble_switchx_edit_video_gen_handler(
  http_request: HttpRequest,
  request: Json<BeebleSwitchXEditVideoRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<BeebleSwitchXEditVideoResponse>, AdvancedCommonWebError> {

  payments_error_test(&request.prompt.as_deref().unwrap_or(""))?;

  // ==================== SESSION ==================== //

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  let maybe_user_session = server_state
    .session_checker
    .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      AdvancedCommonWebError::from(e)
    })?;

  let user_token = match maybe_user_session.as_ref() {
    Some(session) => &session.user_token,
    None => return Err(AdvancedCommonWebError::NotAuthorized),
  };

  let maybe_avt_token = server_state
    .avt_cookie_manager
    .get_avt_token_from_request(&http_request);

  // ==================== VALIDATE INPUT ==================== //

  let source_video_media_token = request.source_video_media_token.as_ref()
    .ok_or_else(|| {
      AdvancedCommonWebError::BadInputWithSimpleMessage("source_video_media_token is required".to_string())
    })?;

  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(AdvancedCommonWebError::BadInputWithSimpleMessage(reason));
  }

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
    .await
    .map_err(|err| {
      error!("Error inserting idempotency token: {:?}", err);
      AdvancedCommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
    })?;

  // ==================== LOOKUP MEDIA FILES ==================== //

  const IS_MOD: bool = false;
  let media_domain = get_media_domain(&http_request);

  // Source video (required)
  let source_video_file = get_media_file_with_connection(
    source_video_media_token, IS_MOD, &mut mysql_connection,
  ).await
    .map_err(|err| {
      warn!("Error looking up source video: {:?}", err);
      AdvancedCommonWebError::from_anyhow_error(err)
    })?
    .ok_or(AdvancedCommonWebError::NotFound)?;

  let source_video_cdn_url = {
    let path = MediaFileBucketPath::from_object_hash(
      &source_video_file.public_bucket_directory_hash,
      source_video_file.maybe_public_bucket_prefix.as_deref(),
      source_video_file.maybe_public_bucket_extension.as_deref(),
    );
    MediaLinksBuilder::from_media_path_and_env(media_domain, server_state.server_environment, &path)
      .cdn_url.to_string()
  };

  // Reference image (optional)
  let maybe_reference_image_cdn_url = if let Some(ref_token) = &request.reference_image_media_token {
    let ref_file = get_media_file_with_connection(ref_token, IS_MOD, &mut mysql_connection)
      .await
      .map_err(|err| {
        warn!("Error looking up reference image: {:?}", err);
        AdvancedCommonWebError::from_anyhow_error(err)
      })?
      .ok_or(AdvancedCommonWebError::NotFound)?;

    let path = MediaFileBucketPath::from_object_hash(
      &ref_file.public_bucket_directory_hash,
      ref_file.maybe_public_bucket_prefix.as_deref(),
      ref_file.maybe_public_bucket_extension.as_deref(),
    );

    Some(
      MediaLinksBuilder::from_media_path_and_env(media_domain, server_state.server_environment, &path)
        .cdn_url.to_string()
    )
  } else {
    None
  };

  // ==================== DOWNLOAD & UPLOAD TO BEEBLE ==================== //

  let beeble_api_key = &server_state.beeble.api_key;

  // Download + upload source video
  info!("Downloading source video from CDN: {}", source_video_cdn_url);
  let video_bytes = http_download_url_to_bytes(&source_video_cdn_url).await
    .map_err(|err| {
      error!("Failed to download source video: {:?}", err);
      AdvancedCommonWebError::from_error(err)
    })?;

  info!("Downloaded source video: {} bytes", video_bytes.len());

  let video_extension = source_video_file.maybe_public_bucket_extension
    .as_deref().unwrap_or("mp4");
  let video_filename = format!("{}.{}", source_video_media_token.as_str(), video_extension);
  let video_content_type = match video_extension {
    "mp4" => "video/mp4",
    "mov" => "video/quicktime",
    _ => "application/octet-stream",
  };

  let video_upload = upload_bytes_to_beeble(
    beeble_api_key, &video_filename, video_content_type, video_bytes.to_vec(),
  ).await.map_err(|err| {
    error!("Beeble video upload failed: {:?}", err);
    AdvancedCommonWebError::from_error(err)
  })?;

  info!("Source video uploaded to Beeble: {}", video_upload.beeble_uri);

  // Download + upload reference image (if provided)
  let maybe_reference_beeble_uri = if let Some(ref_cdn_url) = &maybe_reference_image_cdn_url {
    info!("Downloading reference image from CDN: {}", ref_cdn_url);
    let image_bytes = http_download_url_to_bytes(ref_cdn_url).await
      .map_err(|err| {
        error!("Failed to download reference image: {:?}", err);
        AdvancedCommonWebError::from_error(err)
      })?;

    info!("Downloaded reference image: {} bytes", image_bytes.len());

    let ref_token = request.reference_image_media_token.as_ref().unwrap();
    let image_filename = format!("{}.jpg", ref_token.as_str());

    let image_upload = upload_bytes_to_beeble(
      beeble_api_key, &image_filename, "image/jpeg", image_bytes.to_vec(),
    ).await.map_err(|err| {
      error!("Beeble image upload failed: {:?}", err);
      AdvancedCommonWebError::from_error(err)
    })?;

    info!("Reference image uploaded to Beeble: {}", image_upload.beeble_uri);
    Some(image_upload.beeble_uri)
  } else {
    None
  };

  // ==================== CALL BEEBLE GENERATE ==================== //

  let apriori_job_token = InferenceJobToken::generate();

  let beeble_result = start_generation(StartGenerationArgs {
    api_key: beeble_api_key.clone(),
    request: StartGenerationRequest {
      generation_type: BeebleGenerationType::Video,
      source_uri: video_upload.beeble_uri,
      alpha_mode: BeebleAlphaMode::Auto,
      prompt: request.prompt.clone(),
      reference_image_uri: maybe_reference_beeble_uri,
      alpha_uri: None,
      max_resolution: Some(1080),
      callback_url: None,
      idempotency_key: Some(request.uuid_idempotency_token.clone()),
    },
  }).await.map_err(|err| {
    error!("Beeble start_generation failed: {:?}", err);
    AdvancedCommonWebError::from_error(err)
  })?;

  let external_job_id = &beeble_result.id;
  info!("Beeble job started: id={}, status={}", external_job_id, beeble_result.status);

  // ==================== DB TRANSACTION ==================== //

  let ip_address = get_request_ip(&http_request);

  let mut transaction = mysql_connection.begin().await.map_err(|err| {
    error!("Error starting MySQL transaction: {:?}", err);
    AdvancedCommonWebError::from_error(err)
  })?;

  // -- Prompt --
  let prompt_token = match insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: Some(user_token),
    maybe_model_type: Some(CommonModelType::SwitchX),
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: None,
    maybe_other_args: None,
    maybe_generation_mode: Some(CommonGenerationMode::Edit),
    maybe_aspect_ratio: None,
    maybe_resolution: None,
    maybe_batch_count: None,
    maybe_generate_audio: None,
    maybe_duration_seconds: None,
    creator_ip_address: &ip_address,
    mysql_executor: &mut *transaction,
    phantom: Default::default(),
  }).await {
    Ok(token) => Some(token),
    Err(err) => {
      warn!("Error inserting prompt: {:?}", err);
      None
    }
  };

  // -- Inference job --
  let db_result = insert_generic_inference_job_for_beeble_queue_with_apriori_job_token(
    InsertGenericInferenceForBeebleWithAprioriJobTokenArgs {
      apriori_job_token: &apriori_job_token,
      uuid_idempotency_token: &request.uuid_idempotency_token,
      maybe_external_third_party_id: external_job_id,
      maybe_inference_args: None,
      maybe_prompt_token: prompt_token.as_ref(),
      maybe_creator_user_token: Some(user_token),
      maybe_avt_token: maybe_avt_token.as_ref(),
      creator_ip_address: &ip_address,
      creator_set_visibility: Visibility::Public,
      maybe_debug_log_event_token: None,
      starting_job_status_override: None,
      maybe_frontend_failure_category: None,
      maybe_failure_reason: None,
      mysql_executor: &mut *transaction,
      phantom: Default::default(),
    }
  ).await;

  let job_token = match db_result {
    Ok(token) => token,
    Err(err) => {
      error!("Error inserting inference job: {:?}", err);
      return Err(AdvancedCommonWebError::from_error(err));
    }
  };

  transaction.commit().await.map_err(|err| {
    error!("Error committing transaction: {:?}", err);
    AdvancedCommonWebError::from_error(err)
  })?;

  Ok(Json(BeebleSwitchXEditVideoResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
