use std::collections::HashMap;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use sqlx::Acquire;
use url::Url;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::generate_response::omni_gen_video_generate_response::OmniGenVideoGenerateResponse;
use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation_provider::GenerationProvider;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::debug_logs::insert_debug_log::{insert_debug_log, InsertDebugLogArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{
  insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem,
};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::hydrate_router_request::hydrate_to_router_request;
use crate::http_server::endpoints::omni_gen::generate::video::insert_db_job::insert_fal_job::{insert_fal_job, InsertFalJobArgs};
use crate::http_server::endpoints::omni_gen::generate::video::insert_db_job::insert_gmicloud_job::{insert_gmicloud_job, InsertGmiCloudJobArgs};
use crate::http_server::endpoints::omni_gen::generate::video::insert_db_job::insert_seedance2pro_jobs::{insert_seedance2pro_jobs, InsertSeedance2proJobsArgs};
use crate::http_server::endpoints::omni_gen::generate::video::insert_db_job::shared_job_args::SharedJobArgs;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v1::run_pipeline_v1::{run_pipeline_v1, RunPipelineV1Args};
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v2::run_pipeline_v2::{run_pipeline_v2, RunPipelineV2Args};
use crate::http_server::endpoints::omni_gen::generate::video::helpers::resolve_kinovi_character_ids::resolve_kinovi_character_ids;
use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_image_urls_as_map::lookup_image_urls_as_map;

/// Generate a video using the omni-gen unified endpoint.
#[utoipa::path(
  post,
  tag = "Omni Gen",
  path = "/v1/omni_gen/generate/video",
  request_body = OmniGenVideoCostAndGenerateRequest,
  responses(
    (status = 200, description = "Success", body = OmniGenVideoGenerateResponse),
    (status = 400, description = "Bad input"),
    (status = 401, description = "Unauthorized"),
    (status = 402, description = "Payment required"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_gen_video_generate_handler(
  http_request: HttpRequest,
  request: Json<OmniGenVideoCostAndGenerateRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniGenVideoGenerateResponse>, AdvancedCommonWebError> {

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
      AdvancedCommonWebError::from(e)
    })?;

  let session = match maybe_user_session.as_ref() {
    Some(session) => session,
    None => return Err(AdvancedCommonWebError::NotAuthorized),
  };

  let user_token = &session.user_token;

  let user_feature_flags =
      UserSessionFeatureFlags::new(session.maybe_feature_flags.as_deref());

  // ==================== MODEL ACCESS CHECK ==================== //

  let maybe_avt_token = server_state
    .avt_cookie_manager
    .get_avt_token_from_request(&http_request);

  // ==================== IDEMPOTENCY ==================== //

  let idempotency_token = request.idempotency_token.as_deref()
    .unwrap_or("")
    .to_string();

  if let Err(reason) = validate_idempotency_token_format(&idempotency_token) {
    return Err(AdvancedCommonWebError::BadInputWithSimpleMessage(reason));
  }

  insert_idempotency_token(&idempotency_token, &mut *mysql_connection)
    .await
    .map_err(|err| {
      error!("Error inserting idempotency token: {:?}", err);
      AdvancedCommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
    })?;

  // ==================== RESOLVE MEDIA TOKENS ==================== //

  let media_file_hydration_map: Option<HashMap<MediaFileToken, Url>> = {
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

    if all_tokens.is_empty() {
      None
    } else {
      info!("Resolving {} media file tokens to CDN URLs", all_tokens.len());
      let raw = lookup_image_urls_as_map(
        &http_request,
        &mut mysql_connection,
        server_state.server_environment,
        &all_tokens,
      ).await?;
      let parsed: HashMap<MediaFileToken, Url> = raw.into_iter()
        .filter_map(|(token, url_str)| match Url::parse(&url_str) {
          Ok(url) => Some((token, url)),
          Err(err) => {
            warn!("Failed to parse media file URL {:?}: {:?}", url_str, err);
            None
          }
        })
        .collect();
      Some(parsed)
    }
  };

  let media_file_to_url_map: Option<HashMap<MediaFileToken, String>> =
    media_file_hydration_map.as_ref().map(|map| {
      map.iter().map(|(k, v)| (k.clone(), v.to_string())).collect()
    });

  // ==================== RESOLVE CHARACTERS ==================== //

  let kinovi_character_id_map: Option<HashMap<CharacterToken, String>> =
    resolve_kinovi_character_ids(
      request.reference_character_tokens.as_deref(),
      &mut mysql_connection,
    ).await?;

  // ==================== HYDRATE ROUTER REQUEST ==================== //

  let router_builder = hydrate_to_router_request(&request)?;

  // ==================== PIPELINE DISPATCH ==================== //

  let use_v2 = match request.model {
    Some(CommonVideoModel::HappyHorse1p0) => true,
    Some(CommonVideoModel::Seedance2p0) => true,
    Some(CommonVideoModel::Seedance2p0Fast) => true,
    Some(CommonVideoModel::Seedance2p0Global) => true,
    Some(CommonVideoModel::Seedance2p0FastGlobal) => true,
    _ => false,
  };

  let pipeline_result = if use_v2 {
    info!("Using pipeline v2");
    run_pipeline_v2(RunPipelineV2Args {
      router_builder: &router_builder,
      server_state: &server_state,
      mysql_connection: &mut mysql_connection,
      user_token,
      media_file_to_url_map: &media_file_to_url_map,
      kinovi_character_id_map: &kinovi_character_id_map,
    }).await?
  } else {
    info!("Using pipeline v1");
    run_pipeline_v1(RunPipelineV1Args {
      request: &request,
      router_builder: &router_builder,
      server_state: &server_state,
      mysql_connection: &mut mysql_connection,
      user_token,
      media_url_map: &media_file_hydration_map,
      kinovi_character_id_map: &kinovi_character_id_map,
    }).await?
  };

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

  // ==================== DEBUG LOG: FAL REQUEST ==================== //

  if let GenerateVideoResponse::Fal(ref fal_payload) = pipeline_result.response {
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

  let mut transaction = mysql_connection.begin().await.map_err(|err| {
    error!("Error starting MySQL transaction: {:?}", err);
    AdvancedCommonWebError::from_error(err)
  })?;

  // -- Prompt --

  let prompt_token = match insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: Some(user_token),
    maybe_model_type: maybe_prompt_model_type,
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: request.negative_prompt.as_deref(),
    maybe_other_args: None,
    maybe_generation_mode: Some(determine_generation_mode(&request)),
    maybe_aspect_ratio: request.aspect_ratio,
    maybe_resolution: request.resolution,
    maybe_batch_count: request.video_batch_count.map(|c| c as u8),
    maybe_generate_audio: request.generate_audio,
    maybe_duration_seconds: request.duration_seconds.map(|d| d as u32),
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

    if let Some(media_token) = &request.start_frame_image_media_token {
      context_items.push(PromptContextItem {
        media_token: media_token.clone(),
        context_semantic_type: PromptContextSemanticType::VidStartFrame,
      });
    }
    if let Some(media_token) = &request.end_frame_image_media_token {
      context_items.push(PromptContextItem {
        media_token: media_token.clone(),
        context_semantic_type: PromptContextSemanticType::VidEndFrame,
      });
    }
    if let Some(ref_tokens) = &request.reference_image_media_tokens {
      for media_token in ref_tokens {
        context_items.push(PromptContextItem {
          media_token: media_token.clone(),
          context_semantic_type: PromptContextSemanticType::Imgref,
        });
      }
    }
    if let Some(ref_tokens) = &request.reference_video_media_tokens {
      for media_token in ref_tokens {
        context_items.push(PromptContextItem {
          media_token: media_token.clone(),
          context_semantic_type: PromptContextSemanticType::VidRef,
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

  let (primary_job_token, all_job_tokens) = match &pipeline_result.response {
    GenerateVideoResponse::Seedance2Pro(payload) => {
      info!("Inserting seedance2pro job(s) with token: {:?}", pipeline_result.billing.apriori_job_token);
      let result = insert_seedance2pro_jobs(InsertSeedance2proJobsArgs {
        primary_order_id: &payload.order_id,
        maybe_additional_order_ids: payload.maybe_order_ids.as_deref(),
        maybe_wallet_ledger_entry_token: pipeline_result.billing.maybe_wallet_ledger_entry_token.as_ref(),
        shared: SharedJobArgs {
          apriori_job_token: &pipeline_result.billing.apriori_job_token,
          idempotency_token: &idempotency_token,
          user_token,
          maybe_avt_token: maybe_avt_token.as_ref(),
          maybe_prompt_token: prompt_token.as_ref(),
          maybe_debug_log_event_token: Some(&debug_log_event_token),
          ip_address: &ip_address,
          transaction: &mut transaction,
        },
      }).await?;
      (result.primary_job_token, result.all_job_tokens)
    }
    GenerateVideoResponse::Fal(payload) => {
      let external_id = payload.request_id.as_deref().ok_or_else(|| {
        error!("Fal generation response missing request_id");
        AdvancedCommonWebError::server_error_with_message("Fal generation response missing request_id")
      })?;
      info!("Inserting fal job with token: {:?}", pipeline_result.billing.apriori_job_token);
      let token = insert_fal_job(InsertFalJobArgs {
        external_job_id: external_id,
        shared: SharedJobArgs {
          apriori_job_token: &pipeline_result.billing.apriori_job_token,
          idempotency_token: &idempotency_token,
          user_token,
          maybe_avt_token: maybe_avt_token.as_ref(),
          maybe_prompt_token: prompt_token.as_ref(),
          maybe_debug_log_event_token: Some(&debug_log_event_token),
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
          maybe_prompt_token: prompt_token.as_ref(),
          maybe_debug_log_event_token: Some(&debug_log_event_token),
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
      return Err(AdvancedCommonWebError::server_error_with_message("Unexpected generation response"));
    }
  };

  transaction.commit().await.map_err(|err| {
    error!("Error committing transaction: {:?}", err);
    AdvancedCommonWebError::from_error(err)
  })?;

  Ok(Json(OmniGenVideoGenerateResponse {
    success: true,
    inference_job_token: primary_job_token,
    all_job_tokens,
  }))
}

fn determine_generation_mode(request: &OmniGenVideoCostAndGenerateRequest) -> CommonGenerationMode {
  let has_keyframe = request.start_frame_image_media_token.is_some()
    || request.end_frame_image_media_token.is_some();

  if has_keyframe {
    return CommonGenerationMode::Keyframe;
  }

  let has_reference = request.reference_image_media_tokens.as_ref().is_some_and(|t| !t.is_empty())
    || request.reference_video_media_tokens.as_ref().is_some_and(|t| !t.is_empty())
    || request.reference_audio_media_tokens.as_ref().is_some_and(|t| !t.is_empty())
    || request.reference_character_tokens.as_ref().is_some_and(|t| !t.is_empty());

  if has_reference {
    return CommonGenerationMode::Reference;
  }

  CommonGenerationMode::Text
}
