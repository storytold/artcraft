use std::collections::HashMap;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use sqlx::Acquire;
use url::Url;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::generate_response::omni_gen_image_generate_response::OmniGenImageGenerateResponse;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::client::router_fal_client::RouterFalClient;
use artcraft_router::generate::generate_image::generate_image_response::GenerateImageResponse;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue_with_apriori_job_token::{
  insert_generic_inference_job_for_fal_queue_with_apriori_job_token,
  InsertGenericInferenceForFalWithAprioriJobTokenArgs,
};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{
  insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem,
};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_image_urls_as_map::lookup_image_urls_as_map;

use super::distill_image_request::distill_image_request;

/// Generate an image using the omni-gen unified endpoint.
#[utoipa::path(
  post,
  tag = "Omni Gen",
  path = "/v1/omni_gen/generate/image",
  request_body = OmniGenImageCostAndGenerateRequest,
  responses(
    (status = 200, description = "Success", body = OmniGenImageGenerateResponse),
    (status = 400, description = "Bad input"),
    (status = 401, description = "Unauthorized"),
    (status = 402, description = "Payment required"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_gen_image_generate_handler(
  http_request: HttpRequest,
  request: Json<OmniGenImageCostAndGenerateRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniGenImageGenerateResponse>, AdvancedCommonWebError> {

  payments_error_test(&request.prompt.as_deref().unwrap_or(""))?;

  let maybe_prompt_model_type: Option<CommonModelType> = request.model
    .as_ref()
    .map(|m| m.to_common_model_type());

  // ==================== SESSION ==================== //

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  let maybe_user_session = server_state
    .session_checker
    .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      AdvancedCommonWebError::from(e)
    })?;

  let user_token = match maybe_user_session.as_ref() {
    Some(session) => &session.user_token,
    None => return Err(AdvancedCommonWebError::NotAuthorized),
  };

  let maybe_avt_token = server_state
    .avt_cookie_manager
    .get_avt_token_from_request(&http_request);

  // ==================== IDEMPOTENCY ==================== //

  let idempotency_token = request.idempotency_token.as_deref()
    .unwrap_or("")
    .to_string();

  if let Err(reason) = validate_idempotency_token_format(&idempotency_token) {
    return Err(AdvancedCommonWebError::BadInputWithSimpleMessage(reason));
  }

  insert_idempotency_token(&idempotency_token, &mut *mysql_connection)
    .await
    .map_err(|err| {
      error!("Error inserting idempotency token: {:?}", err);
      AdvancedCommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
    })?;

  // ==================== RESOLVE MEDIA TOKENS ==================== //
  // Look up media file tokens BEFORE distilling. distill_image_request takes
  // a pre-computed `MediaFileToken -> Url` map and does no I/O of its own.

  let media_file_hydration_map: Option<HashMap<MediaFileToken, Url>> = match request.image_media_tokens.as_ref() {
    Some(tokens) if !tokens.is_empty() => {
      info!("Resolving {} image media tokens to CDN URLs", tokens.len());
      let raw = lookup_image_urls_as_map(
        &http_request,
        &mut mysql_connection,
        server_state.server_environment,
        tokens,
      ).await?;
      let parsed: HashMap<MediaFileToken, Url> = raw.into_iter()
        .filter_map(|(token, url_str)| match Url::parse(&url_str) {
          Ok(url) => Some((token, url)),
          Err(err) => {
            warn!("Failed to parse media file URL {:?}: {:?}", url_str, err);
            None
          }
        })
        .collect();
      Some(parsed)
    }
    _ => None,
  };

  // ==================== DISTILL ==================== //

  let distilled = distill_image_request(&request, media_file_hydration_map.as_ref())?;

  // ==================== BILLING ==================== //

  let cost = distilled.cost.cost_in_credits.unwrap_or(0);

  info!("Charging wallet: {} credits", cost);

  let apriori_job_token = InferenceJobToken::generate();

  if cost > 0 {
    attempt_wallet_deduction_else_common_web_error(
      user_token,
      Some(apriori_job_token.as_str()),
      cost,
      &mut mysql_connection,
    ).await?;
  }

  // ==================== EXECUTE GENERATION ==================== //

  let fal_client = RouterFalClient::new(
    server_state.fal.api_key.clone(),
    server_state.fal.webhook_url.clone(),
  );

  let router_client = RouterClient::Fal(fal_client);

  let generation_response = distilled.plan().generate_image(&router_client)
    .await
    .map_err(|e| {
      warn!("Image generation failed: {:?}", e);
      AdvancedCommonWebError::from_error(e)
    })?;

  let external_job_id = match &generation_response {
    GenerateImageResponse::Artcraft(p) => {
      p.inference_job_token.as_str().to_string()
    }
    GenerateImageResponse::Fal(p) => {
      p.request_id.clone().unwrap_or_default()
    }
  };

  // ==================== DB TRANSACTION ==================== //

  let ip_address = get_request_ip(&http_request);

  let mut transaction = mysql_connection
    .begin()
    .await
    .map_err(|err| {
      error!("Error starting MySQL transaction: {:?}", err);
      AdvancedCommonWebError::from_error(err)
    })?;

  // -- Prompt --

  let generation_mode = if request.image_media_tokens.is_some() {
    CommonGenerationMode::Edit
  } else {
    CommonGenerationMode::Text
  };

  let prompt_result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: Some(user_token),
    maybe_model_type: maybe_prompt_model_type,
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: None,
    maybe_other_args: None,
    maybe_generation_mode: Some(generation_mode),
    maybe_aspect_ratio: request.aspect_ratio, // TODO: should be saved from router's decision as it could have changed
    maybe_resolution: request.resolution,// TODO: should be saved from router's decision as it could have changed
    maybe_batch_count: request.image_batch_count.map(|c| c as u8),
    maybe_generate_audio: None, // NB: Images, not video
    maybe_duration_seconds: None, // NB: Images, not video
    creator_ip_address: &ip_address,
    mysql_executor: &mut *transaction,
    phantom: Default::default(),
  }).await;

  let prompt_token = match prompt_result {
    Ok(token) => Some(token),
    Err(err) => {
      warn!("Error inserting prompt: {:?}", err);
      None
    }
  };

  // -- Prompt context items --

  if let Some(token) = prompt_token.as_ref() {
    let mut context_items = Vec::new();

    if let Some(ref_tokens) = &request.image_media_tokens {
      for media_token in ref_tokens {
        context_items.push(PromptContextItem {
          media_token: media_token.clone(),
          context_semantic_type: PromptContextSemanticType::Imgsrc,
        });
      }
    }

    if !context_items.is_empty() {
      if let Err(err) = insert_batch_prompt_context_items(InsertBatchArgs {
        prompt_token: token.clone(),
        items: context_items,
        transaction: &mut transaction,
      }).await {
        warn!("Error inserting batch prompt context items: {:?}", err);
      }
    }
  }

  // -- Inference job --

  let db_result = insert_generic_inference_job_for_fal_queue_with_apriori_job_token(
    InsertGenericInferenceForFalWithAprioriJobTokenArgs {
      apriori_job_token: &apriori_job_token,
      uuid_idempotency_token: &idempotency_token,
      maybe_external_third_party_id: &external_job_id,
      fal_category: FalCategory::ImageGeneration,
      maybe_inference_args: None,
      maybe_prompt_token: prompt_token.as_ref(),
      maybe_creator_user_token: Some(user_token),
      maybe_avt_token: maybe_avt_token.as_ref(),
      creator_ip_address: &ip_address,
      creator_set_visibility: Visibility::Public,
      mysql_executor: &mut *transaction,
      starting_job_status_override: None,
      maybe_frontend_failure_category: None,
      maybe_failure_reason: None,
      phantom: Default::default(),
    }
  ).await;

  let job_token = match db_result {
    Ok(token) => token,
    Err(err) => {
      warn!("Error inserting inference job: {:?}", err);
      return Err(AdvancedCommonWebError::from_error(err));
    }
  };

  transaction.commit().await.map_err(|err| {
    error!("Error committing transaction: {:?}", err);
    AdvancedCommonWebError::from_error(err)
  })?;

  Ok(Json(OmniGenImageGenerateResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
