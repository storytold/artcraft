use std::collections::HashMap;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use sqlx::Acquire;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_splat_cost_and_generate_request::OmniGenSplatCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::generate_response::omni_gen_splat_generate_response::OmniGenSplatGenerateResponse;
use artcraft_router::generate::generate_splat::generate_splat_response::GenerateSplatResponse;
use enums::by_table::debug_logs::debug_log_level::DebugLogLevel;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation_provider::GenerationProvider;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::debug_logs::insert_debug_log::{insert_debug_log, InsertDebugLogArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{
  insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem,
};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::generate::common::generation_debug_logs::GenerationDebugLogContext;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::endpoints::omni_gen::generate::splat::helpers::hydrate_router_request::hydrate_to_router_request;
use crate::http_server::endpoints::omni_gen::generate::splat::insert_db_job::insert_worldlabs_job::{insert_worldlabs_job, InsertWorldlabsJobArgs};
use crate::http_server::endpoints::omni_gen::generate::splat::pipeline_v2::run_pipeline_v2::{run_pipeline_v2, RunPipelineV2Args};
use crate::http_server::endpoints::omni_gen::generate::video::insert_db_job::shared_job_args::SharedJobArgs;
use crate::http_server::endpoints::omni_gen::shared_utils::splat::validate_splat_request::validate_splat_request;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::http_server::web_utils::get_request_platform_type::get_request_platform_type;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_media_files_as_cdn_url_list_and_map::lookup_media_files_as_cdn_url_list_and_map;

/// Generate a splat (3D world) using the omni-gen unified endpoint.
#[utoipa::path(
  post,
  tag = "Omni Gen",
  path = "/v1/omni_gen/generate/splat",
  request_body = OmniGenSplatCostAndGenerateRequest,
  responses(
    (status = 200, description = "Success", body = OmniGenSplatGenerateResponse),
    (status = 400, description = "Bad input"),
    (status = 401, description = "Unauthorized"),
    (status = 402, description = "Payment required"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_gen_splat_generate_handler(
  http_request: HttpRequest,
  request: Json<OmniGenSplatCostAndGenerateRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniGenSplatGenerateResponse>, CommonWebError> {

  info!("request: {:?}", request);

  // Reject doomed combos (e.g. video + images, panorama without exactly one
  // image) before any billable or DB-mutating work — see helper for the rules.
  validate_splat_request(&request)?;

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

  let mut all_tokens: Vec<MediaFileToken> = Vec::new();

  if let Some(tokens) = &request.reference_image_media_tokens {
    all_tokens.extend(tokens.iter().cloned());
  }
  if let Some(token) = &request.reference_video_media_token {
    all_tokens.push(token.clone());
  }

  let media_file_to_url_map: Option<HashMap<MediaFileToken, String>> = if all_tokens.is_empty() {
    None
  } else {
    info!("Resolving {} media file tokens to CDN URLs", all_tokens.len());
    let resolved = lookup_media_files_as_cdn_url_list_and_map(
      &http_request,
      &mut mysql_connection,
      server_state.server_environment,
      &all_tokens,
    ).await?;
    Some(resolved.token_to_url_map)
  };

  // ==================== HYDRATE ROUTER REQUEST ==================== //

  let router_builder = hydrate_to_router_request(&request)?;

  // ==================== DEBUG LOG: HTTP REQUEST ==================== //

  let ip_address = get_request_ip(&http_request);
  let request_url = http_request.uri().to_string();

  if let Err(err) = insert_debug_log(InsertDebugLogArgs {
    apriori_debug_log_event_token: Some(&debug_log_event_token),
    maybe_creator_user_token: Some(user_token),
    debug_log_type: DebugLogType::HttpRequest,
    maybe_log_level: Some(DebugLogLevel::Info),
    maybe_ip_address: Some(&ip_address),
    maybe_url: Some(&request_url),
    message: &serde_json::to_string(&*request).unwrap_or_default(),
    mysql_executor: &mut *mysql_connection,
    phantom: Default::default(),
  }).await {
    warn!("Failed to insert HTTP request debug log: {:?}", err);
  }

  // NB: The pipeline takes over the connection for its remaining pre-request DB writes (billing,
  // outbound provider request debug log) and releases it before the (slow, external) generation
  // call — holding a pool slot across that call is what starves the pool and causes PoolTimedOut
  // on unrelated endpoints. We re-acquire below to write the result.

  let debug_log_context = GenerationDebugLogContext {
    event_token: &debug_log_event_token,
    user_token,
    ip_address: &ip_address,
    request_url: &request_url,
  };

  let pipeline_result = run_pipeline_v2(RunPipelineV2Args {
    router_builder: &router_builder,
    server_state: &server_state,
    user_token,
    media_file_to_url_map: &media_file_to_url_map,
    debug_log_context: &debug_log_context,
    mysql_connection,
  }).await;

  // ==================== DEBUG LOG: PIPELINE ERROR ==================== //

  let pipeline_result = match pipeline_result {
    Ok(result) => result,
    Err(err) => {
      // Best-effort error log; never mask the original error.
      if let Ok(mut error_log_connection) = server_state.mysql_pool.acquire().await {
        if let Err(log_err) = insert_debug_log(InsertDebugLogArgs {
          apriori_debug_log_event_token: Some(&debug_log_event_token),
          maybe_creator_user_token: Some(user_token),
          debug_log_type: DebugLogType::BackendFailure,
          maybe_log_level: Some(DebugLogLevel::Error),
          maybe_ip_address: Some(&ip_address),
          maybe_url: Some(&request_url),
          message: &format!("Splat generation pipeline failed: {:?}", err),
          mysql_executor: &mut *error_log_connection,
          phantom: Default::default(),
        }).await {
          warn!("Failed to insert pipeline error debug log: {:?}", log_err);
        }
      }
      return Err(err);
    }
  };

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  // NB: Outbound provider requests are debug-logged inside the pipeline
  // BEFORE the send, so the payload is captured even on failure.

  // ==================== WRITE RESULT ==================== //

  let maybe_platform_type = get_request_platform_type(&http_request);

  let mut transaction = mysql_connection.begin().await.map_err(|err| {
    error!("Error starting MySQL transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // -- Prompt --

  let prompt_token = match insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: Some(user_token),
    maybe_model_type: maybe_prompt_model_type,
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: None,
    maybe_other_args: None,
    maybe_generation_mode: Some(determine_generation_mode(&request)),
    maybe_aspect_ratio: None,
    maybe_resolution: None,
    maybe_bitrate: None,
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
    let mut context_items = Vec::new();

    if let Some(ref_tokens) = &request.reference_image_media_tokens {
      for media_token in ref_tokens {
        context_items.push(PromptContextItem {
          media_token: media_token.clone(),
          context_semantic_type: PromptContextSemanticType::Imgref,
        });
      }
    }
    if let Some(video_token) = &request.reference_video_media_token {
      context_items.push(PromptContextItem {
        media_token: video_token.clone(),
        context_semantic_type: PromptContextSemanticType::VidRef,
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

  let (primary_job_token, all_job_tokens): (InferenceJobToken, Vec<InferenceJobToken>) =
    match &pipeline_result.response {
      GenerateSplatResponse::WorldLabs(payload) => {
        info!("Inserting worldlabs splat job with token: {:?}", pipeline_result.billing.apriori_job_token);

        let token = insert_worldlabs_job(InsertWorldlabsJobArgs {
          operation_id: &payload.operation_id,
          maybe_wallet_ledger_entry_token: pipeline_result.billing.maybe_wallet_ledger_entry_token.as_ref(),
          shared: SharedJobArgs {
            apriori_job_token: &pipeline_result.billing.apriori_job_token,
            idempotency_token: &idempotency_token,
            user_token,
            maybe_avt_token: maybe_avt_token.as_ref(),
            maybe_model_type: maybe_prompt_model_type,
            maybe_prompt_token: prompt_token.as_ref(),
            maybe_debug_log_event_token: Some(&debug_log_event_token),
            maybe_platform_type,
            maybe_cost_estimates: Some(pipeline_result.cost_estimates),
            ip_address: &ip_address,
            transaction: &mut transaction,
          },
        }).await?;

        (
          token.clone(),
          vec![token],
        )
      }
      GenerateSplatResponse::Artcraft(payload) => {
        (
          payload.inference_job_token.clone(),
          payload.all_inference_job_tokens.clone(),
        )
      }
    };

  transaction.commit().await.map_err(|err| {
    error!("Error committing transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(Json(OmniGenSplatGenerateResponse {
    success: true,
    inference_job_token: primary_job_token,
    all_job_tokens,
  }))
}

fn determine_generation_mode(request: &OmniGenSplatCostAndGenerateRequest) -> CommonGenerationMode {
  let has_reference = request.reference_image_media_tokens.as_ref().is_some_and(|t| !t.is_empty())
    || request.reference_video_media_token.is_some();

  if has_reference {
    return CommonGenerationMode::Reference;
  }

  CommonGenerationMode::Text
}
