use std::sync::Arc;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoint_helpers::refund_wallet_after_api_failure::refund_wallet_after_api_failure;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_image_urls_as_optional_list::lookup_image_urls_as_optional_list;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::image::angle::qwen_edit_2511_edit_image_angle::{QwenEdit2511EditImageAngleImageSize, QwenEdit2511EditImageAngleNumImages, QwenEdit2511EditImageAngleRequest, QwenEdit2511EditImageAngleResponse};
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::model_type::ModelType;
use enums::common::visibility::Visibility;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::image::angle::enqueue_qwen_edit_2511_edit_image_angle_webhook::{enqueue_qwen_edit_2511_edit_image_angle_webhook, EnqueueQwenEdit2511EditImageAngleArgs, EnqueueQwenEdit2511AngleNumImages, EnqueueQwenEdit2511AngleImageSize};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue_with_apriori_job_token::{insert_generic_inference_job_for_fal_queue_with_apriori_job_token, InsertGenericInferenceForFalWithAprioriJobTokenArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use sqlx::Acquire;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

/// Qwen Edit 2511 - Edit Image Angle
#[utoipa::path(
  post,
  tag = "Generate Images (Angle)",
  path = "/v1/generate/image/angle/qwen_edit_2511",
  responses(
    (status = 200, description = "Success", body = QwenEdit2511EditImageAngleResponse),
  ),
  params(
    ("request" = QwenEdit2511EditImageAngleRequest, description = "Payload for Request"),
  )
)]
pub async fn qwen_edit_2511_edit_image_angle_handler(
  http_request: HttpRequest,
  request: Json<QwenEdit2511EditImageAngleRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<QwenEdit2511EditImageAngleResponse>, CommonWebError> {

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

  let media_tokens = vec![request.image_media_token.clone()];

  let image_urls = lookup_image_urls_as_optional_list(
    &http_request,
    &mut mysql_connection,
    server_state.server_environment,
    &media_tokens,
  ).await?
      .ok_or_else(|| {
        warn!("No image URLs found for media token");
        CommonWebError::BadInputWithSimpleMessage("Image media token not found".to_string())
      })?;

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
      })?;

  info!("Fal webhook URL: {}", server_state.fal.webhook_url);

  let apriori_job_token = InferenceJobToken::generate();

  let num_images = request.num_images.map(|n| match n {
    QwenEdit2511EditImageAngleNumImages::One => EnqueueQwenEdit2511AngleNumImages::One,
    QwenEdit2511EditImageAngleNumImages::Two => EnqueueQwenEdit2511AngleNumImages::Two,
    QwenEdit2511EditImageAngleNumImages::Three => EnqueueQwenEdit2511AngleNumImages::Three,
    QwenEdit2511EditImageAngleNumImages::Four => EnqueueQwenEdit2511AngleNumImages::Four,
  });

  let image_size = request.image_size.map(|s| match s {
    QwenEdit2511EditImageAngleImageSize::Square => EnqueueQwenEdit2511AngleImageSize::Square,
    QwenEdit2511EditImageAngleImageSize::SquareHd => EnqueueQwenEdit2511AngleImageSize::SquareHd,
    QwenEdit2511EditImageAngleImageSize::PortraitFourThree => EnqueueQwenEdit2511AngleImageSize::PortraitFourThree,
    QwenEdit2511EditImageAngleImageSize::PortraitSixteenNine => EnqueueQwenEdit2511AngleImageSize::PortraitSixteenNine,
    QwenEdit2511EditImageAngleImageSize::LandscapeFourThree => EnqueueQwenEdit2511AngleImageSize::LandscapeFourThree,
    QwenEdit2511EditImageAngleImageSize::LandscapeSixteenNine => EnqueueQwenEdit2511AngleImageSize::LandscapeSixteenNine,
  });

  let args = EnqueueQwenEdit2511EditImageAngleArgs {
    image_urls,
    horizontal_angle: request.horizontal_angle,
    vertical_angle: request.vertical_angle,
    zoom: request.zoom,
    additional_prompt: request.additional_prompt.as_deref(),
    num_images,
    image_size,
    lora_scale: None,
    guidance_scale: None,
    num_inference_steps: None,
    webhook_url: &server_state.fal.webhook_url,
    api_key: &server_state.fal.api_key,
  };

  let cost = args.calculate_cost_in_cents();

  info!("Charging wallet: {}", cost);

  let wallet_deduction = attempt_wallet_deduction_else_common_web_error(
    user_token,
    Some(apriori_job_token.as_str()),
    cost,
    &mut mysql_connection,
  ).await?;

  let fal_result = match enqueue_qwen_edit_2511_edit_image_angle_webhook(args).await {
    Ok(result) => result,
    Err(err) => {
      warn!("Error calling enqueue_qwen_edit_2511_edit_image_angle_webhook: {:?}", err);
      refund_wallet_after_api_failure(&wallet_deduction.ledger_entry_token, &mut mysql_connection).await?;
      return Err(CommonWebError::ServerError);
    }
  };

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
    maybe_model_type: Some(ModelType::QwenEdit2511Angles),
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.additional_prompt.as_deref(),
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

  if let Some(token) = prompt_token.as_ref() {
    let result = insert_batch_prompt_context_items(InsertBatchArgs {
      prompt_token: token.clone(),
      items: media_tokens.iter().map(|token| {
        PromptContextItem {
          media_token: token.clone(),
          context_semantic_type: PromptContextSemanticType::Imgsrc,
        }
      }).collect(),
      transaction: &mut transaction,
    }).await;

    if let Err(err) = result {
      warn!("Error inserting batch prompt context items: {:?}", err);
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

  Ok(Json(QwenEdit2511EditImageAngleResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
