use log::{info, warn};

use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::client::router_fal_client::RouterFalClient;
use artcraft_router::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use artcraft_router::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::users::UserToken;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_gen::generate::image::pipeline_result::ImagePipelineResult;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_media_files_as_cdn_url_list_and_map::MediaFilesAsCdnUrlListAndMap;

pub struct RunPipelineV1Args<'a> {
  pub router_builder: &'a GenerateImageRequestBuilder,
  pub server_state: &'a ServerState,
  pub mysql_connection: &'a mut sqlx::pool::PoolConnection<sqlx::MySql>,
  pub user_token: &'a UserToken,
  pub resolved_media: &'a MediaFilesAsCdnUrlListAndMap,
}

pub async fn run_pipeline_v1(
  args: RunPipelineV1Args<'_>,
) -> Result<ImagePipelineResult, CommonWebError> {
  let RunPipelineV1Args {
    router_builder,
    server_state,
    mysql_connection,
    user_token,
    resolved_media,
  } = args;

  let hydrated_builder = apply_hydrated_media_inputs(
    router_builder,
    resolved_media,
  );

  let cost = estimate_cost_in_credits(&router_builder)?;

  let execution_plan = build_execution_plan(&hydrated_builder)?;

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

  let response = execution_plan.generate_image(&router_client)
    .await
    .map_err(|e| {
      warn!("Image generation failed: {:?}", e);
      CommonWebError::from_error(e)
    })?;

  Ok(ImagePipelineResult {
    apriori_job_token,
    response,
  })
}

fn apply_hydrated_media_inputs(
  router_builder: &GenerateImageRequestBuilder,
  resolved_media: &MediaFilesAsCdnUrlListAndMap,
) -> GenerateImageRequestBuilder {
  let mut hydrated_builder = router_builder.clone();

  match hydrated_builder.image_inputs.as_ref() {
    Some(ImageListRef::MediaFileTokens(tokens)) if !tokens.is_empty() => {
      hydrated_builder.image_inputs = Some(ImageListRef::Urls(
        resolved_media.ordered_url_list.clone(),
      ));
    },
    _ => {},
  }

  hydrated_builder
}

fn estimate_cost_in_credits(
  router_builder: &GenerateImageRequestBuilder,
) -> Result<u64, CommonWebError> {
  let mut cost_builder = router_builder.clone();
  cost_builder.provider = Provider::Artcraft;

  let cost_plan = cost_builder.build().map_err(|e| {
    warn!("Failed to build image cost plan for v1 pipeline: {}", e);
    CommonWebError::from_error(e)
  })?;

  Ok(cost_plan.estimate_costs().cost_in_credits.unwrap_or(0))
}

fn build_execution_plan(
  router_builder: &GenerateImageRequestBuilder,
) -> Result<ImageGenerationPlan, CommonWebError> {
  let mut execution_builder = router_builder.clone();
  execution_builder.provider = Provider::Fal;

  execution_builder.build().map_err(|e| {
    warn!("Failed to build image generation plan for v1 pipeline: {}", e);
    CommonWebError::from_error(e)
  })
}
