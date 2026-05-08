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
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
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
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{
  insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem,
};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;
use crate::util::lookup::lookup_image_urls_as_map::lookup_image_urls_as_map;

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

  // ==================== LOOKUP MEDIA FILES (BATCH) ==================== //

  let mut tokens_to_lookup: Vec<MediaFileToken> = vec![source_video_media_token.clone()];

  if let Some(ref_token) = &request.reference_image_media_token {
    tokens_to_lookup.push(ref_token.clone());
  }

  let cdn_url_map = lookup_image_urls_as_map(
    &http_request,
    &mut mysql_connection,
    server_state.server_environment,
    &tokens_to_lookup,
  ).await.map_err(|err| {
    warn!("Error looking up media files: {:?}", err);
    AdvancedCommonWebError::from(err)
  })?;

  let source_video_cdn_url = cdn_url_map.get(source_video_media_token)
    .ok_or_else(|| {
      warn!("Source video media file not found: {:?}", source_video_media_token);
      AdvancedCommonWebError::NotFound
    })?
    .clone();

  let maybe_reference_image_cdn_url = request.reference_image_media_token.as_ref()
    .map(|ref_token| {
      cdn_url_map.get(ref_token)
        .cloned()
        .ok_or_else(|| {
          warn!("Reference image media file not found: {:?}", ref_token);
          AdvancedCommonWebError::NotFound
        })
    })
    .transpose()?;

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

  let video_extension = std::path::Path::new(&source_video_cdn_url)
    .extension()
    .and_then(|e| e.to_str())
    .unwrap_or("mp4");

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

  // -- Prompt context items --
  if let Some(token) = prompt_token.as_ref() {
    let mut context_items: Vec<PromptContextItem> = Vec::new();

    context_items.push(PromptContextItem {
      media_token: source_video_media_token.clone(),
      context_semantic_type: PromptContextSemanticType::VidRef,
    });

    if let Some(ref_token) = &request.reference_image_media_token {
      context_items.push(PromptContextItem {
        media_token: ref_token.clone(),
        context_semantic_type: PromptContextSemanticType::Imgref,
      });
    }

    if !context_items.is_empty() {
      if let Err(err) = insert_batch_prompt_context_items(InsertBatchArgs {
        prompt_token: token.clone(),
        items: context_items,
        transaction: &mut transaction,
      }).await {
        warn!("Error inserting batch prompt context items: {:?}", err);
      }
    }
  }

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
