use std::sync::Arc;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::image::edit::qwen_edit_image::{QwenEditImageAcceleration, QwenEditImageNumImages, QwenEditImageRequest, QwenEditImageResponse};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::visibility::Visibility;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use fal_client::creds::open_ai_api_key::OpenAiApiKey;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::image::edit::enqueue_qwen_image_edit_webhook::{enqueue_qwen_image_edit_webhook, QwenImageEditArgs, QwenImageEditNumImages};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::insert_generic_inference_job_for_fal_queue;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::InsertGenericInferenceForFalArgs;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue_with_apriori_job_token::{insert_generic_inference_job_for_fal_queue_with_apriori_job_token, InsertGenericInferenceForFalWithAprioriJobTokenArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::{batch_get_media_files_by_tokens, batch_get_media_files_by_tokens_with_connection};
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use sqlx::Acquire;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use utoipa::ToSchema;

/// Qwen Image Editing
#[utoipa::path(
  post,
  tag = "Generate Images (Edit)",
  path = "/v1/generate/image/edit/qwen",
  responses(
    (status = 200, description = "Success", body = QwenEditImageResponse),
  ),
  params(
    ("request" = QwenEditImageRequest, description = "Payload for Request"),
  )
)]
pub async fn qwen_edit_image_handler(
  http_request: HttpRequest,
  request: Json<QwenEditImageRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<QwenEditImageResponse>, CommonWebError> {
  
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

  const CAN_SEE_DELETED: bool = false;

  // TODO: Maybe don't use the batch endpoint.
  let media_tokens = vec![
    request.image_media_token.clone(),
  ];

  let result = batch_get_media_files_by_tokens_with_connection(
    &mut mysql_connection,
    &media_tokens,
    CAN_SEE_DELETED,
  ).await;

  let media_files = match result {
    Ok(files) => files,
    Err(err) => {
      error!("Error getting media files by tokens: {:?}", err);
      return Err(CommonWebError::ServerError);
    }
  };

  let image_media_file = match media_files.first() {
    Some(file) => file,
    None => {
      warn!("No media files found for tokens: {:?}", media_tokens);
      return Err(CommonWebError::BadInputWithSimpleMessage(
        "No media files found for provided tokens".to_string()));
    }
  };

  let media_domain = get_media_domain(&http_request);
  
  let image_url = { 
    let public_bucket_path = MediaFileBucketPath::from_object_hash(
      &image_media_file.public_bucket_directory_hash, 
      image_media_file.maybe_public_bucket_prefix.as_deref(), 
      image_media_file.maybe_public_bucket_extension.as_deref());
      
      let media_links = MediaLinksBuilder::from_media_path_and_env(
        media_domain, 
        server_state.server_environment, 
        &public_bucket_path);
      
      media_links.cdn_url.to_string()
  };

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
      })?;

  info!("Fal webhook URL: {}", server_state.fal.webhook_url);

  let apriori_job_token = InferenceJobToken::generate();

  let num_images = match request.num_images {
    Some(QwenEditImageNumImages::One) => QwenImageEditNumImages::One,
    Some(QwenEditImageNumImages::Two) => QwenImageEditNumImages::Two,
    Some(QwenEditImageNumImages::Three) => QwenImageEditNumImages::Three,
    Some(QwenEditImageNumImages::Four) => QwenImageEditNumImages::Four,
    None => QwenImageEditNumImages::One, // Default to One
  };
  
  let acceleration = request.acceleration.as_ref().map(|accel| match accel {
    QwenEditImageAcceleration::None => "none",
    QwenEditImageAcceleration::Regular => "regular",
    QwenEditImageAcceleration::High => "high",
  });
  
  let args = QwenImageEditArgs {
    prompt: request.prompt.as_deref().unwrap_or(""),
    webhook_url: &server_state.fal.webhook_url,
    api_key: &server_state.fal.api_key,
    image_url: image_url,
    num_images: Some(num_images),
    image_size: None,
    negative_prompt: request.negative_prompt.clone(),
    acceleration: acceleration.map(|s| s.to_string()),
  };

  let cost = args.calculate_cost_in_cents();

  info!("Charging wallet: {}", cost);

  attempt_wallet_deduction_else_common_web_error(
    user_token,
    Some(apriori_job_token.as_str()),
    cost,
    &mut mysql_connection,
  ).await?;

  let fal_result = enqueue_qwen_image_edit_webhook(args)
      .await
      .map_err(|err| {
        warn!("Error calling enqueue_qwen_image_edit_webhook: {:?}", err);
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
  let maybe_batch_count: Option<u8> = match request.num_images {
    Some(QwenEditImageNumImages::One) => Some(1),
    Some(QwenEditImageNumImages::Two) => Some(2),
    Some(QwenEditImageNumImages::Three) => Some(3),
    Some(QwenEditImageNumImages::Four) => Some(4),
    None => None,
  };

  let prompt_result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: Some(&user_token),
    maybe_model_type: Some(CommonModelType::Qwen),
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: None,
    maybe_other_args: None,
    maybe_generation_mode: Some(CommonGenerationMode::Edit), // TODO: This endpoint only supports "edit" (and not "text") for now
    maybe_aspect_ratio: None,
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
  
  if let Some(token) = prompt_token.as_ref() {
    let result = insert_batch_prompt_context_items(InsertBatchArgs {
      prompt_token: token.clone(),
      items: vec![
        PromptContextItem {
          media_token: image_media_file.token.clone(),
          context_semantic_type: PromptContextSemanticType::Imgsrc,
        }
      ],
      transaction: &mut transaction,
    }).await;
    
    if let Err(err) = result {
      // NB: Fail open.
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
    maybe_frontend_failure_category: None,
    maybe_failure_reason: None,
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

  Ok(Json(QwenEditImageResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
