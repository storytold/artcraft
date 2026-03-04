use std::sync::Arc;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_image_urls_as_optional_list::lookup_image_urls_as_optional_list;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::image::multi_function::nano_banana_2_multi_function_image_gen::{NanaBanana2MultiFunctionImageGenAspectRatio, NanaBanana2MultiFunctionImageGenImageResolution, NanaBanana2MultiFunctionImageGenNumImages, NanaBanana2MultiFunctionImageGenRequest, NanaBanana2MultiFunctionImageGenResponse};
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::model_type::ModelType;
use enums::common::visibility::Visibility;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::image::edit::enqueue_nano_banana_2_edit_image_webhook::{enqueue_nano_banana_2_edit_image_webhook, EnqueueNanoBanana2EditImageArgs, EnqueueNanoBanana2EditImageAspectRatio, EnqueueNanoBanana2EditImageNumImages, EnqueueNanoBanana2EditImageResolution};
use fal_client::requests::webhook::image::text::enqueue_nano_banana_2_text_to_image_webhook::{enqueue_nano_banana_2_text_to_image_webhook, EnqueueNanoBanana2TextToImageArgs, EnqueueNanoBanana2TextToImageAspectRatio, EnqueueNanoBanana2TextToImageNumImages, EnqueueNanoBanana2TextToImageResolution};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue_with_apriori_job_token::{insert_generic_inference_job_for_fal_queue_with_apriori_job_token, InsertGenericInferenceForFalWithAprioriJobTokenArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use sqlx::Acquire;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

/// Nano Banana 2 Multi-Function (generate + edit)
#[utoipa::path(
  post,
  tag = "Generate Images (Multi-Function)",
  path = "/v1/generate/image/multi_function/nano_banana_2",
  responses(
    (status = 200, description = "Success", body = NanaBanana2MultiFunctionImageGenResponse),
  ),
  params(
    ("request" = NanaBanana2MultiFunctionImageGenRequest, description = "Payload for Request"),
  )
)]
pub async fn nano_banana_2_multi_function_image_gen_handler(
  http_request: HttpRequest,
  request: Json<NanaBanana2MultiFunctionImageGenRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<NanaBanana2MultiFunctionImageGenResponse>, CommonWebError> {

  payments_error_test(&request.prompt.as_deref().unwrap_or(""))?;

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

  let image_urls = match request.image_media_tokens.as_ref() {
    Some(media_tokens) => {
      info!("Looking up image media tokens: {:?}", media_tokens);
      lookup_image_urls_as_optional_list(
        &http_request,
        &mut mysql_connection,
        server_state.server_environment,
        media_tokens,
      ).await?
    },
    None => None,
  };

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
      })?;

  info!("Fal webhook URL: {}", server_state.fal.webhook_url);

  let apriori_job_token = InferenceJobToken::generate();

  let fal_result;

  if let Some(input_image_urls) = image_urls.as_deref() {
    info!("nano banana 2 edit image");

    let num_images = match request.num_images {
      Some(NanaBanana2MultiFunctionImageGenNumImages::One) => EnqueueNanoBanana2EditImageNumImages::One,
      Some(NanaBanana2MultiFunctionImageGenNumImages::Two) => EnqueueNanoBanana2EditImageNumImages::Two,
      Some(NanaBanana2MultiFunctionImageGenNumImages::Three) => EnqueueNanoBanana2EditImageNumImages::Three,
      Some(NanaBanana2MultiFunctionImageGenNumImages::Four) => EnqueueNanoBanana2EditImageNumImages::Four,
      None => EnqueueNanoBanana2EditImageNumImages::One,
    };

    let resolution = match request.resolution {
      Some(NanaBanana2MultiFunctionImageGenImageResolution::HalfK) => Some(EnqueueNanoBanana2EditImageResolution::HalfK),
      Some(NanaBanana2MultiFunctionImageGenImageResolution::OneK) => Some(EnqueueNanoBanana2EditImageResolution::OneK),
      Some(NanaBanana2MultiFunctionImageGenImageResolution::TwoK) => Some(EnqueueNanoBanana2EditImageResolution::TwoK),
      Some(NanaBanana2MultiFunctionImageGenImageResolution::FourK) => Some(EnqueueNanoBanana2EditImageResolution::FourK),
      None => Some(EnqueueNanoBanana2EditImageResolution::OneK),
    };

    let aspect_ratio = match request.aspect_ratio {
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::Auto) => Some(EnqueueNanoBanana2EditImageAspectRatio::Auto),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::OneByOne) => Some(EnqueueNanoBanana2EditImageAspectRatio::OneByOne),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::FiveByFour) => Some(EnqueueNanoBanana2EditImageAspectRatio::FiveByFour),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::FourByThree) => Some(EnqueueNanoBanana2EditImageAspectRatio::FourByThree),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::ThreeByTwo) => Some(EnqueueNanoBanana2EditImageAspectRatio::ThreeByTwo),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::SixteenByNine) => Some(EnqueueNanoBanana2EditImageAspectRatio::SixteenByNine),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::TwentyOneByNine) => Some(EnqueueNanoBanana2EditImageAspectRatio::TwentyOneByNine),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::FourByFive) => Some(EnqueueNanoBanana2EditImageAspectRatio::FourByFive),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::ThreeByFour) => Some(EnqueueNanoBanana2EditImageAspectRatio::ThreeByFour),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::TwoByThree) => Some(EnqueueNanoBanana2EditImageAspectRatio::TwoByThree),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::NineBySixteen) => Some(EnqueueNanoBanana2EditImageAspectRatio::NineBySixteen),
      None => Some(EnqueueNanoBanana2EditImageAspectRatio::OneByOne),
    };

    let args = EnqueueNanoBanana2EditImageArgs {
      prompt: request.prompt.as_deref().unwrap_or(""),
      image_urls: input_image_urls.to_owned(),
      num_images,
      resolution,
      aspect_ratio,
      webhook_url: &server_state.fal.webhook_url,
      api_key: &server_state.fal.api_key,
    };

    let cost = args.calculate_cost_in_cents();

    info!("Charging wallet: {}", cost);

    attempt_wallet_deduction_else_common_web_error(
      user_token,
      Some(apriori_job_token.as_str()),
      cost,
      &mut mysql_connection,
    ).await?;

    fal_result = enqueue_nano_banana_2_edit_image_webhook(args)
        .await
        .map_err(|err| {
          warn!("Error calling enqueue_nano_banana_2_edit_image_webhook: {:?}", err);
          CommonWebError::ServerError
        })?;

  } else {
    info!("nano banana 2 text-to-image");

    let num_images = match request.num_images {
      Some(NanaBanana2MultiFunctionImageGenNumImages::One) => EnqueueNanoBanana2TextToImageNumImages::One,
      Some(NanaBanana2MultiFunctionImageGenNumImages::Two) => EnqueueNanoBanana2TextToImageNumImages::Two,
      Some(NanaBanana2MultiFunctionImageGenNumImages::Three) => EnqueueNanoBanana2TextToImageNumImages::Three,
      Some(NanaBanana2MultiFunctionImageGenNumImages::Four) => EnqueueNanoBanana2TextToImageNumImages::Four,
      None => EnqueueNanoBanana2TextToImageNumImages::One,
    };

    let resolution = match request.resolution {
      Some(NanaBanana2MultiFunctionImageGenImageResolution::HalfK) => Some(EnqueueNanoBanana2TextToImageResolution::HalfK),
      Some(NanaBanana2MultiFunctionImageGenImageResolution::OneK) => Some(EnqueueNanoBanana2TextToImageResolution::OneK),
      Some(NanaBanana2MultiFunctionImageGenImageResolution::TwoK) => Some(EnqueueNanoBanana2TextToImageResolution::TwoK),
      Some(NanaBanana2MultiFunctionImageGenImageResolution::FourK) => Some(EnqueueNanoBanana2TextToImageResolution::FourK),
      None => Some(EnqueueNanoBanana2TextToImageResolution::OneK),
    };

    let aspect_ratio = match request.aspect_ratio {
      // NB: "auto" is only for edit image, not text-to-image
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::Auto) => Some(EnqueueNanoBanana2TextToImageAspectRatio::OneByOne),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::OneByOne) => Some(EnqueueNanoBanana2TextToImageAspectRatio::OneByOne),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::FiveByFour) => Some(EnqueueNanoBanana2TextToImageAspectRatio::FiveByFour),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::FourByThree) => Some(EnqueueNanoBanana2TextToImageAspectRatio::FourByThree),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::ThreeByTwo) => Some(EnqueueNanoBanana2TextToImageAspectRatio::ThreeByTwo),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::SixteenByNine) => Some(EnqueueNanoBanana2TextToImageAspectRatio::SixteenByNine),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::TwentyOneByNine) => Some(EnqueueNanoBanana2TextToImageAspectRatio::TwentyOneByNine),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::FourByFive) => Some(EnqueueNanoBanana2TextToImageAspectRatio::FourByFive),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::ThreeByFour) => Some(EnqueueNanoBanana2TextToImageAspectRatio::ThreeByFour),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::TwoByThree) => Some(EnqueueNanoBanana2TextToImageAspectRatio::TwoByThree),
      Some(NanaBanana2MultiFunctionImageGenAspectRatio::NineBySixteen) => Some(EnqueueNanoBanana2TextToImageAspectRatio::NineBySixteen),
      None => Some(EnqueueNanoBanana2TextToImageAspectRatio::OneByOne),
    };

    let args = EnqueueNanoBanana2TextToImageArgs {
      prompt: request.prompt.as_deref().unwrap_or(""),
      num_images,
      resolution,
      aspect_ratio,
      webhook_url: &server_state.fal.webhook_url,
      api_key: &server_state.fal.api_key,
    };

    let cost = args.calculate_cost_in_cents();

    info!("Charging wallet: {}", cost);

    attempt_wallet_deduction_else_common_web_error(
      user_token,
      Some(apriori_job_token.as_str()),
      cost,
      &mut mysql_connection,
    ).await?;

    fal_result = enqueue_nano_banana_2_text_to_image_webhook(args)
        .await
        .map_err(|err| {
          warn!("Error calling enqueue_nano_banana_2_text_to_image_webhook: {:?}", err);
          CommonWebError::ServerError
        })?;
  }

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

  let prompt_result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: Some(&user_token),
    maybe_model_type: Some(ModelType::NanoBanana2),
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
      None
    }
  };

  if let Some(media_tokens) = &request.image_media_tokens {
    if let Some(token) = prompt_token.as_ref() {
      let result = insert_batch_prompt_context_items(InsertBatchArgs {
        prompt_token: token.clone(),
        items: media_tokens.iter().map(|token| {
          PromptContextItem {
            media_token: token.clone(),
            context_semantic_type: PromptContextSemanticType::Imgref,
          }
        }).collect(),
        transaction: &mut transaction,
      }).await;

      if let Err(err) = result {
        warn!("Error inserting batch prompt context items: {:?}", err);
      }
    }
  }

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

  Ok(Json(NanaBanana2MultiFunctionImageGenResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
