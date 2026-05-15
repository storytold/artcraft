use std::collections::HashMap;

use log::{info, warn};
use url::Url;

use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::client::router_fal_webhook_optional_client::RouterFalWebhookOptionalClient;
use artcraft_router::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use artcraft_router::generate::generate_image::generate_image_response::GenerateImageResponse;
use artcraft_router::generate::generate_image_v2::image_generation_draft_context::ImageGenerationDraftContext;
use artcraft_router::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use artcraft_router::generate::generate_image_v2::image_generation_request::ImageGenerationRequest;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::omni_gen::generate::image::pipeline_result::ImagePipelineResult;
use crate::state::server_state::ServerState;

pub struct RunPipelineV2Args<'a> {
  pub router_builder: &'a GenerateImageRequestBuilder,
  pub server_state: &'a ServerState,
  pub mysql_connection: &'a mut sqlx::pool::PoolConnection<sqlx::MySql>,
  pub user_token: &'a UserToken,
  pub media_file_hydration_map: &'a Option<HashMap<MediaFileToken, Url>>,
}

pub fn should_use_pipeline_v2(router_builder: &GenerateImageRequestBuilder) -> bool {
  let mut execution_builder = router_builder.clone();
  execution_builder.provider = Provider::Fal;
  execution_builder.use_new_builder()
}

pub async fn run_pipeline_v2(
  args: RunPipelineV2Args<'_>,
) -> Result<ImagePipelineResult, AdvancedCommonWebError> {
  let RunPipelineV2Args {
    router_builder,
    server_state,
    mysql_connection,
    user_token,
    media_file_hydration_map,
  } = args;

  let hydrated_builder = apply_hydrated_media_inputs(
    router_builder,
    media_file_hydration_map.as_ref(),
  )?;

  let draft_or_request = build_execution_request(&hydrated_builder)?;
  let cost = estimate_cost_in_credits(&hydrated_builder)?;

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
) -> Result<ImageGenerationDraftOrRequest, AdvancedCommonWebError> {
  let mut execution_builder = router_builder.clone();
  execution_builder.provider = Provider::Fal;

  execution_builder.build2().map_err(|e| {
    warn!("Failed to build2 for image v2 pipeline: {}", e);
    AdvancedCommonWebError::from_error(e)
  })
}

fn apply_hydrated_media_inputs(
  router_builder: &GenerateImageRequestBuilder,
  media_file_hydration_map: Option<&HashMap<MediaFileToken, Url>>,
) -> Result<GenerateImageRequestBuilder, AdvancedCommonWebError> {
  let mut hydrated_builder = router_builder.clone();
  let image_input_urls = build_image_input_urls(
    hydrated_builder.image_inputs.as_ref(),
    media_file_hydration_map,
  )?;

  if let Some(urls) = image_input_urls {
    hydrated_builder.image_inputs = Some(ImageListRef::Urls(urls));
  }

  Ok(hydrated_builder)
}

fn build_image_input_urls(
  image_inputs: Option<&ImageListRef>,
  hydration_map: Option<&HashMap<MediaFileToken, Url>>,
) -> Result<Option<Vec<String>>, AdvancedCommonWebError> {
  let tokens = match image_inputs {
    Some(ImageListRef::MediaFileTokens(tokens)) if !tokens.is_empty() => tokens,
    _ => return Ok(None),
  };

  let map = hydration_map.ok_or_else(|| {
    AdvancedCommonWebError::BadInputWithSimpleMessage(
      "image_media_tokens supplied but no hydration map was provided".to_string(),
    )
  })?;

  let mut urls: Vec<String> = Vec::with_capacity(tokens.len());
  for token in tokens {
    match map.get(token) {
      Some(url) => urls.push(url.to_string()),
      None => {
        return Err(AdvancedCommonWebError::BadInputWithSimpleMessage(format!(
          "Image media token not found in hydration map: {:?}",
          token
        )));
      },
    }
  }

  Ok(Some(urls))
}

fn estimate_cost_in_credits(
  router_builder: &GenerateImageRequestBuilder,
) -> Result<u64, AdvancedCommonWebError> {
  // TODO(bt,2026-05-15): This might not be 1:1 with new Fal costs, eg. Gpt-image-2
  let mut cost_builder = router_builder.clone();
  cost_builder.provider = Provider::Artcraft;

  let cost_plan = cost_builder.build().map_err(|e| {
    warn!("Failed to build image cost plan for v2 pipeline: {}", e);
    AdvancedCommonWebError::from_error(e)
  })?;

  Ok(cost_plan.estimate_costs().cost_in_credits.unwrap_or(0))
}

async fn finalize_and_generate(
  draft_or_request: ImageGenerationDraftOrRequest,
  server_state: &ServerState,
) -> Result<GenerateImageResponse, AdvancedCommonWebError> {
  let provider = draft_or_request.get_provider();
  let client = build_router_client(provider, server_state)?;

  let request = finalize_request(draft_or_request).await?;

  request.send_request(&client)
    .await
    .map_err(|err| {
      warn!("v2 image generation failed: {:?}", err);
      AdvancedCommonWebError::from_error(err)
    })
}

async fn finalize_request(
  draft_or_request: ImageGenerationDraftOrRequest,
) -> Result<ImageGenerationRequest, AdvancedCommonWebError> {
  match draft_or_request {
    ImageGenerationDraftOrRequest::Request(request) => Ok(request),
    ImageGenerationDraftOrRequest::Draft(draft) => {
      draft.finalize(ImageGenerationDraftContext::default())
        .await
        .map_err(|err| {
          warn!("Failed to finalize image v2 draft: {:?}", err);
          AdvancedCommonWebError::from_error(err)
        })
    }
  }
}

fn build_router_client(
  provider: Provider,
  server_state: &ServerState,
) -> Result<RouterClient, AdvancedCommonWebError> {
  match provider {
    Provider::Fal => {
      let fal_client = RouterFalWebhookOptionalClient::new_with_webhook(
        server_state.fal.api_key.clone(),
        server_state.fal.webhook_url.clone(),
      );
      Ok(RouterClient::FalWebhookOptional(fal_client))
    },
    other => {
      Err(AdvancedCommonWebError::server_error_with_message(
        &format!("Unsupported provider for image v2 generation: {:?}", other),
      ))
    },
  }
}
