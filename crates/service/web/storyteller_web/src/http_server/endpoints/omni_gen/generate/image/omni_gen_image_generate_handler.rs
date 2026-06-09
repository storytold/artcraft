use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use sqlx::Acquire;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::generate_response::omni_gen_image_generate_response::OmniGenImageGenerateResponse;
use artcraft_router::generate::generate_image::generate_image_response::GenerateImageResponse;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation_provider::GenerationProvider;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::debug_logs::insert_debug_log::{insert_debug_log, InsertDebugLogArgs};
use mysql_queries::queries::generic_inference::api_providers::seedance2pro::insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token::KinoviVersion;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{
  insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem,
};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::endpoints::omni_gen::generate::image::hydrate_to_router_request::hydrate_to_router_request;
use crate::http_server::endpoints::omni_gen::generate::image::insert_db_job::insert_fal_job::{insert_fal_job, InsertFalJobArgs};
use crate::http_server::endpoints::omni_gen::generate::image::insert_db_job::insert_seedance2pro_jobs::{insert_seedance2pro_jobs, InsertSeedance2proJobsArgs};
use crate::http_server::endpoints::omni_gen::generate::image::insert_db_job::shared_job_args::SharedJobArgs;
use crate::http_server::endpoints::omni_gen::generate::image::pipeline_v2::run_pipeline_v2::{run_pipeline_v2, RunPipelineV2Args};
use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::http_server::web_utils::get_request_platform_type::get_request_platform_type;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_media_files_as_cdn_url_list_and_map::lookup_media_files_as_cdn_url_list_and_map;

/// Generate an image using the omni-gen unified endpoint.
#[utoipa::path(
  post,
  tag = "Omni Gen",
  path = "/v1/omni_gen/generate/image",
  request_body = OmniGenImageCostAndGenerateRequest,
  responses(
    (status = 200, description = "Success", body = OmniGenImageGenerateResponse),
    (status = 400, description = "Bad input"),
    (status = 401, description = "Unauthorized"),
    (status = 402, description = "Payment required"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_gen_image_generate_handler(
  http_request: HttpRequest,
  request: Json<OmniGenImageCostAndGenerateRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniGenImageGenerateResponse>, CommonWebError> {

  info!("request: {:?}", request);

  payments_error_test(&request.prompt.as_deref().unwrap_or(""))?;

  let debug_log_event_token = DebugLogEventToken::generate();

  let maybe_prompt_model_type: Option<CommonModelType> = request.model
    .as_ref()
    .map(|m| m.to_common_model_type());

  // ==================== SESSION ==================== //

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  let maybe_user_session = server_state
    .session_checker
    .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      CommonWebError::from(e)
    })?;

  let session = match maybe_user_session.as_ref() {
    Some(session) => session,
    None => return Err(CommonWebError::NotAuthorized),
  };

  let user_token = &session.user_token;

  let maybe_avt_token = server_state
    .avt_cookie_manager
    .get_avt_token_from_request(&http_request);

  // ==================== MODEL ACCESS CHECK ==================== //

  let user_feature_flags =
      UserSessionFeatureFlags::new(session.maybe_feature_flags.as_deref());

  // ==================== IDEMPOTENCY ==================== //

  let idempotency_token = request.idempotency_token.as_deref()
    .unwrap_or("")
    .to_string();

  if let Err(reason) = validate_idempotency_token_format(&idempotency_token) {
    return Err(CommonWebError::BadInputWithSimpleMessage(reason));
  }

  insert_idempotency_token(&idempotency_token, &mut *mysql_connection)
    .await
    .map_err(|err| {
      error!("Error inserting idempotency token: {:?}", err);
      CommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
    })?;

  // ==================== RESOLVE MEDIA TOKENS ==================== //

  // Look up media file tokens BEFORE distilling. Pipeline execution should not do I/O.
  let resolved_media = lookup_media_files_as_cdn_url_list_and_map(
    &http_request,
    &mut mysql_connection,
    server_state.server_environment,
    request.image_media_tokens.as_deref().unwrap_or(&[]),
  ).await?;

  // ==================== HYDRATE ROUTER REQUEST ==================== //

  let router_builder = hydrate_to_router_request(&request)?;

  // ==================== DEBUG LOG: HTTP REQUEST ==================== //

  if let Err(err) = insert_debug_log(InsertDebugLogArgs {
    apriori_debug_log_event_token: Some(&debug_log_event_token),
    maybe_creator_user_token: Some(user_token),
    debug_log_type: DebugLogType::HttpRequest,
    message: &serde_json::to_string(&*request).unwrap_or_default(),
    mysql_executor: &mut *mysql_connection,
    phantom: Default::default(),
  }).await {
    warn!("Failed to insert HTTP request debug log: {:?}", err);
  }

  // ==================== PIPELINE ==================== //

  let pipeline_result = run_pipeline_v2(RunPipelineV2Args {
    router_builder: &router_builder,
    server_state: &server_state,
    mysql_connection: &mut mysql_connection,
    user_token,
    resolved_media: &resolved_media,
  }).await?;

  // ==================== DEBUG LOG: FAL REQUEST ==================== //

  if let GenerateImageResponse::Fal(ref fal_payload) = pipeline_result.response {
    if let Some(ref outbound_request) = fal_payload.maybe_outbound_request {
      if let Err(err) = insert_debug_log(InsertDebugLogArgs {
        apriori_debug_log_event_token: Some(&debug_log_event_token),
        maybe_creator_user_token: Some(user_token),
        debug_log_type: DebugLogType::FalRequest,
        message: &format!("{:#?}", outbound_request),
        mysql_executor: &mut *mysql_connection,
        phantom: Default::default(),
      }).await {
        warn!("Failed to insert Fal request debug log: {:?}", err);
      }
    }
  }

  // ==================== WRITE RESULT ==================== //

  let ip_address = get_request_ip(&http_request);
  let maybe_platform_type = get_request_platform_type(&http_request);

  let mut transaction = mysql_connection
    .begin()
    .await
    .map_err(|err| {
      error!("Error starting MySQL transaction: {:?}", err);
      CommonWebError::from_error(err)
    })?;

  // -- Prompt --

  let generation_mode = if request.image_media_tokens.is_some() {
    CommonGenerationMode::Edit
  } else {
    CommonGenerationMode::Text
  };

  let prompt_result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: Some(user_token),
    maybe_model_type: maybe_prompt_model_type,
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: None,
    maybe_other_args: None,
    maybe_generation_mode: Some(generation_mode),
    maybe_aspect_ratio: request.aspect_ratio, // TODO: should be saved from router's decision as it could have changed
    maybe_resolution: request.resolution,// TODO: should be saved from router's decision as it could have changed
    maybe_batch_count: request.image_batch_count.map(|c| c as u8),
    maybe_generate_audio: None, // NB: Images, not video
    maybe_duration_seconds: None, // NB: Images, not video
    creator_ip_address: &ip_address,
    mysql_executor: &mut *transaction,
    phantom: Default::default(),
  }).await;

  let prompt_token = match prompt_result {
    Ok(token) => Some(token),
    Err(err) => {
      warn!("Error inserting prompt: {:?}", err);
      None
    }
  };

  // -- Prompt context items --

  if let Some(token) = prompt_token.as_ref() {
    let mut context_items = Vec::new();

    if let Some(ref_tokens) = &request.image_media_tokens {
      for media_token in ref_tokens {
        context_items.push(PromptContextItem {
          media_token: media_token.clone(),
          context_semantic_type: PromptContextSemanticType::Imgref,
        });
      }
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
  //
  // Each provider has its own queue / worker. Branch by response variant
  // so the row lands on the correct queue (the Seedance2Pro/Kinovi worker
  // for Midjourney; the Fal worker for everything else).

  let job_token: InferenceJobToken = match &pipeline_result.response {
    GenerateImageResponse::Seedance2Pro(payload) => {
      info!("Inserting seedance2pro image job(s) with token: {:?}", pipeline_result.apriori_job_token);

      // The image-side omni pipeline always dispatches Midjourney via the
      // Volcengine Kinovi account today. If we ever route to BytePlus /
      // BytePlus Ultra here, mirror the video-side `kinovi_account` knob.
      let kinovi_version = KinoviVersion::Volcengine;

      let result = insert_seedance2pro_jobs(InsertSeedance2proJobsArgs {
        primary_order_id: &payload.order_id,
        maybe_additional_order_ids: payload.maybe_order_ids.as_deref(),
        maybe_wallet_ledger_entry_token: pipeline_result.maybe_wallet_ledger_entry_token.as_ref(),
        kinovi_version,
        shared: SharedJobArgs {
          apriori_job_token: &pipeline_result.apriori_job_token,
          idempotency_token: &idempotency_token,
          user_token,
          maybe_avt_token: maybe_avt_token.as_ref(),
          maybe_model_type: request.model.map(|v| v.to_common_model_type()),
          maybe_prompt_token: prompt_token.as_ref(),
          maybe_debug_log_event_token: Some(&debug_log_event_token),
          maybe_platform_type,
          ip_address: &ip_address,
          transaction: &mut transaction,
        },
      }).await?;
      result.primary_job_token
    }
    GenerateImageResponse::Fal(payload) => {
      info!("Inserting fal image job with token: {:?}", pipeline_result.apriori_job_token);
      let external_job_id = payload.request_id.clone().unwrap_or_default();
      insert_fal_job(InsertFalJobArgs {
        external_job_id: &external_job_id,
        shared: SharedJobArgs {
          apriori_job_token: &pipeline_result.apriori_job_token,
          idempotency_token: &idempotency_token,
          user_token,
          maybe_avt_token: maybe_avt_token.as_ref(),
          maybe_model_type: request.model.map(|v| v.to_common_model_type()),
          maybe_prompt_token: prompt_token.as_ref(),
          maybe_debug_log_event_token: Some(&debug_log_event_token),
          maybe_platform_type,
          ip_address: &ip_address,
          transaction: &mut transaction,
        },
      }).await?
    }
    GenerateImageResponse::Artcraft(payload) => {
      // The omni image pipeline never dispatches via the Artcraft provider
      // itself today (everything routes to Fal or Kinovi), but the response
      // variant exists so we cover it defensively — Artcraft jobs come back
      // already inserted server-side, so just propagate the token.
      payload.inference_job_token.clone()
    }
  };

  transaction.commit().await.map_err(|err| {
    error!("Error committing transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(Json(OmniGenImageGenerateResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
