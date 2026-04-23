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
use enums::common::generation::common_video_model::CommonVideoModel;
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::bill_wallet::bill_wallet;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::pipeline_result::PipelineResult;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v1::execute::execute_fal::execute_generation_fal;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v1::execute::execute_kinovi::execute_generation_kinovi;
use crate::state::server_state::ServerState;

// ── Pipeline args ──

pub struct RunPipelineV1Args<'a> {
  pub request: &'a OmniGenVideoCostAndGenerateRequest,
  pub router_builder: &'a GenerateVideoRequestBuilder,
  pub server_state: &'a ServerState,
  pub mysql_connection: &'a mut sqlx::pool::PoolConnection<sqlx::MySql>,
  pub user_token: &'a UserToken,
  pub media_url_map: &'a Option<HashMap<MediaFileToken, Url>>,
  pub kinovi_character_id_map: &'a Option<HashMap<CharacterToken, String>>,
}

// ── Pipeline entrypoint ──

pub async fn run_pipeline_v1(args: RunPipelineV1Args<'_>) -> Result<PipelineResult, AdvancedCommonWebError> {
  let RunPipelineV1Args {
    request,
    router_builder,
    server_state,
    mysql_connection,
    user_token,
    media_url_map,
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

  // ── Cost estimate (Artcraft provider — what we bill on) ──

  let cost = {
    let cost_request = GenerateVideoRequestBuilder {
      provider: Provider::Artcraft,
      ..router_builder.clone()
    };
    let cost_plan = cost_request.build().map_err(|e| {
      warn!("Failed to build cost plan during video distillation: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?;
    cost_plan.estimate_costs()
  };

  // ── Resolve media tokens → URLs from handler map ──

  let empty_map = HashMap::new();
  let url_map = media_url_map.as_ref().unwrap_or(&empty_map);

  let start_frame = lookup_url(url_map, request.start_frame_image_media_token.as_ref()).map(ImageRef::Url);
  let end_frame = lookup_url(url_map, request.end_frame_image_media_token.as_ref()).map(ImageRef::Url);
  let reference_images = lookup_urls(url_map, request.reference_image_media_tokens.as_ref()).map(ImageListRef::Urls);
  let reference_videos = lookup_urls(url_map, request.reference_video_media_tokens.as_ref()).map(VideoListRef::Urls);
  let reference_audio = lookup_urls(url_map, request.reference_audio_media_tokens.as_ref()).map(AudioListRef::Urls);

  // ── Build the execution request ──

  let exec_request = GenerateVideoRequestBuilder {
    model: router_builder.model,
    provider: execution_provider,
    prompt: router_builder.prompt.clone(),
    negative_prompt: router_builder.negative_prompt.clone(),
    start_frame,
    end_frame,
    reference_images,
    reference_videos,
    reference_audio,
    reference_character_tokens: router_builder.reference_character_tokens.clone(),
    resolution: router_builder.resolution,
    aspect_ratio: router_builder.aspect_ratio,
    duration_seconds: router_builder.duration_seconds,
    video_batch_count: router_builder.video_batch_count,
    generate_audio: router_builder.generate_audio,
    request_mismatch_mitigation_strategy: router_builder.request_mismatch_mitigation_strategy,
    idempotency_token: router_builder.idempotency_token.clone(),
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

  let response = match execution_provider {
    Provider::Seedance2Pro => {
      execute_generation_kinovi(
        request, server_state,
        media_url_map.as_ref(), kinovi_character_ids,
        billing.maybe_wallet_ledger_entry_token.as_ref(), mysql_connection,
      ).await?
    }
    _ => {
      execute_generation_fal(&plan, server_state).await?
    }
  };

  Ok(PipelineResult { billing, response })
}

// ── Helpers ──

fn lookup_url(map: &HashMap<MediaFileToken, Url>, token: Option<&MediaFileToken>) -> Option<String> {
  token.and_then(|t| map.get(t)).map(|u| u.to_string())
}

fn lookup_urls(map: &HashMap<MediaFileToken, Url>, tokens: Option<&Vec<MediaFileToken>>) -> Option<Vec<String>> {
  tokens
    .filter(|v| !v.is_empty())
    .map(|tokens| tokens.iter().filter_map(|t| map.get(t).map(|u| u.to_string())).collect())
}
