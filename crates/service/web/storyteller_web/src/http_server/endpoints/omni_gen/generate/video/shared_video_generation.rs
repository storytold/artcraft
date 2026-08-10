//! The shared video-generation core behind BOTH generate endpoints:
//!
//! - `/v1/omni_gen/generate/video` (web session or API key)
//! - `/v1/omni_api/generate/video` (API key only; URL inputs pre-ingested)
//!
//! The handlers are razor thin: they authenticate, build a
//! [`VideoGenerationAuth`], and delegate here. THIS module is authoritative
//! for generation behavior — validation of the omni_gen request shape,
//! idempotency, media/character resolution, reference-video probing,
//! billing, provider dispatch, and job/prompt record writing.

use std::collections::HashMap;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql};

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::generate_response::omni_gen_video_generate_response::OmniGenVideoGenerateResponse;
use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;
use enums::by_table::debug_logs::debug_log_level::DebugLogLevel;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::platform_type::PlatformType;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::debug_logs::insert_debug_log::{insert_debug_log, InsertDebugLogArgs};
use mysql_queries::queries::generic_inference::api_providers::kinovi_web::insert_generic_inference_job_for_kinovi_web_queue_with_apriori_job_token::KinoviVersion;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::generate::common::generation_debug_logs::GenerationDebugLogContext;
use crate::http_server::endpoints::generate::common::probed_reference_videos::{
  download_and_probe_reference_videos, fetch_reference_video_sources, ProbedReferenceVideos,
};
use crate::http_server::endpoints::omni_gen::generate::video::first_party_minimax_h3::enqueue_first_party_minimax_h3_job::{
  enqueue_first_party_minimax_h3_job, first_party_minimax_h3_model, EnqueueFirstPartyMinimaxH3JobArgs,
};
use crate::http_server::endpoints::omni_gen::generate::video::helpers::hydrate_router_request::hydrate_to_router_request;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::resolve_kinovi_character_ids::resolve_kinovi_character_ids;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::write_prompt_records::{
  write_prompt_records, WritePromptRecordsArgs,
};
use crate::http_server::endpoints::omni_gen::generate::video::insert_db_job::insert_fal_job::{insert_fal_job, InsertFalJobArgs};
use crate::http_server::endpoints::omni_gen::generate::video::insert_db_job::insert_gmicloud_job::{insert_gmicloud_job, InsertGmiCloudJobArgs};
use crate::http_server::endpoints::omni_gen::generate::video::insert_db_job::insert_grok_api_job::{insert_grok_api_job, InsertGrokApiJobArgs};
use crate::http_server::endpoints::omni_gen::generate::video::insert_db_job::insert_kinovi_web_jobs::{insert_kinovi_web_jobs, InsertKinoviWebJobsArgs};
use crate::http_server::endpoints::omni_gen::generate::video::insert_db_job::shared_job_args::SharedJobArgs;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v2::run_pipeline_v2::{run_pipeline_v2, RunPipelineV2Args};
use crate::http_server::endpoints::omni_gen::shared_utils::kinovi_account::KinoviAccount;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_media_files_as_cdn_url_list_and_map::lookup_media_files_as_cdn_url_list_and_map;

/// Who is generating, as established by the calling handler's authentication.
pub struct VideoGenerationAuth<'a> {
  pub user_token: &'a UserToken,

  /// Web sessions only; API-key callers pass None.
  pub maybe_avt_token: Option<AnonymousVisitorTrackingToken>,

  /// API-key callers pass `Some(PlatformType::ApiKey)`; web sessions infer
  /// the platform from the request.
  pub maybe_platform_type: Option<PlatformType>,
}

/// Run one authenticated video generation end to end and return the HTTP
/// response body. `mysql_connection` is the handler's already-open
/// connection (it authenticated on it); the pipeline manages its lifetime
/// from here.
pub async fn run_authenticated_video_generation(
  http_request: &HttpRequest,
  request: &OmniGenVideoCostAndGenerateRequest,
  server_state: &web::Data<Arc<ServerState>>,
  auth: VideoGenerationAuth<'_>,
  mut mysql_connection: PoolConnection<MySql>,
) -> Result<Json<OmniGenVideoGenerateResponse>, CommonWebError> {
  let debug_log_event_token = DebugLogEventToken::generate();

  let maybe_prompt_model_type: Option<CommonModelType> = request.model
    .as_ref()
    .map(|m| m.to_common_model_type());

  let VideoGenerationAuth {
    user_token,
    maybe_avt_token,
    maybe_platform_type,
  } = auth;

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

  if let Some(token) = &request.start_frame_image_media_token {
    all_tokens.push(token.clone());
  }
  if let Some(token) = &request.end_frame_image_media_token {
    all_tokens.push(token.clone());
  }
  if let Some(tokens) = &request.reference_image_media_tokens {
    all_tokens.extend(tokens.iter().cloned());
  }
  if let Some(tokens) = &request.reference_video_media_tokens {
    all_tokens.extend(tokens.iter().cloned());
  }
  if let Some(tokens) = &request.reference_audio_media_tokens {
    all_tokens.extend(tokens.iter().cloned());
  }

  let media_file_to_url_map: Option<HashMap<MediaFileToken, String>> = if all_tokens.is_empty() {
    None
  } else {
    info!("Resolving {} media file tokens to CDN URLs", all_tokens.len());
    let resolved = lookup_media_files_as_cdn_url_list_and_map(
      &http_request,
      &mut mysql_connection,
      server_state.server_environment,
server_state.maybe_media_cdn_override_url.as_deref(),
      &all_tokens,
    ).await?;
    Some(resolved.token_to_url_map)
  };

  // ==================== RESOLVE CHARACTERS ==================== //

  let kinovi_character_id_map: Option<HashMap<CharacterToken, String>> =
    resolve_kinovi_character_ids(
      request.reference_character_tokens.as_deref(),
      &mut mysql_connection,
    ).await?;

  // ==================== REFERENCE VIDEO INPUT SECONDS ==================== //

  // Seedance 2.5 bills reference-video input seconds on top of the output
  // duration. Stored durations can't be trusted for billing, so every
  // reference video is downloaded and ffprobed; the downloaded files are
  // kept and handed to the pipeline so the Kinovi upload reuses them
  // instead of downloading the same bytes twice.
  let mut maybe_probed_reference_videos: Option<ProbedReferenceVideos> = None;

  if matches!(request.model, Some(CommonVideoModel::Seedance2p5 | CommonVideoModel::Seedance2p5Ultra)) {
    if let Some(video_tokens) = request.reference_video_media_tokens.as_deref().filter(|tokens| !tokens.is_empty()) {
      let video_sources = fetch_reference_video_sources(
        video_tokens,
        &http_request,
        server_state.server_environment,
        server_state.maybe_media_cdn_override_url.as_deref(),
        &mut mysql_connection,
      ).await?;

      // Downloads + ffprobe are slow — release the pool slot across them,
      // then re-acquire for billing. Probing never fails the generation:
      // unmeasurable files bill at the 30-second worst case.
      drop(mysql_connection);
      let probed = download_and_probe_reference_videos(&video_sources).await;
      mysql_connection = server_state.mysql_pool.acquire().await?;

      maybe_probed_reference_videos = Some(probed);
    }
  }

  // ==================== HYDRATE ROUTER REQUEST ==================== //

  let mut router_builder = hydrate_to_router_request(&request)?;
  router_builder.total_reference_video_input_seconds =
    maybe_probed_reference_videos.as_ref().map(|probed| probed.total_input_seconds);

  // ==================== PIPELINE DISPATCH ==================== //

  let kinovi_account = match request.model {
    // BytePlus Ultra
    Some(CommonVideoModel::Seedance2p0BytePlusUltra) => KinoviAccount::BytePlusUltra,
    Some(CommonVideoModel::Seedance2p0BytePlusUltraFast) => KinoviAccount::BytePlusUltra,
    Some(CommonVideoModel::Seedance2p0BytePlusUltraMini) => KinoviAccount::BytePlusUltra,
    Some(CommonVideoModel::Seedance2p5Ultra) => KinoviAccount::BytePlusUltra,
    // BytePlus
    Some(CommonVideoModel::Seedance2p0BytePlus) => KinoviAccount::BytePlus,
    Some(CommonVideoModel::Seedance2p0BytePlusFast) => KinoviAccount::BytePlus,
    Some(CommonVideoModel::Seedance2p0BytePlusMini) => KinoviAccount::BytePlus,
    Some(CommonVideoModel::PreviewModel) => KinoviAccount::BytePlus,
    Some(CommonVideoModel::PreviewModelFast) => KinoviAccount::BytePlus,
    // Everything else goes through Volcengine
    _ => KinoviAccount::Volcengine,
  };

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

  // ==================== FIRST-PARTY MINIMAX H3 (TURBO / ULTRA) ==================== //

  // These models run on our own GPU inference — no provider call is made.
  // The module bills the wallet (Ultra only), writes the prompt + job
  // records, and returns; a scheduler picks the pending jobs up later.
  if let Some(minimax_model) = first_party_minimax_h3_model(request.model) {
    return enqueue_first_party_minimax_h3_job(EnqueueFirstPartyMinimaxH3JobArgs {
      minimax_model,
      request: &request,
      user_token,
      maybe_avt_token: maybe_avt_token.as_ref(),
      maybe_prompt_model_type,
      maybe_platform_type,
      idempotency_token: &idempotency_token,
      ip_address: &ip_address,
      debug_log_event_token: &debug_log_event_token,
      mysql_connection,
    }).await;
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
    kinovi_character_id_map: &kinovi_character_id_map,
    kinovi_account,
    debug_log_context: &debug_log_context,
    predownloaded_media_paths: maybe_probed_reference_videos.as_ref().map(|probed| probed.local_paths_by_url()),
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
          message: &format!("Video generation pipeline failed: {:?}", err),
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

  // NB: Outbound provider requests (Fal/Grok/Kinovi) are debug-logged inside
  // the pipeline BEFORE the send, so the payload is captured even on failure.

  // ==================== WRITE RESULT ==================== //

  let mut transaction = mysql_connection.begin().await.map_err(|err| {
    error!("Error starting MySQL transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // -- Prompt + context items --

  let prompt_token = write_prompt_records(WritePromptRecordsArgs {
    request: &request,
    user_token,
    maybe_prompt_model_type,
    ip_address: &ip_address,
    transaction: &mut transaction,
  }).await;

  // -- Inference job --

  let (primary_job_token, all_job_tokens) = match &pipeline_result.response {
    GenerateVideoResponse::KinoviWeb(payload) => {
      info!("Inserting kinovi_web job(s) with token: {:?}", pipeline_result.billing.apriori_job_token);

      let kinovi_version = match kinovi_account {
        KinoviAccount::Volcengine => KinoviVersion::Volcengine,
        KinoviAccount::BytePlus => KinoviVersion::BytePlus,
        KinoviAccount::BytePlusUltra => KinoviVersion::BytePlusUltra,
      };

      let result = insert_kinovi_web_jobs(InsertKinoviWebJobsArgs {
        primary_order_id: &payload.order_id,
        maybe_additional_order_ids: payload.maybe_order_ids.as_deref(),
        maybe_wallet_ledger_entry_token: pipeline_result.billing.maybe_wallet_ledger_entry_token.as_ref(),
        kinovi_version,
        shared: SharedJobArgs {
          apriori_job_token: &pipeline_result.billing.apriori_job_token,
          idempotency_token: &idempotency_token,
          user_token,
          maybe_avt_token: maybe_avt_token.as_ref(),
          maybe_model_type: request.model.map(|v| v.to_common_model_type()),
          maybe_prompt_token: prompt_token.as_ref(),
          maybe_debug_log_event_token: Some(&debug_log_event_token),
          maybe_platform_type,
          maybe_cost_estimates: Some(pipeline_result.cost_estimates),
          ip_address: &ip_address,
          transaction: &mut transaction,
        },
      }).await?;
      (result.primary_job_token, result.all_job_tokens)
    }
    GenerateVideoResponse::Fal(payload) => {
      let external_id = payload.request_id.as_deref().ok_or_else(|| {
        error!("Fal generation response missing request_id");
        CommonWebError::server_error_with_message("Fal generation response missing request_id")
      })?;
      info!("Inserting fal job with token: {:?}", pipeline_result.billing.apriori_job_token);
      let token = insert_fal_job(InsertFalJobArgs {
        external_job_id: external_id,
        shared: SharedJobArgs {
          apriori_job_token: &pipeline_result.billing.apriori_job_token,
          idempotency_token: &idempotency_token,
          user_token,
          maybe_avt_token: maybe_avt_token.as_ref(),
          maybe_model_type: request.model.map(|v| v.to_common_model_type()),
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
    GenerateVideoResponse::Artcraft(payload) => {
      (
        payload.inference_job_token.clone(),
        vec![payload.inference_job_token.clone()],
      )
    }
    GenerateVideoResponse::GmiCloud(payload) => {
      info!("Inserting GmiCloud job with token: {:?}", pipeline_result.billing.apriori_job_token);
      let token = insert_gmicloud_job(InsertGmiCloudJobArgs {
        external_request_id: &payload.request_id,
        shared: SharedJobArgs {
          apriori_job_token: &pipeline_result.billing.apriori_job_token,
          idempotency_token: &idempotency_token,
          user_token,
          maybe_avt_token: maybe_avt_token.as_ref(),
          maybe_model_type: request.model.map(|v| v.to_common_model_type()),
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
    GenerateVideoResponse::Grok(payload) => {
      info!("Inserting Grok (xAI) API job with token: {:?}", pipeline_result.billing.apriori_job_token);
      let token = insert_grok_api_job(InsertGrokApiJobArgs {
        external_request_id: &payload.request_id,
        shared: SharedJobArgs {
          apriori_job_token: &pipeline_result.billing.apriori_job_token,
          idempotency_token: &idempotency_token,
          user_token,
          maybe_avt_token: maybe_avt_token.as_ref(),
          maybe_model_type: request.model.map(|v| v.to_common_model_type()),
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
    other => {
      error!("Unexpected generation response variant: {:?}", other);
      return Err(CommonWebError::server_error_with_message("Unexpected generation response"));
    }
  };

  transaction.commit().await.map_err(|err| {
    error!("Error committing transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(Json(OmniGenVideoGenerateResponse {
    success: true,
    inference_job_token: primary_job_token,
    all_job_tokens,
  }))
}
