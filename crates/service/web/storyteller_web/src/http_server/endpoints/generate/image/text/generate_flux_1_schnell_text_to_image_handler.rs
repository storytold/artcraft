use std::sync::Arc;

use crate::billing::wallets::temporary_test_wallet_deduction::temporary_test_wallet_deduction;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::image::text::generate_flux_1_schnell_text_to_image::{GenerateFlux1SchnellTextToImageAspectRatio, GenerateFlux1SchnellTextToImageNumImages, GenerateFlux1SchnellTextToImageRequest, GenerateFlux1SchnellTextToImageResponse};
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::visibility::Visibility;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use fal_client::requests::webhook::image::text::enqueue_flux_1_schnell_text_to_image_webhook::enqueue_flux_1_schnell_text_to_image_webhook;
use fal_client::requests::webhook::image::text::enqueue_flux_1_schnell_text_to_image_webhook::{Flux1SchnellArgs, Flux1SchnellAspectRatio, Flux1SchnellNumImages};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::insert_generic_inference_job_for_fal_queue;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::InsertGenericInferenceForFalArgs;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use sqlx::Acquire;
use utoipa::ToSchema;

/// Flux 1 Schnell text to image
#[utoipa::path(
  post,
  tag = "Generate Images",
  path = "/v1/generate/image/flux_1_schnell_text_to_image",
  responses(
    (status = 200, description = "Success", body = GenerateFlux1SchnellTextToImageResponse),
  ),
  params(
    ("request" = GenerateFlux1SchnellTextToImageRequest, description = "Payload for Request"),
  )
)]
pub async fn generate_flux_1_schnell_text_to_image_handler(
  http_request: HttpRequest,
  request: Json<GenerateFlux1SchnellTextToImageRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GenerateFlux1SchnellTextToImageResponse>, CommonWebError> {

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

  // // TODO: This is test code
  // let credits = match request.num_images {
  //   Some(GenerateFlux1SchnellTextToImageNumImages::One) => 25,
  //   Some(GenerateFlux1SchnellTextToImageNumImages::Two) => 50,
  //   Some(GenerateFlux1SchnellTextToImageNumImages::Three) => 75,
  //   Some(GenerateFlux1SchnellTextToImageNumImages::Four) => 100,
  //   None => 100,
  // };

  // // TODO: This is test code
  // let result = temporary_test_wallet_deduction(
  //   user_token,
  //   Some("todo-reference-token"),
  //   credits,
  //   &mut mysql_connection,
  // ).await;

  // // TODO: This is test code
  // if let Err(err) = result {
  //   warn!("Temporary wallet deduction failed: {:?}", err); // Infallible for now.
  // }

  const IS_MOD : bool = false;

  info!("Fal webhook URL: {}", server_state.fal.webhook_url);
  
  let aspect_ratio = match request.aspect_ratio {
    Some(GenerateFlux1SchnellTextToImageAspectRatio::Square) => Flux1SchnellAspectRatio::Square,
    Some(GenerateFlux1SchnellTextToImageAspectRatio::SquareHd) => Flux1SchnellAspectRatio::SquareHd,
    Some(GenerateFlux1SchnellTextToImageAspectRatio::LandscapeFourByThree) => Flux1SchnellAspectRatio::LandscapeFourByThree,
    Some(GenerateFlux1SchnellTextToImageAspectRatio::LandscapeSixteenByNine) => Flux1SchnellAspectRatio::LandscapeSixteenByNine,
    Some(GenerateFlux1SchnellTextToImageAspectRatio::PortraitThreeByFour) => Flux1SchnellAspectRatio::PortraitThreeByFour,
    Some(GenerateFlux1SchnellTextToImageAspectRatio::PortraitNineBySixteen) => Flux1SchnellAspectRatio::PortraitNineBySixteen,
    None => Flux1SchnellAspectRatio::LandscapeSixteenByNine, // Default
  };
  
  let num_images = match request.num_images {
    Some(GenerateFlux1SchnellTextToImageNumImages::One) => Flux1SchnellNumImages::One,
    Some(GenerateFlux1SchnellTextToImageNumImages::Two) => Flux1SchnellNumImages::Two,
    Some(GenerateFlux1SchnellTextToImageNumImages::Three) => Flux1SchnellNumImages::Three,
    Some(GenerateFlux1SchnellTextToImageNumImages::Four) => Flux1SchnellNumImages::Four,
    None => Flux1SchnellNumImages::One, // Default
  };

  let args = Flux1SchnellArgs {
    prompt: request.prompt.as_deref().unwrap_or(""),
    webhook_url: &server_state.fal.webhook_url,
    api_key: &server_state.fal.api_key,
    aspect_ratio,
    num_images,
  };

  let fal_result = enqueue_flux_1_schnell_text_to_image_webhook(args)
      .await
      .map_err(|err| {
        warn!("Error calling enqueue_flux_1_schnell_text_to_image_webhook: {:?}", err);
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
  let maybe_aspect_ratio = match request.aspect_ratio {
    Some(GenerateFlux1SchnellTextToImageAspectRatio::Square) => Some(CommonAspectRatio::Square),
    Some(GenerateFlux1SchnellTextToImageAspectRatio::SquareHd) => Some(CommonAspectRatio::SquareHd),
    Some(GenerateFlux1SchnellTextToImageAspectRatio::LandscapeFourByThree) => Some(CommonAspectRatio::WideFourByThree),
    Some(GenerateFlux1SchnellTextToImageAspectRatio::LandscapeSixteenByNine) => Some(CommonAspectRatio::WideSixteenByNine),
    Some(GenerateFlux1SchnellTextToImageAspectRatio::PortraitThreeByFour) => Some(CommonAspectRatio::TallThreeByFour),
    Some(GenerateFlux1SchnellTextToImageAspectRatio::PortraitNineBySixteen) => Some(CommonAspectRatio::TallNineBySixteen),
    None => None,
  };

  let maybe_batch_count: Option<u8> = match request.num_images {
    Some(GenerateFlux1SchnellTextToImageNumImages::One) => Some(1),
    Some(GenerateFlux1SchnellTextToImageNumImages::Two) => Some(2),
    Some(GenerateFlux1SchnellTextToImageNumImages::Three) => Some(3),
    Some(GenerateFlux1SchnellTextToImageNumImages::Four) => Some(4),
    None => None,
  };

  let prompt_result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: maybe_user_session
        .as_ref()
        .map(|s| &s.user_token),
    maybe_model_type: Some(CommonModelType::Flux1Schnell),
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: None,
    maybe_other_args: None,
    maybe_generation_mode: Some(CommonGenerationMode::Text), // TODO: This endpoint only supports "text" for now
    maybe_aspect_ratio,
    maybe_resolution: None,
    maybe_batch_count,
    maybe_generate_audio: None,
    maybe_duration_seconds: None,
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
    maybe_prompt_token: prompt_token.as_ref(),
    maybe_inference_args: None,
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

  Ok(Json(GenerateFlux1SchnellTextToImageResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
