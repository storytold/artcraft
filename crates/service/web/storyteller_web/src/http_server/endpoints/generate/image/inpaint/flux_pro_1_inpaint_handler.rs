use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::image::inpaint::flux_pro_1_inpaint_image::{FluxPro1InpaintImageNumImages, FluxPro1InpaintImageRequest, FluxPro1InpaintImageResponse};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::visibility::Visibility;
use fal_client::creds::open_ai_api_key::OpenAiApiKey;
use fal_client::requests::webhook::image::infill::enqueue_flux_pro_1_infill_webhook::{enqueue_flux_pro_1_infill_webhook, FluxPro1InfillArgs, FluxPro1InfillNumImages};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::insert_generic_inference_job_for_fal_queue;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::InsertGenericInferenceForFalArgs;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::{batch_get_media_files_by_tokens, batch_get_media_files_by_tokens_with_connection};
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use sqlx::Acquire;
use utoipa::ToSchema;

/// Flux Pro-1 Inpainting
#[utoipa::path(
  post,
  tag = "Generate Images (Inpaint)",
  path = "/v1/generate/image/inpaint/flux_pro_1",
  responses(
    (status = 200, description = "Success", body = FluxPro1InpaintImageResponse),
  ),
  params(
    ("request" = FluxPro1InpaintImageRequest, description = "Payload for Request"),
  )
)]
pub async fn flux_pro_1_inpaint_image_handler(
  http_request: HttpRequest,
  request: Json<FluxPro1InpaintImageRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<FluxPro1InpaintImageResponse>, CommonWebError> {

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

  const CAN_SEE_DELETED: bool = false;

  let media_tokens = vec![
    request.image_media_token.clone(),
    request.mask_media_token.clone(),
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

  if media_files.len() != media_tokens.len() {
    warn!("Wrong number of media files returned for tokens: {} found for {} tokens", media_files.len(), media_tokens.len());
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("Not all media files could be found. Media files found: {}, tokens provided: {}",
        media_files.len(), media_tokens.len())));
  }

  let media_domain = get_media_domain(&http_request);

  let image_media_file = media_files.iter()
      .find(|file| file.token == request.image_media_token)
      .ok_or_else(|| {
        warn!("Image media file not found for token: {}", request.image_media_token);
        CommonWebError::BadInputWithSimpleMessage("Image media file not found".to_string())
      })?;

  let mask_media_file = media_files.iter()
      .find(|file| file.token == request.mask_media_token)
      .ok_or_else(|| {
        warn!("Mask media file not found for token: {}", request.mask_media_token);
        CommonWebError::BadInputWithSimpleMessage("Mask media file not found".to_string())
      })?;

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

  let mask_image_url = {
    let public_bucket_path = MediaFileBucketPath::from_object_hash(
      &mask_media_file.public_bucket_directory_hash,
      mask_media_file.maybe_public_bucket_prefix.as_deref(),
      mask_media_file.maybe_public_bucket_extension.as_deref());

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

  let num_images = match request.num_images {
    Some(FluxPro1InpaintImageNumImages::One) => FluxPro1InfillNumImages::One,
    Some(FluxPro1InpaintImageNumImages::Two) => FluxPro1InfillNumImages::Two,
    Some(FluxPro1InpaintImageNumImages::Three) => FluxPro1InfillNumImages::Three,
    Some(FluxPro1InpaintImageNumImages::Four) => FluxPro1InfillNumImages::Four,
    None => FluxPro1InfillNumImages::One, // Default to One
  };

  let args = FluxPro1InfillArgs {
    prompt: request.prompt.as_deref().unwrap_or(""),
    image_url: image_url,
    mask_url: mask_image_url,
    num_images,
    webhook_url: &server_state.fal.webhook_url,
    api_key: &server_state.fal.api_key,
  };

  let fal_result = enqueue_flux_pro_1_infill_webhook(args)
      .await
      .map_err(|err| {
        warn!("Error calling enqueue_flux_pro_1_infill_webhook: {:?}", err);
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
    // TODO(bt,2025-07-31): Should we have an "inpaint" specific variant?
    //  Depends on how we want to model provider / feature matrices, routing, and results going forward.
    maybe_model_type: Some(CommonModelType::FluxPro1), 
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

  if let Some(token) = prompt_token.as_ref() {
    let result = insert_batch_prompt_context_items(InsertBatchArgs {
      prompt_token: token.clone(),
      items: vec![
        PromptContextItem {
          media_token: image_media_file.token.clone(),
          context_semantic_type: PromptContextSemanticType::Imgsrc,
        },
        PromptContextItem {
          media_token: mask_media_file.token.clone(),
          context_semantic_type: PromptContextSemanticType::Imgmask,
        },
      ],
      transaction: &mut transaction,
    }).await;

    if let Err(err) = result {
      // NB: Fail open.
      warn!("Error inserting batch prompt context items: {:?}", err);
    }
  }

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

  Ok(Json(FluxPro1InpaintImageResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
