use std::collections::{HashMap, HashSet};
use std::iter::FromIterator;
use std::sync::Arc;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_image_urls_as_map::lookup_image_urls_as_map;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::image::multi_function::gpt_image_1p5_multi_function_image_gen::{GptImage1p5MultiFunctionImageGenBackground, GptImage1p5MultiFunctionImageGenInputFidelity, GptImage1p5MultiFunctionImageGenNumImages, GptImage1p5MultiFunctionImageGenQuality, GptImage1p5MultiFunctionImageGenRequest, GptImage1p5MultiFunctionImageGenResponse, GptImage1p5MultiFunctionImageGenSize};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::payments_namespace::PaymentsNamespace;
use enums::common::stripe_subscription_status::StripeSubscriptionStatus;
use enums::common::visibility::Visibility;
use fal_client::creds::open_ai_api_key::OpenAiApiKey;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::image::edit::enqueue_gpt_image_1p5_edit_image_webhook::{enqueue_gpt_image_1p5_image_edit_webhook, EnqueueGptImage1p5EditImageArgs, EnqueueGptImage1p5EditImageBackground, EnqueueGptImage1p5EditImageInputFidelity, EnqueueGptImage1p5EditImageNumImages, EnqueueGptImage1p5EditImageQuality, EnqueueGptImage1p5EditImageSize};
use fal_client::requests::webhook::image::text::enqueue_gpt_image_1p5_text_to_image_webhook::{enqueue_gpt_image_1p5_text_to_image_webhook, EnqueueGptImage1p5TextToImageArgs, EnqueueGptImage1p5TextToImageBackground, EnqueueGptImage1p5TextToImageNumImages, EnqueueGptImage1p5TextToImageQuality, EnqueueGptImage1p5TextToImageSize};
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
use mysql_queries::queries::users::user_subscriptions::find_subscription_for_owner_user::find_subscription_for_owner_user_using_connection;
use server_environment::ServerEnvironment;
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

/// Gpt Image 1.5 Multi-Function (generate + edit + inpaint)
#[utoipa::path(
  post,
  tag = "Generate Images (Multi-Function)",
  path = "/v1/generate/image/multi_function/gpt_image_1p5",
  responses(
    (status = 200, description = "Success", body = GptImage1p5MultiFunctionImageGenResponse),
  ),
  params(
    ("request" = GptImage1p5MultiFunctionImageGenRequest, description = "Payload for Request"),
  )
)]
pub async fn gpt_image_1p5_multi_function_image_gen_handler(
  http_request: HttpRequest,
  request: Json<GptImage1p5MultiFunctionImageGenRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GptImage1p5MultiFunctionImageGenResponse>, CommonWebError> {
  
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

  let mut query_media_tokens = None;

  if let Some(media_tokens) = request.image_media_tokens.as_ref() {
    if !media_tokens.is_empty() {
      let mut tokens = Vec::new();
      tokens.extend(media_tokens.iter().map(|token| token.to_owned()));

      if let Some(mask_media_token) = request.mask_image_token.as_ref() {
        // NB: Masks are only relevant when this is an image editing exercise.
        tokens.push(mask_media_token.to_owned());
      }

      query_media_tokens = Some(tokens);
    }
  }

  let image_urls_by_token = match query_media_tokens {
    None => HashMap::new(),
    Some(media_tokens) => {
      info!("Looking up image media tokens: {:?}", media_tokens);
      lookup_image_urls_as_map(
        &http_request,
        &mut mysql_connection,
        server_state.server_environment,
        &media_tokens,
      ).await?
    }
  };

  let maybe_image_urls = match request.image_media_tokens.as_ref() {
    None => None,
    Some(tokens) => {
      let urls = tokens.iter()
          .filter_map(|token| image_urls_by_token.get(token))
          .map(|url| url.to_string())
          .collect::<Vec<_>>();
      Some(urls)
    }
  };

  let maybe_mask_url = match request.mask_image_token.as_ref() {
    None => None,
    Some(token) => {
      image_urls_by_token.get(&token).map(|url| url.to_string())
    }
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

  if let Some(input_image_urls) = maybe_image_urls.as_deref() {
    info!("gpt image 1.5 edit image");

    let mut num_images = match request.num_images {
      Some(GptImage1p5MultiFunctionImageGenNumImages::One) => EnqueueGptImage1p5EditImageNumImages::One,
      Some(GptImage1p5MultiFunctionImageGenNumImages::Two) => EnqueueGptImage1p5EditImageNumImages::Two,
      Some(GptImage1p5MultiFunctionImageGenNumImages::Three) => EnqueueGptImage1p5EditImageNumImages::Three,
      Some(GptImage1p5MultiFunctionImageGenNumImages::Four) => EnqueueGptImage1p5EditImageNumImages::Four,
      None => EnqueueGptImage1p5EditImageNumImages::One, // Default to One
    };

    let image_size = match request.image_size {
      Some(GptImage1p5MultiFunctionImageGenSize::Square) => EnqueueGptImage1p5EditImageSize::Square,
      Some(GptImage1p5MultiFunctionImageGenSize::Wide) => EnqueueGptImage1p5EditImageSize::Wide,
      Some(GptImage1p5MultiFunctionImageGenSize::Tall) => EnqueueGptImage1p5EditImageSize::Tall,
      None => EnqueueGptImage1p5EditImageSize::Square,
    };

    let background = match request.background {
      Some(GptImage1p5MultiFunctionImageGenBackground::Auto) => EnqueueGptImage1p5EditImageBackground::Auto,
      Some(GptImage1p5MultiFunctionImageGenBackground::Transparent) => EnqueueGptImage1p5EditImageBackground::Transparent,
      Some(GptImage1p5MultiFunctionImageGenBackground::Opaque) => EnqueueGptImage1p5EditImageBackground::Opaque,
      None => EnqueueGptImage1p5EditImageBackground::Auto,
    };

    let quality = match request.quality {
      Some(GptImage1p5MultiFunctionImageGenQuality::Low) => EnqueueGptImage1p5EditImageQuality::Low,
      Some(GptImage1p5MultiFunctionImageGenQuality::Medium) => EnqueueGptImage1p5EditImageQuality::Medium,
      Some(GptImage1p5MultiFunctionImageGenQuality::High) => EnqueueGptImage1p5EditImageQuality::High,
      None => EnqueueGptImage1p5EditImageQuality::High,
    };

    let input_fidelity = match request.input_fidelity {
      Some(GptImage1p5MultiFunctionImageGenInputFidelity::Low) => EnqueueGptImage1p5EditImageInputFidelity::Low,
      Some(GptImage1p5MultiFunctionImageGenInputFidelity::High) => EnqueueGptImage1p5EditImageInputFidelity::High,
      None => EnqueueGptImage1p5EditImageInputFidelity::High,
    };

    if downgrade_for_free_user {
      num_images = EnqueueGptImage1p5EditImageNumImages::One;
    }

    let args = EnqueueGptImage1p5EditImageArgs {
      prompt: request.prompt.as_deref().unwrap_or(""),
      image_urls: input_image_urls.to_owned(),
      num_images,
      mask_image_url: maybe_mask_url,
      image_size: Some(image_size),
      background: Some(background),
      quality: Some(quality),
      input_fidelity: Some(input_fidelity),
      output_format: None,
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

    fal_result = enqueue_gpt_image_1p5_image_edit_webhook(args)
        .await
        .map_err(|err| {
          warn!("Error calling enqueue_gpt_image_1p5_image_edit_webhook: {:?}", err);
          CommonWebError::ServerError
        })?;

  } else {
    info!("gpt image 1.5 text-to-image");

    let mut num_images = match request.num_images {
      Some(GptImage1p5MultiFunctionImageGenNumImages::One) => EnqueueGptImage1p5TextToImageNumImages::One,
      Some(GptImage1p5MultiFunctionImageGenNumImages::Two) => EnqueueGptImage1p5TextToImageNumImages::Two,
      Some(GptImage1p5MultiFunctionImageGenNumImages::Three) => EnqueueGptImage1p5TextToImageNumImages::Three,
      Some(GptImage1p5MultiFunctionImageGenNumImages::Four) => EnqueueGptImage1p5TextToImageNumImages::Four,
      None => EnqueueGptImage1p5TextToImageNumImages::One, // Default to One
    };

    let image_size = match request.image_size {
      Some(GptImage1p5MultiFunctionImageGenSize::Square) => EnqueueGptImage1p5TextToImageSize::Square,
      Some(GptImage1p5MultiFunctionImageGenSize::Wide) => EnqueueGptImage1p5TextToImageSize::Wide,
      Some(GptImage1p5MultiFunctionImageGenSize::Tall) => EnqueueGptImage1p5TextToImageSize::Tall,
      None => EnqueueGptImage1p5TextToImageSize::Square,
    };

    let background = match request.background {
      Some(GptImage1p5MultiFunctionImageGenBackground::Auto) => EnqueueGptImage1p5TextToImageBackground::Auto,
      Some(GptImage1p5MultiFunctionImageGenBackground::Transparent) => EnqueueGptImage1p5TextToImageBackground::Transparent,
      Some(GptImage1p5MultiFunctionImageGenBackground::Opaque) => EnqueueGptImage1p5TextToImageBackground::Opaque,
      None => EnqueueGptImage1p5TextToImageBackground::Auto,
    };

    let quality = match request.quality {
      Some(GptImage1p5MultiFunctionImageGenQuality::Low) => EnqueueGptImage1p5TextToImageQuality::Low,
      Some(GptImage1p5MultiFunctionImageGenQuality::Medium) => EnqueueGptImage1p5TextToImageQuality::Medium,
      Some(GptImage1p5MultiFunctionImageGenQuality::High) => EnqueueGptImage1p5TextToImageQuality::High,
      None => EnqueueGptImage1p5TextToImageQuality::High,
    };

    if downgrade_for_free_user {
      num_images = EnqueueGptImage1p5TextToImageNumImages::One;
    }

    let args = EnqueueGptImage1p5TextToImageArgs {
      prompt: request.prompt.as_deref().unwrap_or(""),
      num_images,
      output_format: None,
      image_size: Some(image_size),
      background: Some(background),
      quality: Some(quality),
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

    fal_result = enqueue_gpt_image_1p5_text_to_image_webhook(args)
        .await
        .map_err(|err| {
          warn!("Error calling enqueue_gpt_image_1p5_text_to_image_webhook: {:?}", err);
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
    maybe_model_type: Some(CommonModelType::GptImage1p5),
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

  Ok(Json(GptImage1p5MultiFunctionImageGenResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
