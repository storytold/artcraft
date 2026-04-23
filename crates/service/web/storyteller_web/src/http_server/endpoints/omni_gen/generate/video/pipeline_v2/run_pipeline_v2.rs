use std::collections::HashMap;

use log::{info, warn};
use url::Url;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::bill_wallet::bill_wallet;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_result::PipelineResult;
use crate::http_server::endpoints::omni_gen::generate::video::hydrate_router_request::hydrate_to_router_request;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v2::execute::execute_pipeline_v2;
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

  let kinovi_character_id_map = resolve_kinovi_character_ids(
    request.reference_character_tokens.as_deref(),
    mysql_connection,
  ).await?;

  // 5. Execute: finalize draft → send
  let response = execute_pipeline_v2(
    draft_or_request, server_state,
    media_file_urls_as_strings.as_ref(), kinovi_character_id_map.as_ref(),
    billing.maybe_wallet_ledger_entry_token.as_ref(), mysql_connection,
  ).await?;

  Ok(PipelineResult { billing, response })
}
