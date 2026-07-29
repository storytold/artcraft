use std::collections::HashMap;
use std::convert::TryFrom;

use log::{error, info, warn};

use artcraft_router::api::router_provider::RouterProvider;
use artcraft_router::api::router_splat_model::RouterSplatModel;
use artcraft_router::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;
use artcraft_router::generate::generate_splat::generate_splat_response::GenerateSplatResponse;
use artcraft_router::generate::generate_splat::splat_generation_draft_context::SplatGenerationDraftContext;
use artcraft_router::generate::generate_splat::splat_generation_draft_or_request::SplatGenerationDraftOrRequest;
use mysql_queries::queries::generic_inference::common::job_cost_estimates::JobCostEstimates;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoint_helpers::refund_wallet_after_api_failure::refund_wallet_after_api_failure;
use crate::http_server::endpoints::generate::common::generation_debug_logs::{
  insert_provider_request_debug_log, provider_request_debug_log_type, GenerationDebugLogContext,
};
use crate::http_server::endpoints::omni_gen::generate::splat::helpers::pipeline_result::PipelineResult;
use crate::http_server::endpoints::omni_gen::generate::splat::helpers::resolve_media_tokens_to_urls::resolve_media_tokens_to_urls;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::bill_wallet::bill_wallet;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::build_router_client::build_router_client;
use crate::http_server::endpoints::omni_gen::generate::video::kinovi_account::KinoviAccount;
use crate::http_server::endpoints::omni_gen::shared_utils::splat::map_worldlabs_router_error::map_worldlabs_router_error;
use crate::state::server_state::ServerState;

pub struct RunPipelineV2Args<'a> {
  pub router_builder: &'a GenerateSplatRequestBuilder,
  pub server_state: &'a ServerState,
  pub user_token: &'a UserToken,
  pub media_file_to_url_map: &'a Option<HashMap<MediaFileToken, String>>,
  pub debug_log_context: &'a GenerationDebugLogContext<'a>,
  /// The handler's open connection. The pipeline uses it for its remaining
  /// pre-request DB writes (billing, outbound-request debug log) and releases
  /// it BEFORE the external provider call.
  pub mysql_connection: sqlx::pool::PoolConnection<sqlx::MySql>,
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
    debug_log_context,
    mut mysql_connection,
  } = args;

  let router_builder = router_builder.clone();

  // Marble models are fulfilled through World Labs; TripoSplat through Fal.
  let provider = match router_builder.model {
    RouterSplatModel::TripoSplat => RouterProvider::Fal,
    _ => RouterProvider::WorldLabs,
  };

  // 1. Build execution request.
  //    World Labs media inputs stay token-typed here — requests with media
  //    return a Draft whose finalize step maps tokens to Artcraft URLs via
  //    the draft context (mirroring the audio pipeline's Kinovi drafts).
  //    Fal takes media URLs directly, so its tokens resolve before building.
  let mut exec_builder = router_builder.clone();
  exec_builder.provider = provider;

  if matches!(provider, RouterProvider::Fal) {
    resolve_media_tokens_to_urls(&mut exec_builder, media_file_to_url_map.as_ref());
  }

  let draft_or_request = exec_builder.build2()
      .map_err(|e| {
        warn!("Failed to build2 for splat v2 pipeline: {}", e);
        CommonWebError::from_error(e)
      })?;

  // 2. Calculate cost.
  //    Swap provider to Artcraft so credits = cents.
  let system_cost_estimate = {
    let mut cost_builder = router_builder.clone();
    cost_builder.provider = RouterProvider::Artcraft;

    cost_builder.build2()
      .map_err(|e| {
        warn!("Failed to build2 splat cost estimate for v2: {}", e);
        CommonWebError::from_error(e)
      })?
      .estimate_cost()
      .map_err(|e| {
        warn!("Failed to estimate splat cost for v2: {}", e);
        CommonWebError::from_error(e)
      })?
  };

  let cost = system_cost_estimate.cost_in_credits.unwrap_or(0);

  // Provider-side estimate (what the fulfilling provider charges us).
  // Bookkeeping only — failures must not block generation.
  let maybe_provider_cost_estimate = match draft_or_request.estimate_cost() {
    Ok(estimate) => Some(estimate),
    Err(err) => {
      warn!("Failed to estimate provider cost for v2 splat: {}", err);
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

  info!("v2 splat estimated cost: {} credits (estimates: {:?})", cost, cost_estimates);

  // 3. Bill wallet on the handler's connection (same pre-request DB phase).
  let billing = bill_wallet(user_token, cost, &mut mysql_connection).await?;

  // Debug-log the outbound provider request BEFORE the send — still on the
  // handler's connection — so the payload is captured even when the
  // upload/enqueue fails.
  if let Some(debug_log_type) = provider_request_debug_log_type(provider) {
    insert_provider_request_debug_log(
      debug_log_context,
      debug_log_type,
      &format!("{:#?}", draft_or_request),
      &mut *mysql_connection,
    ).await;
  }

  // NB: Done with pre-request DB writes. Release the pooled connection before
  // the (slow, external) provider call — holding it across that call is what
  // starves the pool and causes PoolTimedOut. Post-send writes re-acquire.
  drop(mysql_connection);

  // 4. Finalize the draft (if any) and generate the splat.
  //    NB: No pooled DB connection is held across this call.
  let result = upload_and_generate(
    draft_or_request,
    server_state,
    media_file_to_url_map.as_ref(),
  ).await;

  // 5. On failure, refund the wallet (mirroring the legacy marble splat
  //    handlers). The job row is never inserted when the send fails, so
  //    nothing downstream would ever refund it.
  if let Err(ref err) = result {
    if let Some(ledger_entry_token) = billing.maybe_wallet_ledger_entry_token.as_ref() {
      warn!("v2 splat generation failed, issuing refund for {}: {:?}", ledger_entry_token.as_str(), err);

      match server_state.mysql_pool.acquire().await {
        Ok(mut refund_connection) => {
          if let Err(refund_err) = refund_wallet_after_api_failure(ledger_entry_token, &mut refund_connection).await {
            error!("Failed to refund wallet after v2 splat failure: {:?}", refund_err);
          }
        }
        Err(acquire_err) => {
          error!("Failed to acquire MySQL connection to refund wallet after v2 splat failure: {:?}", acquire_err);
        }
      }
    }
  }

  let response = result?;

  info!("v2 splat generation response: {:?}", response);

  Ok(PipelineResult { billing, response, cost_estimates })
}

/// Finalize the draft (resolving media tokens to URLs), then send the
/// generation request.
///
/// This is the block that gets refunded on failure.
async fn upload_and_generate(
  draft_or_request: SplatGenerationDraftOrRequest,
  server_state: &ServerState,
  media_file_urls_by_token: Option<&HashMap<MediaFileToken, String>>,
) -> Result<GenerateSplatResponse, CommonWebError> {

  let provider = draft_or_request.get_provider();
  // Kinovi is not a splat provider; the account argument is inert for World Labs.
  let client = build_router_client(provider, server_state, KinoviAccount::Volcengine)?;

  let splat_request = match draft_or_request {
    SplatGenerationDraftOrRequest::Request(request) => request,
    SplatGenerationDraftOrRequest::Draft(draft) => {
      let draft_context = SplatGenerationDraftContext {
        client: Some(&client),
        media_file_to_artcraft_url_map: media_file_urls_by_token,
      };

      draft.finalize(draft_context)
          .await
          .map_err(|err| {
            warn!("Failed to finalize v2 splat draft: {:?}", err);
            map_worldlabs_router_error(err)
          })?
    }
  };

  splat_request.send_request(&client)
      .await
      .map_err(|err| {
        warn!("v2 splat generation failed: {:?}", err);
        map_worldlabs_router_error(err)
      })
}
