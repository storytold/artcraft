use log::{info, warn};

use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::client::router_fal_client::RouterFalClient;
use artcraft_router::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use artcraft_router::generate::generate_image::generate_image_response::GenerateImageResponse;
use artcraft_router::generate::generate_image_v2::image_generation_draft_context::ImageGenerationDraftContext;
use artcraft_router::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use artcraft_router::generate::generate_image_v2::image_generation_request::ImageGenerationRequest;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::users::UserToken;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_gen::generate::image::pipeline_result::ImagePipelineResult;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_media_files_as_cdn_url_list_and_map::MediaFilesAsCdnUrlListAndMap;

pub struct RunPipelineV2Args<'a> {
  pub router_builder: &'a GenerateImageRequestBuilder,
  pub server_state: &'a ServerState,
  pub mysql_connection: &'a mut sqlx::pool::PoolConnection<sqlx::MySql>,
  pub user_token: &'a UserToken,
  pub resolved_media: &'a MediaFilesAsCdnUrlListAndMap,
}

pub async fn run_pipeline_v2(
  args: RunPipelineV2Args<'_>,
) -> Result<ImagePipelineResult, CommonWebError> {
  let RunPipelineV2Args {
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

  let draft_or_request = build_execution_request(&hydrated_builder)?;

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

  let response = finalize_and_generate(draft_or_request, server_state).await?;

  Ok(ImagePipelineResult {
    apriori_job_token,
    response,
  })
}

fn build_execution_request(
  router_builder: &GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, CommonWebError> {
  let mut execution_builder = router_builder.clone();
  execution_builder.provider = Provider::Fal;

  execution_builder.build2().map_err(|e| {
    warn!("Failed to build2 for image v2 pipeline: {}", e);
    CommonWebError::from_error(e)
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

  let request = cost_builder.build2().map_err(|e| {
    warn!("Failed to build image cost request: {}", e);
    CommonWebError::from_error(e)
  })?;

  let cost = request.estimate_cost().map_err(|e| {
    warn!("Failed to estimate image cost: {}", e);
    CommonWebError::from_error(e)
  })?;

  Ok(cost.cost_in_credits.unwrap_or(0))
}

async fn finalize_and_generate(
  draft_or_request: ImageGenerationDraftOrRequest,
  server_state: &ServerState,
) -> Result<GenerateImageResponse, CommonWebError> {
  let provider = draft_or_request.get_provider();
  let client = build_router_client(provider, server_state)?;

  let request = finalize_request(draft_or_request).await?;

  request.send_request(&client)
    .await
    .map_err(|err| {
      warn!("v2 image generation failed: {:?}", err);
      CommonWebError::from_error(err)
    })
}

async fn finalize_request(
  draft_or_request: ImageGenerationDraftOrRequest,
) -> Result<ImageGenerationRequest, CommonWebError> {
  match draft_or_request {
    ImageGenerationDraftOrRequest::Request(request) => Ok(request),
    ImageGenerationDraftOrRequest::Draft(draft) => {
      draft.finalize(ImageGenerationDraftContext::default())
        .await
        .map_err(|err| {
          warn!("Failed to finalize image v2 draft: {:?}", err);
          CommonWebError::from_error(err)
        })
    }
  }
}

fn build_router_client(
  provider: Provider,
  server_state: &ServerState,
) -> Result<RouterClient, CommonWebError> {
  match provider {
    Provider::Fal => {
      let fal_client = RouterFalClient::new_with_webhook(
        server_state.fal.api_key.clone(),
        server_state.fal.webhook_url.clone(),
      );
      Ok(RouterClient::Fal(fal_client))
    },
    other => {
      Err(CommonWebError::server_error_with_message(
        &format!("Unsupported provider for image v2 generation: {:?}", other),
      ))
    },
  }
}
