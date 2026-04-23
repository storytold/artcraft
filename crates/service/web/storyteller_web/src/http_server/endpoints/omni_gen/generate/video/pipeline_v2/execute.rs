//! Pipeline v2 execution: build2 → (optional finalize) → send_request.
//!
//! For Kinovi providers, the build2 output is a Draft that needs finalization
//! (media upload to Kinovi CDN). For Artcraft providers, build2 returns a
//! Request directly — no finalization needed.

use std::collections::HashMap;

use log::{error, info, warn};

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
use crate::state::server_state::ServerState;

/// Execute the v2 pipeline: finalize the draft (if needed), then send the request.
///
/// If the generation fails and is a Kinovi request with a wallet ledger entry,
/// the wallet is refunded.
pub async fn execute_pipeline_v2(
  draft_or_request: VideoGenerationDraftOrRequest,
  server_state: &ServerState,
  media_file_urls_by_token: Option<&HashMap<MediaFileToken, String>>,
  kinovi_character_ids: Option<&HashMap<CharacterToken, String>>,
  maybe_wallet_ledger_entry_token: Option<&WalletLedgerEntryToken>,
  mysql_connection: &mut sqlx::pool::PoolConnection<sqlx::MySql>,
) -> Result<GenerateVideoResponse, AdvancedCommonWebError> {
  // 1. Finalize draft → request (or use the request directly).
  let (video_request, is_kinovi) = finalize_to_request(
    draft_or_request,
    server_state,
    media_file_urls_by_token,
    kinovi_character_ids,
  ).await?;

  // 2. Build the client for send_request.
  let client = build_kinovi_client(server_state);

  // 3. Send the request.
  let result = video_request.send_request(&client).await;

  // 4. On failure, refund wallet if this is a Kinovi request.
  if let Err(ref err) = result {
    if is_kinovi {
      if let Some(ledger_entry_token) = maybe_wallet_ledger_entry_token {
        warn!("Kinovi v2 generation failed, issuing refund for {}: {:?}", ledger_entry_token.as_str(), err);
        if let Err(refund_err) = refund_wallet_after_api_failure(ledger_entry_token, mysql_connection).await {
          error!("Failed to refund wallet after Kinovi v2 failure: {:?}", refund_err);
        }
      }
    }
  }

  let response = result.map_err(|err| {
    warn!("v2 video generation failed: {:?}", err);
    AdvancedCommonWebError::from_error(err)
  })?;

  info!("v2 generation response: {:?}", response);

  Ok(response)
}

/// Finalize the draft (uploading media to Kinovi if needed) and return the request + is_kinovi flag.
async fn finalize_to_request(
  draft_or_request: VideoGenerationDraftOrRequest,
  server_state: &ServerState,
  media_file_urls_by_token: Option<&HashMap<MediaFileToken, String>>,
  kinovi_character_ids: Option<&HashMap<CharacterToken, String>>,
) -> Result<(VideoGenerationRequest, bool), AdvancedCommonWebError> {
  match draft_or_request {
    VideoGenerationDraftOrRequest::Request(request) => {
      let is_kinovi = matches!(
        request,
        VideoGenerationRequest::KinoviSeedance2p0(_) | VideoGenerationRequest::KinoviSeedance2p0Fast(_)
      );
      Ok((request, is_kinovi))
    }
    VideoGenerationDraftOrRequest::Draft(draft) => {
      let seedance2pro_session = Seedance2ProSession::from_cookies_string(
        server_state.seedance2pro.cookies.clone()
      );
      let seedance2pro_client = RouterSeedance2ProClient::new(seedance2pro_session);
      let router_client = RouterClient::Seedance2Pro(seedance2pro_client);

      let draft_context = VideoGenerationDraftContext {
        client: Some(&router_client),
        media_file_to_artcraft_url_map: media_file_urls_by_token,
        character_token_to_kinovi_id_map: kinovi_character_ids,
      };

      let request = draft.finalize(draft_context).await.map_err(|err| {
        warn!("Failed to finalize v2 draft: {:?}", err);
        AdvancedCommonWebError::from_error(err)
      })?;

      // Drafts are always Kinovi (Artcraft never produces drafts).
      Ok((request, true))
    }
  }
}

fn build_kinovi_client(server_state: &ServerState) -> RouterClient {
  let session = Seedance2ProSession::from_cookies_string(
    server_state.seedance2pro.cookies.clone()
  );
  RouterClient::Seedance2Pro(RouterSeedance2ProClient::new(session))
}
