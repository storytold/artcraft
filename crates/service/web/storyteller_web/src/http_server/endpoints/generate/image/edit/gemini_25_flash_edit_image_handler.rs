use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::image::edit::gemini_25_flash_edit_image::{Gemini25FlashEditImageNumImages, Gemini25FlashEditImageRequest, Gemini25FlashEditImageResponse};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::payments_namespace::PaymentsNamespace;
use enums::common::stripe_subscription_status::StripeSubscriptionStatus;
use enums::common::visibility::Visibility;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use fal_client::creds::open_ai_api_key::OpenAiApiKey;
use fal_client::requests::webhook::image::edit::enqueue_gemini_25_flash_edit_webhook::{enqueue_gemini_25_flash_edit_webhook, Gemini25FlashEditArgs, Gemini25FlashEditNumImages};
use fal_client::requests::webhook::image::edit::enqueue_gpt_image_1_edit_image_webhook::enqueue_gpt_image_1_edit_image_webhook;
use fal_client::requests::webhook::image::edit::enqueue_gpt_image_1_edit_image_webhook::GptEditImageNumImages;
use fal_client::requests::webhook::image::edit::enqueue_gpt_image_1_edit_image_webhook::{GptEditImageByokArgs, GptEditImageQuality, GptEditImageSize};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::insert_generic_inference_job_for_fal_queue;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::InsertGenericInferenceForFalArgs;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::{batch_get_media_files_by_tokens, batch_get_media_files_by_tokens_with_connection};
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use mysql_queries::queries::users::user_subscriptions::find_subscription_for_owner_user::find_subscription_for_owner_user_using_connection;
use sqlx::Acquire;
use utoipa::ToSchema;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue_with_apriori_job_token::{insert_generic_inference_job_for_fal_queue_with_apriori_job_token, InsertGenericInferenceForFalWithAprioriJobTokenArgs};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;

/// Gemini 2.5 Flash Image Editing
#[utoipa::path(
  post,
  tag = "Generate Images (Edit)",
  path = "/v1/generate/image/edit/gemini_25_flash",
  responses(
    (status = 200, description = "Success", body = Gemini25FlashEditImageResponse),
  ),
  params(
    ("request" = Gemini25FlashEditImageRequest, description = "Payload for Request"),
  )
)]
#[deprecated(note="use `nano_banana_multi_function_image_gen_handler` instead")]
pub async fn gemini_25_flash_edit_image_handler(
  http_request: HttpRequest,
  request: Json<Gemini25FlashEditImageRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<Gemini25FlashEditImageResponse>, CommonWebError> {
  
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

  let mut downgrade_for_free_user = true;

  let result = find_subscription_for_owner_user_using_connection(
    user_token,
    PaymentsNamespace::Artcraft,
    &mut mysql_connection,
  ).await;

  if let Ok(Some(subscription)) = result {
    info!("User {:?} has subscription: {:?} (stripe customer: {:?}, status: {:?})",
      user_token,
      subscription.token,
      subscription.stripe_customer_id,
      subscription.stripe_subscription_status);
    // NB: Failing open means subscribers might get fewer results, but they're free right now.
    if subscription.stripe_subscription_status == StripeSubscriptionStatus::Active {
      downgrade_for_free_user = false;
    }
  }

  info!("downgrade_for_free_user: {}", downgrade_for_free_user);

  const CAN_SEE_DELETED: bool = false;
  
  let tokens = match request.image_media_tokens.as_ref() {
    Some(tokens) => tokens,
    None => {
      warn!("No image media tokens provided");
      return Err(CommonWebError::BadInputWithSimpleMessage("No image media tokens provided".to_string()));
    }
  };
  
  let result = batch_get_media_files_by_tokens_with_connection(
    &mut mysql_connection,
    tokens,
    CAN_SEE_DELETED,
  ).await;
  
  let media_files = match result {
    Ok(files) => files,
    Err(err) => {
      error!("Error getting media files by tokens: {:?}", err);
      return Err(CommonWebError::ServerError);
    }
  };
  
  if media_files.len() != tokens.len() {
    warn!("Wrong number of media files returned for tokens: {} found for {} tokens", media_files.len(), tokens.len());
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("Not all media files could be found. Media files found: {}, tokens provided: {}",
        media_files.len(), tokens.len())));
  }

  let media_domain = get_media_domain(&http_request);
  
  let image_urls = media_files.iter()
      .map(|file| {
        let public_bucket_path = MediaFileBucketPath::from_object_hash(
          &file.public_bucket_directory_hash,
          file.maybe_public_bucket_prefix.as_deref(),
          file.maybe_public_bucket_extension.as_deref());
        
        let media_links = MediaLinksBuilder::from_media_path_and_env(
          media_domain, 
          server_state.server_environment, 
          &public_bucket_path);
        
        media_links.cdn_url.to_string()
      })
      .collect::<Vec<_>>();

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
      })?;

  info!("Fal webhook URL: {}", server_state.fal.webhook_url);

  let mut num_images = match request.num_images {
    Some(Gemini25FlashEditImageNumImages::One) => Gemini25FlashEditNumImages::One,
    Some(Gemini25FlashEditImageNumImages::Two) => Gemini25FlashEditNumImages::Two,
    Some(Gemini25FlashEditImageNumImages::Three) => Gemini25FlashEditNumImages::Three,
    Some(Gemini25FlashEditImageNumImages::Four) => Gemini25FlashEditNumImages::Four,
    None => Gemini25FlashEditNumImages::One, // Default to One
  };

  if downgrade_for_free_user {
    num_images = Gemini25FlashEditNumImages::One;
  }

  let args = Gemini25FlashEditArgs {
    image_urls,
    prompt: request.prompt.as_deref().unwrap_or(""),
    webhook_url: &server_state.fal.webhook_url,
    api_key: &server_state.fal.api_key,
    num_images,
    aspect_ratio: None, // TODO
  };

  let apriori_job_token = InferenceJobToken::generate();

  //let cost = args.calculate_cost_in_cents();
  //info!("Charging wallet: {}", cost);
  //attempt_wallet_deduction_else_common_web_error(
  //  user_token,
  //  Some(apriori_job_token.as_str()),
  //  cost,
  //  &mut mysql_connection,
  //).await?;

  let fal_result = enqueue_gemini_25_flash_edit_webhook(args)
      .await
      .map_err(|err| {
        warn!("Error calling enqueue_gpt_image_1_edit_image_webhook: {:?}", err);
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
    Some(Gemini25FlashEditImageNumImages::One) => Some(1),
    Some(Gemini25FlashEditImageNumImages::Two) => Some(2),
    Some(Gemini25FlashEditImageNumImages::Three) => Some(3),
    Some(Gemini25FlashEditImageNumImages::Four) => Some(4),
    None => None,
  };

  let prompt_result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: Some(&user_token),
    maybe_model_type: Some(CommonModelType::Gemini25Flash),
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: None,
    maybe_other_args: None,
    maybe_generation_mode: Some(CommonGenerationMode::Edit), // TODO: This endpoint only supports "edit" (and not "text") for now
    maybe_aspect_ratio: None,
    maybe_resolution: None,
    maybe_batch_count,
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
  
  if let Some(token) = prompt_token.as_ref() {
    let result = insert_batch_prompt_context_items(InsertBatchArgs {
      prompt_token: token.clone(),
      items: media_files.iter().map(|media_file| {
        PromptContextItem {
          media_token: media_file.token.clone(),
          context_semantic_type: PromptContextSemanticType::Imgref,
        }
      }).collect(),
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

  Ok(Json(Gemini25FlashEditImageResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
