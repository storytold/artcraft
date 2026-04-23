use std::collections::HashMap;

use log::{error, info, warn};
use url::Url;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_router::api::provider::Provider;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::client::router_seedance2pro_client::RouterSeedance2ProClient;
use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;
use artcraft_router::generate::generate_video_v2::video_generation_draft_context::VideoGenerationDraftContext;
use artcraft_router::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use artcraft_router::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;
use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoint_helpers::refund_wallet_after_api_failure::refund_wallet_after_api_failure;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::bill_wallet::bill_wallet;
use crate::http_server::endpoints::omni_gen::generate::video::hydrate_router_request::hydrate_to_router_request;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_result::PipelineResult;
use crate::http_server::endpoints::omni_gen::generate::video::request_helper::resolve_kinovi_character_ids::resolve_kinovi_character_ids;
use crate::state::server_state::ServerState;

pub async fn run_pipeline_v2(
  request: &OmniGenVideoCostAndGenerateRequest,
  server_state: &ServerState,
  mysql_connection: &mut sqlx::pool::PoolConnection<sqlx::MySql>,
  user_token: &tokens::tokens::users::UserToken,
  media_file_hydration_map: &Option<HashMap<MediaFileToken, Url>>,
) -> Result<PipelineResult, AdvancedCommonWebError> {
  // 1. Build execution request (provider = Seedance2Pro for Kinovi)
  let mut exec_builder = hydrate_to_router_request(request)?;
  exec_builder.provider = Provider::Seedance2Pro;

  let draft_or_request = exec_builder.build2().map_err(|e| {
    warn!("Failed to build2 for v2 pipeline: {}", e);
    AdvancedCommonWebError::from_error(e)
  })?;

  let provider = draft_or_request.get_provider();

  // 2. Calculate cost (swap provider to Artcraft for billing)
  let mut cost_builder = hydrate_to_router_request(request)?;
  cost_builder.provider = Provider::Artcraft;

  let cost = cost_builder.build2()
    .map_err(|e| {
      warn!("Failed to build2 cost estimate for v2: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?
    .estimate_cost()
    .map_err(|e| {
      warn!("Failed to estimate cost for v2: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?
    .cost_in_credits
    .unwrap_or(0);

  info!("v2 estimated cost: {} credits", cost);

  // 3. Bill wallet
  let billing = bill_wallet(user_token, cost, mysql_connection).await?;

  // 4. Build context maps for draft finalization
  let media_file_urls_as_strings: Option<HashMap<MediaFileToken, String>> =
    media_file_hydration_map.as_ref().map(|map| {
      map.iter().map(|(k, v)| (k.clone(), v.to_string())).collect()
    });

  let kinovi_character_id_map: Option<HashMap<CharacterToken, String>> =
    resolve_kinovi_character_ids(
      request.reference_character_tokens.as_deref(),
      mysql_connection,
    ).await?;

  // 5. Upload media (if draft) and generate video.
  //    The entire block is wrapped so Kinovi failures trigger a refund.
  let result = upload_and_generate(
    draft_or_request,
    server_state,
    media_file_urls_as_strings.as_ref(),
    kinovi_character_id_map.as_ref(),
  ).await;

  // 6. On failure, refund wallet for Kinovi requests.
  if let Err(ref err) = result {
    if matches!(provider, Provider::Seedance2Pro) {
      if let Some(ledger_entry_token) = billing.maybe_wallet_ledger_entry_token.as_ref() {
        warn!("Kinovi v2 generation failed, issuing refund for {}: {:?}", ledger_entry_token.as_str(), err);
        if let Err(refund_err) = refund_wallet_after_api_failure(ledger_entry_token, mysql_connection).await {
          error!("Failed to refund wallet after Kinovi v2 failure: {:?}", refund_err);
        }
      }
    }
  }

  let response = result?;
  info!("v2 generation response: {:?}", response);

  Ok(PipelineResult { billing, response })
}

/// Finalize the draft (uploading media if needed), then send the generation request.
///
/// This is the block that gets refunded on failure for Kinovi providers.
async fn upload_and_generate(
  draft_or_request: VideoGenerationDraftOrRequest,
  server_state: &ServerState,
  media_file_urls_by_token: Option<&HashMap<MediaFileToken, String>>,
  kinovi_character_ids: Option<&HashMap<CharacterToken, String>>,
) -> Result<GenerateVideoResponse, AdvancedCommonWebError> {
  let provider = draft_or_request.get_provider();
  let client = build_client(provider, server_state)?;

  let video_request = match draft_or_request {
    VideoGenerationDraftOrRequest::Request(request) => request,
    VideoGenerationDraftOrRequest::Draft(draft) => {
      let draft_context = VideoGenerationDraftContext {
        client: Some(&client),
        media_file_to_artcraft_url_map: media_file_urls_by_token,
        character_token_to_kinovi_id_map: kinovi_character_ids,
      };

      draft.finalize(draft_context).await.map_err(|err| {
        warn!("Failed to finalize v2 draft: {:?}", err);
        AdvancedCommonWebError::from_error(err)
      })?
    }
  };

  video_request.send_request(&client).await.map_err(|err| {
    warn!("v2 video generation failed: {:?}", err);
    AdvancedCommonWebError::from_error(err)
  })
}

fn build_client(provider: Provider, server_state: &ServerState) -> Result<RouterClient, AdvancedCommonWebError> {
  match provider {
    Provider::Seedance2Pro => {
      let session = Seedance2ProSession::from_cookies_string(
        server_state.seedance2pro.cookies.clone()
      );
      Ok(RouterClient::Seedance2Pro(RouterSeedance2ProClient::new(session)))
    }
    other => {
      Err(AdvancedCommonWebError::server_error_with_message(
        &format!("Unsupported provider for v2 pipeline: {:?}", other),
      ))
    }
  }
}
