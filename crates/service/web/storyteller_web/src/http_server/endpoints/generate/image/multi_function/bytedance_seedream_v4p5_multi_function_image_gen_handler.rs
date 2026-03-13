use std::collections::HashSet;
use std::iter::FromIterator;
use std::sync::Arc;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_image_urls_as_optional_list::lookup_image_urls_as_optional_list;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_v4p5_multi_function_image_gen::{BytedanceSeedreamV4p5MultiFunctionImageGenImageSize, BytedanceSeedreamV4p5MultiFunctionImageGenNumImages, BytedanceSeedreamV4p5MultiFunctionImageGenRequest, BytedanceSeedreamV4p5MultiFunctionImageGenResponse};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::model_type::ModelType;
use enums::common::visibility::Visibility;
use fal_client::creds::open_ai_api_key::OpenAiApiKey;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::image::edit::enqueue_bytedance_seedream_v4p5_edit_image_webhook::{enqueue_bytedance_seedream_v4p5_edit_image_webhook, EnqueueBytedanceSeedreamV4p5EditImageArgs, EnqueueBytedanceSeedreamV4p5EditImageNumImages, EnqueueBytedanceSeedreamV4p5EditImageSize};
use fal_client::requests::webhook::image::text::enqueue_bytedance_seedream_v4p5_text_to_image_webhook::{enqueue_bytedance_seedream_v4p5_text_to_image_webhook, EnqueueBytedanceSeedreamV4p5TextToImageArgs, EnqueueBytedanceSeedreamV4p5TextToImageNumImages, EnqueueBytedanceSeedreamV4p5TextToImageSize};
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
use server_environment::ServerEnvironment;
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

/// Bytedance Seedream 4.5 Multi-Function (generate + edit)
#[utoipa::path(
  post,
  tag = "Generate Images (Multi-Function)",
  path = "/v1/generate/image/multi_function/bytedance_seedream_v4p5",
  responses(
    (status = 200, description = "Success", body = BytedanceSeedreamV4p5MultiFunctionImageGenResponse),
  ),
  params(
    ("request" = BytedanceSeedreamV4p5MultiFunctionImageGenRequest, description = "Payload for Request"),
  )
)]
pub async fn bytedance_seedream_v4p5_multi_function_image_gen_handler(
  http_request: HttpRequest,
  request: Json<BytedanceSeedreamV4p5MultiFunctionImageGenRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<BytedanceSeedreamV4p5MultiFunctionImageGenResponse>, CommonWebError> {
  
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
    info!("edit image case");

    let num_images = match request.num_images {
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenNumImages::One) => EnqueueBytedanceSeedreamV4p5EditImageNumImages::One,
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenNumImages::Two) => EnqueueBytedanceSeedreamV4p5EditImageNumImages::Two,
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenNumImages::Three) => EnqueueBytedanceSeedreamV4p5EditImageNumImages::Three,
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenNumImages::Four) => EnqueueBytedanceSeedreamV4p5EditImageNumImages::Four,
      None => EnqueueBytedanceSeedreamV4p5EditImageNumImages::One, // Default to One
    };

    let image_size = match request.image_size {
      // Square
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::Square) => EnqueueBytedanceSeedreamV4p5EditImageSize::Square,
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::SquareHd) => EnqueueBytedanceSeedreamV4p5EditImageSize::SquareHd,
      // Tall
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::PortraitFourThree) => EnqueueBytedanceSeedreamV4p5EditImageSize::PortraitFourThree,
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::PortraitSixteenNine) => EnqueueBytedanceSeedreamV4p5EditImageSize::PortraitSixteenNine,
      // Wide
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::LandscapeFourThree) => EnqueueBytedanceSeedreamV4p5EditImageSize::LandscapeFourThree,
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::LandscapeSixteenNine) => EnqueueBytedanceSeedreamV4p5EditImageSize::LandscapeSixteenNine,
      // Auto
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::Auto2k) => EnqueueBytedanceSeedreamV4p5EditImageSize::Auto2k,
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::Auto4k) => EnqueueBytedanceSeedreamV4p5EditImageSize::Auto4k,
      None => EnqueueBytedanceSeedreamV4p5EditImageSize::SquareHd,
    };

    let args = EnqueueBytedanceSeedreamV4p5EditImageArgs {
      prompt: request.prompt.as_deref().unwrap_or(""),
      image_urls: input_image_urls.to_owned(),
      num_images: Some(num_images),
      image_size: Some(image_size),
      max_images: None,
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

    fal_result = enqueue_bytedance_seedream_v4p5_edit_image_webhook(args)
        .await
        .map_err(|err| {
          warn!("Error calling enqueue_bytedance_seedream_v4p5_edit_image_webhook: {:?}", err);
          CommonWebError::ServerError
        })?;

  } else {
    info!("text-to-image case");

    let num_images = match request.num_images {
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenNumImages::One) => EnqueueBytedanceSeedreamV4p5TextToImageNumImages::One,
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenNumImages::Two) => EnqueueBytedanceSeedreamV4p5TextToImageNumImages::Two,
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenNumImages::Three) => EnqueueBytedanceSeedreamV4p5TextToImageNumImages::Three,
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenNumImages::Four) => EnqueueBytedanceSeedreamV4p5TextToImageNumImages::Four,
      None => EnqueueBytedanceSeedreamV4p5TextToImageNumImages::One, // Default to One
    };

    let image_size = match request.image_size {
      // Square
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::Square) => EnqueueBytedanceSeedreamV4p5TextToImageSize::Square,
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::SquareHd) => EnqueueBytedanceSeedreamV4p5TextToImageSize::SquareHd,
      // Tall
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::PortraitFourThree) => EnqueueBytedanceSeedreamV4p5TextToImageSize::PortraitFourThree,
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::PortraitSixteenNine) => EnqueueBytedanceSeedreamV4p5TextToImageSize::PortraitSixteenNine,
      // Wide
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::LandscapeFourThree) => EnqueueBytedanceSeedreamV4p5TextToImageSize::LandscapeFourThree,
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::LandscapeSixteenNine) => EnqueueBytedanceSeedreamV4p5TextToImageSize::LandscapeSixteenNine,
      // Auto
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::Auto2k) => EnqueueBytedanceSeedreamV4p5TextToImageSize::Auto2k,
      Some(BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::Auto4k) => EnqueueBytedanceSeedreamV4p5TextToImageSize::Auto4k,
      None => EnqueueBytedanceSeedreamV4p5TextToImageSize::SquareHd,
    };

    let args = EnqueueBytedanceSeedreamV4p5TextToImageArgs {
      prompt: request.prompt.as_deref().unwrap_or(""),
      num_images: Some(num_images),
      image_size: Some(image_size),
      max_images: None,
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

    fal_result = enqueue_bytedance_seedream_v4p5_text_to_image_webhook(args)
        .await
        .map_err(|err| {
          warn!("Error calling enqueue_bytedance_seedream_v4p5_text_to_image_webhook: {:?}", err);
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

  // NB: Don't fail the job if the query fails.
  let prompt_result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: Some(&user_token),
    maybe_model_type: Some(ModelType::Seedream4p5),
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
        // NB: Fail open.
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

  Ok(Json(BytedanceSeedreamV4p5MultiFunctionImageGenResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
