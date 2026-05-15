use log::{info, warn};

use artcraft_router::client::router_client::RouterClient;
use artcraft_router::client::router_fal_client::RouterFalClient;
use artcraft_router::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::users::UserToken;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::omni_gen::generate::image::pipeline_result::ImagePipelineResult;
use crate::http_server::endpoints::omni_gen::generate::image::pipeline_v1::distill_image_request::distill_image_request;
use crate::http_server::endpoints::omni_gen::generate::image::resolve_media_tokens::ResolvedImageMedia;
use crate::state::server_state::ServerState;

pub struct RunPipelineV1Args<'a> {
  pub router_builder: &'a GenerateImageRequestBuilder,
  pub server_state: &'a ServerState,
  pub mysql_connection: &'a mut sqlx::pool::PoolConnection<sqlx::MySql>,
  pub user_token: &'a UserToken,
  pub resolved_media: &'a ResolvedImageMedia,
}

pub async fn run_pipeline_v1(
  args: RunPipelineV1Args<'_>,
) -> Result<ImagePipelineResult, AdvancedCommonWebError> {
  let RunPipelineV1Args {
    router_builder,
    server_state,
    mysql_connection,
    user_token,
    resolved_media,
  } = args;

  let distilled = distill_image_request(
    router_builder,
    Some(resolved_media),
  )?;

  let cost = distilled.cost.cost_in_credits.unwrap_or(0);

  info!("Charging wallet: {} credits", cost);

  let apriori_job_token = InferenceJobToken::generate();

  if cost > 0 {
    attempt_wallet_deduction_else_common_web_error(
      user_token,
      Some(apriori_job_token.as_str()),
      cost,
      mysql_connection,
    ).await?;
  }

  let fal_client = RouterFalClient::new(
    server_state.fal.api_key.clone(),
    server_state.fal.webhook_url.clone(),
  );

  let router_client = RouterClient::Fal(fal_client);

  let response = distilled.plan().generate_image(&router_client)
    .await
    .map_err(|e| {
      warn!("Image generation failed: {:?}", e);
      AdvancedCommonWebError::from_error(e)
    })?;

  Ok(ImagePipelineResult {
    apriori_job_token,
    response,
  })
}
