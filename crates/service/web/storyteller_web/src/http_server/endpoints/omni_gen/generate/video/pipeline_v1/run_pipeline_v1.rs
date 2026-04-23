use std::collections::HashMap;

use log::{info, warn};
use url::Url;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_router::api::audio_list_ref::AudioListRef;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::image_ref::ImageRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::api::video_list_ref::VideoListRef;
use artcraft_router::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;
use artcraft_router::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use artcraft_router::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use enums::common::generation::common_video_model::CommonVideoModel;
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::bill_wallet::bill_wallet;
use crate::http_server::endpoints::omni_gen::generate::video::hydrate_router_request::hydrate_to_router_request;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_result::PipelineResult;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v1::execute::execute_fal::execute_generation_fal;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v1::execute::execute_kinovi::execute_generation_kinovi;
use crate::state::server_state::ServerState;

// ── Pipeline args ──

pub struct RunPipelineV1Args<'a> {
  pub request: &'a OmniGenVideoCostAndGenerateRequest,
  pub server_state: &'a ServerState,
  pub mysql_connection: &'a mut sqlx::pool::PoolConnection<sqlx::MySql>,
  pub user_token: &'a UserToken,
  pub media_file_hydration_map: &'a Option<HashMap<MediaFileToken, Url>>,
  pub kinovi_character_id_map: &'a Option<HashMap<CharacterToken, String>>,
}

// ── DistilledVideoRequest (used by tests) ──

pub struct DistilledVideoRequest {
  pub(crate) request: GenerateVideoRequestBuilder,
  pub cost: VideoGenerationCostEstimate,
  pub plan: VideoGenerationPlan,
  pub execution_provider: Provider,
}

impl DistilledVideoRequest {
  pub fn plan(&self) -> &VideoGenerationPlan {
    &self.plan
  }

  #[allow(dead_code)]
  pub(crate) fn request(&self) -> &GenerateVideoRequestBuilder {
    &self.request
  }
}

// ── Pipeline entrypoint ──

pub async fn run_pipeline_v1(args: RunPipelineV1Args<'_>) -> Result<PipelineResult, AdvancedCommonWebError> {
  let RunPipelineV1Args {
    request,
    server_state,
    mysql_connection,
    user_token,
    media_file_hydration_map,
    kinovi_character_id_map,
  } = args;

  // v1 execute_generation expects a flat Vec<String> of kinovi IDs
  let kinovi_character_ids: Option<Vec<String>> = kinovi_character_id_map
    .as_ref()
    .map(|map| map.values().cloned().collect());

  let execution_provider = match request.model {
    Some(CommonVideoModel::Seedance2p0) => Provider::Seedance2Pro,
    Some(CommonVideoModel::Seedance2p0Fast) => Provider::Seedance2Pro,
    _ => Provider::Fal,
  };

  // ── Distill: cost estimate (Artcraft provider — what we bill on) ──

  let initial = hydrate_to_router_request(request)?;

  let cost: VideoGenerationCostEstimate = {
    let cost_request = GenerateVideoRequestBuilder {
      provider: Provider::Artcraft,
      ..initial.clone()
    };
    let cost_plan = cost_request.build().map_err(|e| {
      warn!("Failed to build cost plan during video distillation: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?;
    cost_plan.estimate_costs()
  };

  // ── Distill: resolve media tokens to URLs for the execution request ──

  let hydration_map = media_file_hydration_map.as_ref();

  let start_frame_url = resolve_single_media_token(
    request.start_frame_image_media_token.as_ref(), hydration_map,
  )?;
  let end_frame_url = resolve_single_media_token(
    request.end_frame_image_media_token.as_ref(), hydration_map,
  )?;
  let reference_image_urls = resolve_media_token_list(
    request.reference_image_media_tokens.as_ref(), hydration_map,
  )?;
  let reference_video_urls = resolve_media_token_list(
    request.reference_video_media_tokens.as_ref(), hydration_map,
  )?;
  let reference_audio_urls = resolve_media_token_list(
    request.reference_audio_media_tokens.as_ref(), hydration_map,
  )?;

  // ── Distill: build the execution request with resolved URLs ──

  let exec_request = GenerateVideoRequestBuilder {
    model: initial.model,
    provider: execution_provider,
    prompt: initial.prompt,
    negative_prompt: initial.negative_prompt,
    start_frame: start_frame_url.map(ImageRef::Url),
    end_frame: end_frame_url.map(ImageRef::Url),
    reference_images: reference_image_urls.map(ImageListRef::Urls),
    reference_videos: reference_video_urls.map(VideoListRef::Urls),
    reference_audio: reference_audio_urls.map(AudioListRef::Urls),
    reference_character_tokens: None,
    resolution: initial.resolution,
    aspect_ratio: initial.aspect_ratio,
    duration_seconds: initial.duration_seconds,
    video_batch_count: initial.video_batch_count,
    generate_audio: initial.generate_audio,
    request_mismatch_mitigation_strategy: initial.request_mismatch_mitigation_strategy,
    idempotency_token: initial.idempotency_token,
  };

  let plan = exec_request.build().map_err(|e| {
    warn!("Failed to build video generation plan during distillation: {}", e);
    AdvancedCommonWebError::from_error(e)
  })?;

  info!("v1 distilled plan: {:?}", plan);

  // ── Bill wallet ──

  let cost_in_credits = cost.cost_in_credits.unwrap_or(0);
  let billing = bill_wallet(user_token, cost_in_credits, mysql_connection).await?;

  // ── Execute generation via the appropriate provider ──

  let gen_result = match execution_provider {
    Provider::Seedance2Pro => {
      execute_generation_kinovi(
        request, server_state,
        media_file_hydration_map.as_ref(), kinovi_character_ids,
        billing.maybe_wallet_ledger_entry_token.as_ref(), mysql_connection,
      ).await?
    }
    _ => {
      execute_generation_fal(&plan, request, server_state).await?
    }
  };

  // ── Map GenerationResult → GenerateVideoResponse for the shared suffix ──

  let response = if gen_result.is_seedance2pro {
    GenerateVideoResponse::Seedance2Pro(
      artcraft_router::generate::generate_video::generate_video_response::Seedance2proVideoResponsePayload {
        order_id: gen_result.external_job_id,
        task_id: String::new(),
      }
    )
  } else {
    GenerateVideoResponse::Fal(
      artcraft_router::generate::generate_video::generate_video_response::FalVideoResponsePayload {
        request_id: Some(gen_result.external_job_id),
        gateway_request_id: None,
      }
    )
  };

  Ok(PipelineResult { billing, response })
}

// ── Distillation (kept public for tests) ──

pub fn distill_video_request(
  request: &OmniGenVideoCostAndGenerateRequest,
  media_file_hydration_map: Option<&HashMap<MediaFileToken, Url>>,
  execution_provider: Provider,
) -> Result<DistilledVideoRequest, AdvancedCommonWebError> {
  let initial = hydrate_to_router_request(request)?;

  // Cost estimate (Artcraft provider — what we bill on).
  let cost: VideoGenerationCostEstimate = {
    let cost_request = GenerateVideoRequestBuilder {
      provider: Provider::Artcraft,
      ..initial.clone()
    };
    let cost_plan = cost_request.build().map_err(|e| {
      warn!("Failed to build cost plan during video distillation: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?;
    cost_plan.estimate_costs()
  };

  // Resolve media tokens to URLs for the execution request.
  let start_frame_url = resolve_single_media_token(
    request.start_frame_image_media_token.as_ref(), media_file_hydration_map,
  )?;
  let end_frame_url = resolve_single_media_token(
    request.end_frame_image_media_token.as_ref(), media_file_hydration_map,
  )?;
  let reference_image_urls = resolve_media_token_list(
    request.reference_image_media_tokens.as_ref(), media_file_hydration_map,
  )?;
  let reference_video_urls = resolve_media_token_list(
    request.reference_video_media_tokens.as_ref(), media_file_hydration_map,
  )?;
  let reference_audio_urls = resolve_media_token_list(
    request.reference_audio_media_tokens.as_ref(), media_file_hydration_map,
  )?;

  // Build the execution request with resolved URLs.
  let exec_request = GenerateVideoRequestBuilder {
    model: initial.model,
    provider: execution_provider,
    prompt: initial.prompt,
    negative_prompt: initial.negative_prompt,
    start_frame: start_frame_url.map(ImageRef::Url),
    end_frame: end_frame_url.map(ImageRef::Url),
    reference_images: reference_image_urls.map(ImageListRef::Urls),
    reference_videos: reference_video_urls.map(VideoListRef::Urls),
    reference_audio: reference_audio_urls.map(AudioListRef::Urls),
    reference_character_tokens: None,
    resolution: initial.resolution,
    aspect_ratio: initial.aspect_ratio,
    duration_seconds: initial.duration_seconds,
    video_batch_count: initial.video_batch_count,
    generate_audio: initial.generate_audio,
    request_mismatch_mitigation_strategy: initial.request_mismatch_mitigation_strategy,
    idempotency_token: initial.idempotency_token,
  };

  let plan = exec_request.build().map_err(|e| {
    warn!("Failed to build video generation plan during distillation: {}", e);
    AdvancedCommonWebError::from_error(e)
  })?;

  Ok(DistilledVideoRequest {
    request: exec_request,
    cost,
    plan,
    execution_provider,
  })
}

// ── Token resolution helpers ──

fn resolve_single_media_token(
  token: Option<&MediaFileToken>,
  hydration_map: Option<&HashMap<MediaFileToken, Url>>,
) -> Result<Option<String>, AdvancedCommonWebError> {
  let token = match token {
    Some(t) => t,
    None => return Ok(None),
  };

  let map = hydration_map.ok_or_else(|| {
    AdvancedCommonWebError::BadInputWithSimpleMessage(
      "media token supplied but no hydration map was provided".to_string(),
    )
  })?;

  match map.get(token) {
    Some(url) => Ok(Some(url.to_string())),
    None => Err(AdvancedCommonWebError::BadInputWithSimpleMessage(format!(
      "Media token not found in hydration map: {:?}", token
    ))),
  }
}

fn resolve_media_token_list(
  tokens: Option<&Vec<MediaFileToken>>,
  hydration_map: Option<&HashMap<MediaFileToken, Url>>,
) -> Result<Option<Vec<String>>, AdvancedCommonWebError> {
  let tokens = match tokens {
    Some(tokens) if !tokens.is_empty() => tokens,
    _ => return Ok(None),
  };

  let map = hydration_map.ok_or_else(|| {
    AdvancedCommonWebError::BadInputWithSimpleMessage(
      "media tokens supplied but no hydration map was provided".to_string(),
    )
  })?;

  let mut urls: Vec<String> = Vec::with_capacity(tokens.len());
  for token in tokens {
    match map.get(token) {
      Some(url) => urls.push(url.to_string()),
      None => {
        return Err(AdvancedCommonWebError::BadInputWithSimpleMessage(format!(
          "Media token not found in hydration map: {:?}", token
        )));
      }
    }
  }

  Ok(Some(urls))
}
