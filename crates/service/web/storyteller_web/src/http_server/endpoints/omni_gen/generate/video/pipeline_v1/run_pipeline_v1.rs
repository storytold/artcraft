use std::collections::HashMap;

use log::info;
use url::Url;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;
use enums::common::generation::common_video_model::CommonVideoModel;
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::bill_wallet::bill_wallet;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_result::PipelineResult;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v1::distill_video_request::distill_video_request;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v1::execute::execute_fal::execute_generation_fal;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v1::execute::execute_kinovi::execute_generation_kinovi;
use crate::state::server_state::ServerState;

pub struct RunPipelineV1Args<'a> {
  pub request: &'a OmniGenVideoCostAndGenerateRequest,
  pub server_state: &'a ServerState,
  pub mysql_connection: &'a mut sqlx::pool::PoolConnection<sqlx::MySql>,
  pub user_token: &'a UserToken,
  pub media_file_hydration_map: &'a Option<HashMap<MediaFileToken, Url>>,
  pub kinovi_character_id_map: &'a Option<HashMap<CharacterToken, String>>,
}

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

  let distilled = distill_video_request(request, media_file_hydration_map.as_ref(), execution_provider)?;
  info!("v1 distilled plan: {:?}", distilled.plan);

  let cost = distilled.cost.cost_in_credits.unwrap_or(0);
  let billing = bill_wallet(user_token, cost, mysql_connection).await?;

  // Execute generation via the appropriate provider.
  let gen_result = match distilled.execution_provider {
    Provider::Seedance2Pro => {
      execute_generation_kinovi(
        &distilled, request, server_state,
        media_file_hydration_map.as_ref(), kinovi_character_ids,
        billing.maybe_wallet_ledger_entry_token.as_ref(), mysql_connection,
      ).await?
    }
    _ => {
      execute_generation_fal(&distilled, request, server_state).await?
    }
  };

  // Map v1 GenerationResult → GenerateVideoResponse for the shared suffix
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
