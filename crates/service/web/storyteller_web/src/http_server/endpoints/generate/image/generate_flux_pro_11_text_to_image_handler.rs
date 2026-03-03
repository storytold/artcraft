use std::sync::Arc;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::billing::wallets::temporary_test_wallet_deduction::temporary_test_wallet_deduction;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::image::text::generate_flux_1_schnell_text_to_image::GenerateFlux1SchnellTextToImageNumImages;
use artcraft_api_defs::generate::image::text::generate_flux_pro_11_text_to_image::GenerateFluxPro11TextToImageResponse;
use artcraft_api_defs::generate::image::text::generate_flux_pro_11_text_to_image::{GenerateFluxPro11TextToImageAspectRatio, GenerateFluxPro11TextToImageNumImages, GenerateFluxPro11TextToImageRequest};
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::model_type::ModelType;
use enums::common::visibility::Visibility;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::image::enqueue_flux_pro_11_text_to_image_webhook::FluxPro11Args;
use fal_client::requests::webhook::image::enqueue_flux_pro_11_text_to_image_webhook::{enqueue_flux_pro_11_text_to_image_webhook, FluxPro11AspectRatio, FluxPro11NumImages};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::insert_generic_inference_job_for_fal_queue;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::InsertGenericInferenceForFalArgs;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue_with_apriori_job_token::{insert_generic_inference_job_for_fal_queue_with_apriori_job_token, InsertGenericInferenceForFalWithAprioriJobTokenArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use sqlx::Acquire;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use utoipa::ToSchema;

/// Flux Pro 1.1
#[utoipa::path(
  post,
  tag = "Generate Images",
  path = "/v1/generate/image/flux_pro_1.1_text_to_image",
  responses(
    (status = 200, description = "Success", body = GenerateFluxPro11TextToImageResponse),
  ),
  params(
    ("request" = GenerateFluxPro11TextToImageRequest, description = "Payload for Request"),
  )
)]
pub async fn generate_flux_pro_11_text_to_image_handler(
  http_request: HttpRequest,
  request: Json<GenerateFluxPro11TextToImageRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GenerateFluxPro11TextToImageResponse>, CommonWebError> {

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

  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(CommonWebError::BadInputWithSimpleMessage(reason));
  }

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("invalid idempotency token".to_string())
      })?;

  const IS_MOD : bool = false;
  
  info!("Fal webhook URL: {}", server_state.fal.webhook_url);

  let apriori_job_token = InferenceJobToken::generate();

  let aspect_ratio = match request.aspect_ratio {
    Some(GenerateFluxPro11TextToImageAspectRatio::Square) => FluxPro11AspectRatio::Square,
    Some(GenerateFluxPro11TextToImageAspectRatio::LandscapeFourByThree) => FluxPro11AspectRatio::LandscapeFourByThree,
    Some(GenerateFluxPro11TextToImageAspectRatio::LandscapeSixteenByNine) => FluxPro11AspectRatio::LandscapeSixteenByNine,
    Some(GenerateFluxPro11TextToImageAspectRatio::PortraitThreeByFour) => FluxPro11AspectRatio::PortraitThreeByFour,
    Some(GenerateFluxPro11TextToImageAspectRatio::PortraitNineBySixteen) => FluxPro11AspectRatio::PortraitNineBySixteen,
    None => FluxPro11AspectRatio::LandscapeSixteenByNine, // Default
  };
  
  let num_images = match request.num_images {
    Some(GenerateFluxPro11TextToImageNumImages::One) => FluxPro11NumImages::One,
    Some(GenerateFluxPro11TextToImageNumImages::Two) => FluxPro11NumImages::Two,
    Some(GenerateFluxPro11TextToImageNumImages::Three) => FluxPro11NumImages::Three,
    Some(GenerateFluxPro11TextToImageNumImages::Four) => FluxPro11NumImages::Four,
    None => FluxPro11NumImages::One, // Default
  };

  let args = FluxPro11Args {
    prompt: request.prompt.as_deref().unwrap_or(""),
    webhook_url: &server_state.fal.webhook_url,
    api_key: &server_state.fal.api_key,
    aspect_ratio,
    num_images,
  };

  let cost = args.calculate_cost_in_cents();

  info!("Charging wallet: {}", cost);

  attempt_wallet_deduction_else_common_web_error(
    user_token,
    Some(apriori_job_token.as_str()),
    cost,
    &mut mysql_connection,
  ).await?;

  let fal_result = enqueue_flux_pro_11_text_to_image_webhook(args)
      .await
      .map_err(|err| {
        warn!("Error calling enqueue_flux_pro_text_to_image_webhook: {:?}", err);
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
    maybe_creator_user_token: Some(&user_token),
    maybe_model_type: Some(ModelType::FluxPro11),
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: None,
    maybe_other_args: None,
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

  let db_result = insert_generic_inference_job_for_fal_queue_with_apriori_job_token(InsertGenericInferenceForFalWithAprioriJobTokenArgs {
    apriori_job_token: &apriori_job_token,
    uuid_idempotency_token: &request.uuid_idempotency_token,
    maybe_external_third_party_id: &external_job_id,
    fal_category: FalCategory::ImageGeneration,
    maybe_inference_args: None,
    maybe_prompt_token: prompt_token.as_ref(),
    maybe_creator_user_token: Some(&user_token),
    maybe_avt_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility: Visibility::Public,
    mysql_executor: &mut *transaction,
    starting_job_status_override: None,
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

  Ok(Json(GenerateFluxPro11TextToImageResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
