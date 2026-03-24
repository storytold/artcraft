use std::sync::Arc;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoint_helpers::refund_wallet_after_api_failure::refund_wallet_after_api_failure;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_image_urls_as_map::lookup_image_urls_as_map;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::splat::generate_worldlabs_marble_0p1_mini_splat::{GenerateWorldlabsMarble0p1MiniSplatRequest, GenerateWorldlabsMarble0p1MiniSplatResponse};
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::visibility::Visibility;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::worldlabs::insert_generic_inference_job_for_worldlabs_queue_with_apriori_job_token::{insert_generic_inference_job_for_worldlabs_queue_with_apriori_job_token, InsertGenericInferenceForWorldlabsWithAprioriJobTokenArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use sqlx::Acquire;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use worldlabs_api_client::api::api_types::world_labs_model::WorldLabsModel;
use worldlabs_api_client::api::requests::generate_world::generate_world::{generate_world, GenerateWorldArgs};
use worldlabs_api_client::api::requests::generate_world::http_request::{ContentReference, WorldPrompt};
use worldlabs_api_client::credentials::world_labs_api_creds::WorldLabsApiCreds;
use worldlabs_api_client::pricing::check_pricing::{calculate_cost, InputType};

/// World Labs Marble 0.1-mini Splat Generation
#[utoipa::path(
  post,
  tag = "Generate Splats",
  path = "/v1/generate/splat/worldlabs_marble_0p1_mini",
  responses(
    (status = 200, description = "Success", body = GenerateWorldlabsMarble0p1MiniSplatResponse),
  ),
  params(
    ("request" = GenerateWorldlabsMarble0p1MiniSplatRequest, description = "Payload for Request"),
  )
)]
pub async fn generate_worldlabs_marble_0p1_mini_splat_handler(
  http_request: HttpRequest,
  request: Json<GenerateWorldlabsMarble0p1MiniSplatRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GenerateWorldlabsMarble0p1MiniSplatResponse>, CommonWebError> {

  payments_error_test(&request.prompt.as_deref().unwrap_or(""))?;

  if request.image_media_file_token.is_none() && request.prompt.is_none() {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      "At least one of image_media_file_token or prompt must be provided".to_string()
    ));
  }

  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(CommonWebError::BadInputWithSimpleMessage(reason));
  }

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::ServerError
      })?;

  let maybe_avt_token = server_state
      .avt_cookie_manager
      .get_avt_token_from_request(&http_request);

  let user_token = match maybe_user_session.as_ref() {
    Some(session) => &session.user_token,
    None => {
      return Err(CommonWebError::NotAuthorized);
    }
  };

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
      })?;

  let apriori_job_token = InferenceJobToken::generate();

  // Determine input type and calculate cost
  let input_type = if request.image_media_file_token.is_some() {
    InputType::ImageNonPanorama
  } else {
    InputType::Text
  };

  let cost = calculate_cost(WorldLabsModel::Marble0p1Mini, input_type);
  let cost_in_cents = cost.us_dollar_cents as u64;

  info!("Charging wallet: {} cents for Marble 0.1-mini splat", cost_in_cents);

  let wallet_deduction = attempt_wallet_deduction_else_common_web_error(
    user_token,
    Some(apriori_job_token.as_str()),
    cost_in_cents,
    &mut mysql_connection,
  ).await?;

  // Build WorldPrompt based on input
  let world_prompt = if let Some(image_token) = &request.image_media_file_token {
    let image_urls = lookup_image_urls_as_map(
      &http_request,
      &mut mysql_connection,
      server_state.server_environment,
      &[image_token.clone()],
    ).await?;

    let cdn_url = image_urls.get(image_token)
      .ok_or_else(|| {
        warn!("Image token not found in lookup results: {:?}", image_token);
        CommonWebError::ServerError
      })?;

    WorldPrompt::Image {
      image_prompt: ContentReference::Uri { uri: cdn_url.clone() },
      text_prompt: request.prompt.clone(),
      is_pano: None,
      disable_recaption: None,
    }
  } else {
    WorldPrompt::Text {
      text_prompt: request.prompt.clone(),
      disable_recaption: None,
    }
  };

  // Call World Labs API to start generation
  let creds = WorldLabsApiCreds::new(server_state.worldlabs.api_key.clone());
  
  let generate_result = match generate_world(GenerateWorldArgs {
    creds: &creds,
    world_prompt,
    display_name: None,
    model: WorldLabsModel::Marble0p1Mini,
    seed: None,
    tags: None,
    permission: None,
    request_timeout: None,
  }).await {
    Ok(result) => result,
    Err(err) => {
      warn!("World Labs generate_world error: {:?}", err);
      refund_wallet_after_api_failure(&wallet_deduction.ledger_entry_token, &mut mysql_connection).await?;
      return Err(CommonWebError::ServerError);
    }
  };

  let ip_address = get_request_ip(&http_request);

  let mut transaction = mysql_connection
      .begin()
      .await
      .map_err(|err| {
        error!("Error starting MySQL transaction: {:?}", err);
        CommonWebError::ServerError
      })?;

  let prompt_result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: Some(user_token),
    maybe_model_type: Some(CommonModelType::Marble0p1Mini),
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: None,
    maybe_other_args: None,
    maybe_generation_mode: Some(CommonGenerationMode::Reference),
    maybe_aspect_ratio: None,
    maybe_resolution: None,
    maybe_batch_count: None,
    maybe_generate_audio: None,
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

  if let Some(image_token) = &request.image_media_file_token {
    if let Some(token) = prompt_token.as_ref() {
      let result = insert_batch_prompt_context_items(InsertBatchArgs {
        prompt_token: token.clone(),
        items: vec![
          PromptContextItem {
            media_token: image_token.clone(),
            context_semantic_type: PromptContextSemanticType::Imgref,
          }
        ],
        transaction: &mut transaction,
      }).await;

      if let Err(err) = result {
        warn!("Error inserting batch prompt context items: {:?}", err);
      }
    }
  }

  let db_result = insert_generic_inference_job_for_worldlabs_queue_with_apriori_job_token(InsertGenericInferenceForWorldlabsWithAprioriJobTokenArgs {
    apriori_job_token: &apriori_job_token,
    uuid_idempotency_token: &request.uuid_idempotency_token,
    maybe_external_third_party_id: generate_result.operation_id.as_str(),
    maybe_inference_args: None,
    maybe_prompt_token: prompt_token.as_ref(),
    maybe_wallet_ledger_entry_token: Some(&wallet_deduction.ledger_entry_token),
    maybe_creator_user_token: Some(user_token),
    maybe_avt_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility: Visibility::Public,
    mysql_executor: &mut *transaction,
    phantom: Default::default(),
  }).await;

  let job_token = match db_result {
    Ok(token) => token,
    Err(err) => {
      warn!("Error inserting generic inference job for WorldLabs queue: {:?}", err);
      return Err(CommonWebError::ServerError);
    }
  };

  let _r = transaction
      .commit()
      .await
      .map_err(|err| {
        error!("Error committing MySQL transaction: {:?}", err);
        CommonWebError::ServerError
      })?;

  Ok(Json(GenerateWorldlabsMarble0p1MiniSplatResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
