use std::collections::HashMap;

use log::info;
use url::Url;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;
use enums::common::generation::common_video_model::CommonVideoModel;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::bill_wallet::bill_wallet;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_result::PipelineResult;
use crate::http_server::endpoints::omni_gen::generate::video::hydrate_router_request::hydrate_to_router_request;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v1::distill_video_request::distill_video_request;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v1::execute::execute_generation::execute_generation;
use crate::http_server::endpoints::omni_gen::generate::video::request_helper::resolve_kinovi_character_ids::resolve_kinovi_character_ids;
use crate::state::server_state::ServerState;

pub async fn run_pipeline_v1(
  request: &OmniGenVideoCostAndGenerateRequest,
  server_state: &ServerState,
  mysql_connection: &mut sqlx::pool::PoolConnection<sqlx::MySql>,
  user_token: &tokens::tokens::users::UserToken,
  media_file_hydration_map: &Option<HashMap<MediaFileToken, Url>>,
) -> Result<PipelineResult, AdvancedCommonWebError> {
  let kinovi_character_id_map = resolve_kinovi_character_ids(
    request.reference_character_tokens.as_deref(),
    mysql_connection,
  ).await?;

  // v1 execute_generation expects a flat Vec<String> of kinovi IDs
  let kinovi_character_ids: Option<Vec<String>> = kinovi_character_id_map
    .map(|map| map.into_values().collect());

  let execution_provider = match request.model {
    Some(CommonVideoModel::Seedance2p0) => Provider::Seedance2Pro,
    Some(CommonVideoModel::Seedance2p0Fast) => Provider::Seedance2Pro,
    _ => Provider::Fal,
  };

  let distilled = distill_video_request(request, media_file_hydration_map.as_ref(), execution_provider)?;
  info!("v1 distilled plan: {:?}", distilled.plan);

  let cost = distilled.cost.cost_in_credits.unwrap_or(0);
  let billing = bill_wallet(user_token, cost, mysql_connection).await?;

  let gen_result = execute_generation(
    &distilled, request, server_state, media_file_hydration_map.as_ref(),
    kinovi_character_ids, billing.maybe_wallet_ledger_entry_token.as_ref(), mysql_connection,
  ).await?;

  // Map v1 GenerationResult -> GenerateVideoResponse for the shared suffix
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
