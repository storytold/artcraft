use std::convert::TryFrom;

use std::collections::HashMap;

use log::{error, info, warn};
use artcraft_router::api::router_video_model::RouterVideoModel;
use artcraft_router::api::router_provider::RouterProvider;
use artcraft_router::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;
use artcraft_router::generate::generate_video::video_generation_draft_context::VideoGenerationDraftContext;
use artcraft_router::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoint_helpers::refund_wallet_after_api_failure::refund_wallet_after_api_failure;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::bill_wallet::bill_wallet;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::build_router_client::build_router_client;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::pipeline_result::PipelineResult;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::resolve_media_tokens_to_urls::resolve_media_tokens_to_urls;
use mysql_queries::queries::generic_inference::common::job_cost_estimates::JobCostEstimates;
use crate::http_server::endpoints::omni_gen::generate::video::kinovi_account::KinoviAccount;
use crate::http_server::endpoints::omni_gen::shared_utils::map_seedance2pro_router_error::map_router_error_to_web_error;
use crate::state::server_state::ServerState;

pub struct RunPipelineV2Args<'a> {
  pub router_builder: &'a GenerateVideoRequestBuilder,
  pub server_state: &'a ServerState,
  pub user_token: &'a UserToken,
  pub media_file_to_url_map: &'a Option<HashMap<MediaFileToken, String>>,
  pub kinovi_character_id_map: &'a Option<HashMap<CharacterToken, String>>,
  pub kinovi_account: KinoviAccount,
}

// NB: This pipeline does an external generation call (`upload_and_generate`) that can take many
// seconds. It deliberately does NOT hold a pooled DB connection across that call — it acquires
// short-lived connections only for the billing and (on failure) refund writes. Holding a pooled
// connection across the external call is what starves the pool and causes `PoolTimedOut`.
pub async fn run_pipeline_v2(args: RunPipelineV2Args<'_>) -> Result<PipelineResult, CommonWebError> {
  let RunPipelineV2Args {
    router_builder,
    server_state,
    user_token,
    media_file_to_url_map,
    kinovi_character_id_map,
    kinovi_account,
  } = args;

  let mut router_builder = router_builder.clone();

  match router_builder.model {
    RouterVideoModel::PreviewModel |
    RouterVideoModel::Seedance2p0BytePlus |
    RouterVideoModel::Seedance2p0BytePlusUltra => {
      router_builder.model = RouterVideoModel::Seedance2p0;
    },
    RouterVideoModel::PreviewModelFast |
    RouterVideoModel::Seedance2p0BytePlusFast | 
    RouterVideoModel::Seedance2p0BytePlusUltraFast => {
      router_builder.model = RouterVideoModel::Seedance2p0Fast;
    },
    _ => {}, // Fall-through
  }

  let provider = match router_builder.model {
    RouterVideoModel::HappyHorse1p0 => RouterProvider::Seedance2Pro,
    RouterVideoModel::Seedance2p0 => RouterProvider::Seedance2Pro,
    RouterVideoModel::Seedance2p0Fast => RouterProvider::Seedance2Pro,
    RouterVideoModel::Seedance2p0Mini => RouterProvider::Seedance2Pro,
    RouterVideoModel::Seedance2p0BytePlusMini => RouterProvider::Seedance2Pro,
    RouterVideoModel::Seedance2p0BytePlusUltraMini => RouterProvider::Seedance2Pro,
    //RouterVideoModel::Seedance2p0Ultra => RouterProvider::GmiCloud,
    //RouterVideoModel::Seedance2p0UltraFast => RouterProvider::GmiCloud,
    RouterVideoModel::GrokImagineVideo => RouterProvider::GrokApi,
    RouterVideoModel::GrokImagineVideo1p5 => RouterProvider::GrokApi,
    _ => RouterProvider::Fal,
  };

  // 1. Build execution request
  let mut exec_builder = router_builder.clone();
  exec_builder.provider = provider;

  // Fal, GmiCloud, and Grok (xAI) take image URLs directly, not media file tokens.
  // Resolve tokens to URLs before building.
  if matches!(provider, RouterProvider::Fal | RouterProvider::GmiCloud | RouterProvider::GrokApi) {
    resolve_media_tokens_to_urls(&mut exec_builder, media_file_to_url_map.as_ref());
  }

  let draft_or_request = exec_builder.build2()
      .map_err(|e| {
        warn!("Failed to build2 for v2 pipeline: {}", e);
        CommonWebError::from_error(e)
      })?;

  // 2. Calculate cost.
  //    For Artcraft-billable models, swap provider to Artcraft so credits = cents.
  //    For GmiCloud, use the execution request's cost directly (no Artcraft equivalent).
  let system_cost_estimate = {
    let mut cost_builder = router_builder.clone();
    cost_builder.provider = RouterProvider::Artcraft;

    cost_builder.build2()
      .map_err(|e| {
        warn!("Failed to build2 cost estimate for v2: {}", e);
        CommonWebError::from_error(e)
      })?
      .estimate_cost()
      .map_err(|e| {
        warn!("Failed to estimate cost for v2: {}", e);
        CommonWebError::from_error(e)
      })?
  };

  let cost = system_cost_estimate.cost_in_credits.unwrap_or(0);

  // Provider-side estimate (what the fulfilling provider charges us). The
  // router defers to the underlying provider crates (seedance2pro_client,
  // gmicloud_client, grok_api_client, the fal pricing modules, etc.) per
  // request variant. Bookkeeping only — failures must not block generation.
  let maybe_provider_cost_estimate = match draft_or_request.estimate_cost() {
    Ok(estimate) => Some(estimate),
    Err(err) => {
      warn!("Failed to estimate provider cost for v2 video: {}", err);
      None
    }
  };

  let cost_estimates = JobCostEstimates {
    maybe_external_third_party_cost_credits: maybe_provider_cost_estimate.as_ref()
      .and_then(|e| e.cost_in_credits)
      .and_then(|v| u32::try_from(v).ok()),
    maybe_external_third_party_cost_usd_cents: maybe_provider_cost_estimate.as_ref()
      .and_then(|e| e.cost_in_usd_cents)
      .and_then(|v| u32::try_from(v).ok()),
    maybe_system_cost_credits: system_cost_estimate.cost_in_credits
      .and_then(|v| u32::try_from(v).ok()),
    maybe_system_cost_usd_cents: system_cost_estimate.cost_in_usd_cents
      .and_then(|v| u32::try_from(v).ok()),
  };

  info!("v2 estimated cost: {} credits (estimates: {:?})", cost, cost_estimates);

  // 3. Bill wallet (short-lived connection — released before the external call below).
  let billing = {
    let mut billing_connection = server_state.mysql_pool.acquire().await
      .map_err(|err| {
        error!("Failed to acquire MySQL connection for billing: {:?}", err);
        CommonWebError::from_error(err)
      })?;
    bill_wallet(user_token, cost, &mut billing_connection).await?
  };

  // 4. Upload media (if draft) and generate video.
  //    The entire block is wrapped so Kinovi failures trigger a refund.
  //    NB: No pooled DB connection is held across this call.
  let result = upload_and_generate(
    draft_or_request,
    server_state,
    media_file_to_url_map.as_ref(),
    kinovi_character_id_map.as_ref(),
    kinovi_account,
  ).await;

  // 5. On failure, refund wallet for Kinovi requests.
  if let Err(ref err) = result {
    if matches!(provider, RouterProvider::Seedance2Pro) {
      if let Some(ledger_entry_token) = billing.maybe_wallet_ledger_entry_token.as_ref() {
        warn!("Kinovi v2 generation failed, issuing refund for {}: {:?}", ledger_entry_token.as_str(), err);

        match server_state.mysql_pool.acquire().await {
          Ok(mut refund_connection) => {
            if let Err(refund_err) = refund_wallet_after_api_failure(ledger_entry_token, &mut refund_connection).await {
              error!("Failed to refund wallet after Kinovi v2 failure: {:?}", refund_err);
            }
          }
          Err(acquire_err) => {
            error!("Failed to acquire MySQL connection to refund wallet after Kinovi v2 failure: {:?}", acquire_err);
          }
        }
      }
    }
  }

  let response = result?;

  info!("v2 generation response: {:?}", response);

  Ok(PipelineResult { billing, response, cost_estimates })
}

/// Finalize the draft (uploading media if needed), then send the generation request.
///
/// This is the block that gets refunded on failure for Kinovi providers.
async fn upload_and_generate(
  draft_or_request: VideoGenerationDraftOrRequest,
  server_state: &ServerState,
  media_file_urls_by_token: Option<&HashMap<MediaFileToken, String>>,
  kinovi_character_ids: Option<&HashMap<CharacterToken, String>>,
  kinovi_account: KinoviAccount,
) -> Result<GenerateVideoResponse, CommonWebError> {

  let provider = draft_or_request.get_provider();
  let client = build_router_client(provider, server_state, kinovi_account)?;

  let video_request = match draft_or_request {
    VideoGenerationDraftOrRequest::Request(request) => request,
    VideoGenerationDraftOrRequest::Draft(draft) => {
      let draft_context = VideoGenerationDraftContext {
        client: Some(&client),
        media_file_to_artcraft_url_map: media_file_urls_by_token,
        character_token_to_kinovi_id_map: kinovi_character_ids,
      };

      draft.finalize(draft_context)
          .await
          .map_err(|err| {
            warn!("Failed to finalize v2 draft: {:?}", err);
            map_router_error_to_web_error(err)
          })?
    }
  };

  video_request.send_request(&client)
      .await
      .map_err(|err| {
        warn!("v2 video generation failed: {:?}", err);
        map_router_error_to_web_error(err)
      })
}
