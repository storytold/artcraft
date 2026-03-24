use std::sync::Arc;

use crate::billing::wallets::temporary_test_wallet_deduction::temporary_test_wallet_deduction;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::generate::common::job_failure_test::test_synthetic_failure_reason;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::image::edit::flux_pro_kontext_max_edit_image::FluxProKontextMaxEditImageNumImages;
use artcraft_api_defs::generate::image::text::generate_flux_1_dev_text_to_image::{GenerateFlux1DevTextToImageAspectRatio, GenerateFlux1DevTextToImageNumImages, GenerateFlux1DevTextToImageRequest, GenerateFlux1DevTextToImageResponse};
use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::visibility::Visibility;
use fal_client::requests::webhook::image::text::enqueue_flux_1_dev_text_to_image_webhook::enqueue_flux_1_dev_text_to_image_webhook;
use fal_client::requests::webhook::image::text::enqueue_flux_1_dev_text_to_image_webhook::{Flux1DevArgs, Flux1DevAspectRatio, Flux1DevNumImages};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::insert_generic_inference_job_for_fal_queue;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::InsertGenericInferenceForFalArgs;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue_mock_failure::{insert_generic_inference_job_for_fal_queue_mock_failure, InsertGenericInferenceForFalMockFailureArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use sqlx::Acquire;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::users::UserToken;
use utoipa::ToSchema;

/// Flux 1 Dev text to image
#[utoipa::path(
  post,
  tag = "Generate Images",
  path = "/v1/generate/image/flux_1_dev_text_to_image",
  responses(
    (status = 200, description = "Success", body = GenerateFlux1DevTextToImageResponse),
  ),
  params(
    ("request" = GenerateFlux1DevTextToImageRequest, description = "Payload for Request"),
  )
)]
pub async fn generate_flux_1_dev_text_to_image_handler(
  http_request: HttpRequest,
  request: Json<GenerateFlux1DevTextToImageRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GenerateFlux1DevTextToImageResponse>, CommonWebError> {

  payments_error_test(&request.prompt.as_deref().unwrap_or(""))?;

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

  // TODO: Limit usage for new accounts. Billing, free credits metering, etc.

  //let user_session = match maybe_user_session {
  //  Some(session) => session,
  //  None => {
  //    warn!("not logged in");
  //    return Err(CommonWebError::NotAuthorized);
  //  }
  //};

  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(CommonWebError::BadInputWithSimpleMessage(reason));
  }

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
      })?;

  // Secret test hook: insert a synthetic "complete_failure" job without calling Fal.
  if let Some(synthetic_failure) = test_synthetic_failure_reason(request.prompt.as_deref().unwrap_or("")) {
    return insert_mock_failure_job(
      &http_request,
      request.prompt.as_deref(),
      &request.uuid_idempotency_token,
      maybe_user_session.as_ref().map(|s| &s.user_token),
      maybe_avt_token.as_ref(),
      Some(synthetic_failure.frontend_failure_category),
      synthetic_failure.frontend_failure_message.as_deref(),
      &mut mysql_connection,
    ).await;
  }

//  // TODO: This is test code
//  let credits = match request.num_images {
//    Some(GenerateFlux1DevTextToImageNumImages::One) => 100,
//    Some(GenerateFlux1DevTextToImageNumImages::Two) => 200,
//    Some(GenerateFlux1DevTextToImageNumImages::Three) => 300,
//    Some(GenerateFlux1DevTextToImageNumImages::Four) => 400,
//    None => 100,
//  };
//
//  // TODO: This is test code
//  let result = temporary_test_wallet_deduction(
//    user_token,
//    Some("todo-reference-token"),
//    credits,
//    &mut mysql_connection,
//  ).await;
//
//  // TODO: This is test code
//  if let Err(err) = result {
//    warn!("Temporary wallet deduction failed: {:?}", err); // Infallible for now.
//  }

  const IS_MOD : bool = false;

  info!("Fal webhook URL: {}", server_state.fal.webhook_url);
  
  let aspect_ratio = match request.aspect_ratio {
    Some(GenerateFlux1DevTextToImageAspectRatio::Square) => Flux1DevAspectRatio::Square,
    Some(GenerateFlux1DevTextToImageAspectRatio::SquareHd) => Flux1DevAspectRatio::SquareHd,
    Some(GenerateFlux1DevTextToImageAspectRatio::LandscapeFourByThree) => Flux1DevAspectRatio::LandscapeFourByThree,
    Some(GenerateFlux1DevTextToImageAspectRatio::LandscapeSixteenByNine) => Flux1DevAspectRatio::LandscapeSixteenByNine,
    Some(GenerateFlux1DevTextToImageAspectRatio::PortraitThreeByFour) => Flux1DevAspectRatio::PortraitThreeByFour,
    Some(GenerateFlux1DevTextToImageAspectRatio::PortraitNineBySixteen) => Flux1DevAspectRatio::PortraitNineBySixteen,
    None => Flux1DevAspectRatio::LandscapeSixteenByNine, // Default
  };
  
  let num_images = match request.num_images {
    Some(GenerateFlux1DevTextToImageNumImages::One) => Flux1DevNumImages::One,
    Some(GenerateFlux1DevTextToImageNumImages::Two) => Flux1DevNumImages::Two,
    Some(GenerateFlux1DevTextToImageNumImages::Three) => Flux1DevNumImages::Three,
    Some(GenerateFlux1DevTextToImageNumImages::Four) => Flux1DevNumImages::Four,
    None => Flux1DevNumImages::One, // Default
  };

  let args = Flux1DevArgs {
    prompt: request.prompt.as_deref().unwrap_or(""),
    webhook_url: &server_state.fal.webhook_url,
    api_key: &server_state.fal.api_key,
    aspect_ratio,
    num_images,
  };

  let fal_result = enqueue_flux_1_dev_text_to_image_webhook(args)
      .await
      .map_err(|err| {
        warn!("Error calling enqueue_flux_1_dev_text_to_image_webhook: {:?}", err);
        CommonWebError::ServerError
      })?;

  let external_job_id = fal_result.request_id
      .ok_or_else(|| {
        warn!("Fal request_id is None");
        CommonWebError::ServerError
      })?;

  info!("Fal request_id: {}", external_job_id);

  let ip_address = get_request_ip(&http_request);

  let mut transaction = mysql_connection
      .begin()
      .await
      .map_err(|err| {
        error!("Error starting MySQL transaction: {:?}", err);
        CommonWebError::ServerError
      })?;

  // NB: Don't fail the job if the query fails.
  let prompt_result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: maybe_user_session
        .as_ref()
        .map(|s| &s.user_token),
    maybe_model_type: Some(CommonModelType::Flux1Dev),
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: None,
    maybe_other_args: None,
    maybe_generation_mode: None,
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
      None // Don't fail the job if the prompt insertion fails.
    }
  };

  let db_result = insert_generic_inference_job_for_fal_queue(InsertGenericInferenceForFalArgs {
    uuid_idempotency_token: &request.uuid_idempotency_token,
    maybe_external_third_party_id: &external_job_id,
    fal_category: FalCategory::ImageGeneration,
    maybe_inference_args: None,
    maybe_prompt_token: prompt_token.as_ref(),
    maybe_creator_user_token: maybe_user_session.as_ref().map(|s| &s.user_token),
    maybe_avt_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility: Visibility::Public,
    mysql_executor: &mut *transaction,
    phantom: Default::default(),
  }).await;

  let job_token = match db_result {
    Ok(token) => token,
    Err(err) => {
      warn!("Error inserting generic inference job for FAL queue: {:?}", err);
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

  Ok(Json(GenerateFlux1DevTextToImageResponse {
    success: true,
    inference_job_token: job_token,
  }))
}

/// Inserts a synthetic `CompleteFailure` job without calling Fal.
/// Used when the prompt triggers the secret job-failure test phrase.
async fn insert_mock_failure_job(
  http_request: &HttpRequest,
  prompt: Option<&str>,
  uuid_idempotency_token: &str,
  maybe_creator_user_token: Option<&UserToken>,
  maybe_avt_token: Option<&AnonymousVisitorTrackingToken>,
  maybe_frontend_failure_category: Option<FrontendFailureCategory>,
  maybe_failure_reason: Option<&str>,
  mysql_connection: &mut sqlx::pool::PoolConnection<sqlx::MySql>,
) -> Result<Json<GenerateFlux1DevTextToImageResponse>, CommonWebError> {
  let ip_address = get_request_ip(http_request);

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
    maybe_creator_user_token,
    maybe_model_type: Some(CommonModelType::Flux1Dev),
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: prompt,
    maybe_negative_prompt: None,
    maybe_other_args: None,
    maybe_generation_mode: None,
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
      warn!("Error inserting prompt for mock failure job: {:?}", err);
      None
    }
  };

  let mock_result = insert_generic_inference_job_for_fal_queue_mock_failure(InsertGenericInferenceForFalMockFailureArgs {
    uuid_idempotency_token,
    fal_category: FalCategory::ImageGeneration,
    maybe_inference_args: None,
    maybe_prompt_token: prompt_token.as_ref(),
    maybe_creator_user_token,
    maybe_avt_token,
    creator_ip_address: &ip_address,
    creator_set_visibility: Visibility::Public,
    maybe_frontend_failure_category,
    maybe_failure_reason,
    mysql_executor: &mut *transaction,
    phantom: Default::default(),
  }).await;

  let job_token = match mock_result {
    Ok(token) => token,
    Err(err) => {
      warn!("Error inserting mock failure job: {:?}", err);
      return Err(CommonWebError::ServerError);
    }
  };

  transaction
      .commit()
      .await
      .map_err(|err| {
        error!("Error committing mock failure transaction: {:?}", err);
        CommonWebError::ServerError
      })?;

  Ok(Json(GenerateFlux1DevTextToImageResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
