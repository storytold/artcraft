use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::object::generate_hunyuan_2_1_image_to_3d::GenerateHunyuan21ImageTo3dRequest;
use artcraft_api_defs::generate::object::generate_hunyuan_2_1_image_to_3d::GenerateHunyuan21ImageTo3dResponse;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::common::visibility::Visibility;
use fal_client::requests::webhook::object::enqueue_hunyuan_3d_21_image_to_3d_webhook::enqueue_hunyuan_3d_2_1_image_to_3d_webhook;
use fal_client::requests::webhook::object::enqueue_hunyuan_3d_21_image_to_3d_webhook::Hunyuan3d21Args;
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use sqlx::Acquire;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::insert_generic_inference_job_for_fal_queue;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::InsertGenericInferenceForFalArgs;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::get::get_media_file::{get_media_file, get_media_file_with_connection};
use utoipa::ToSchema;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation_provider::GenerationProvider;
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};

/// Hunyuan 2.1 Image to 3D
#[utoipa::path(
  post,
  tag = "Generate Objects",
  path = "/v1/generate/object/hunyuan_2.1_image_to_3d",
  responses(
    (status = 200, description = "Success", body = GenerateHunyuan21ImageTo3dResponse),
  ),
  params(
    ("request" = GenerateHunyuan21ImageTo3dRequest, description = "Payload for Request"),
  )
)]
pub async fn generate_hunyuan_2_1_image_to_3d_handler(
  http_request: HttpRequest,
  request: Json<GenerateHunyuan21ImageTo3dRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GenerateHunyuan21ImageTo3dResponse>, CommonWebError> {
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

  let media_file_token = match &request.media_file_token {
    Some(token) => token,
    None => {
      warn!("No media file token provided");
      return Err(CommonWebError::BadInputWithSimpleMessage("No media file token provided".to_string()));
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
  
  let media_file_lookup_result = get_media_file_with_connection(
    media_file_token,
    IS_MOD,
    &mut mysql_connection,
  ).await;

  let media_file = match media_file_lookup_result {
    Ok(Some(media_file)) => media_file,
    Ok(None) => {
      warn!("MediaFile not found: {:?}", media_file_token);
      return Err(CommonWebError::NotFound);
    },
    Err(err) => {
      warn!("Error looking up media_file: {:?}", err);
      return Err(CommonWebError::ServerError);
    }
  };

  if !media_file.media_type.is_jpg_or_png_or_legacy_image() {
    return Err(CommonWebError::BadInputWithSimpleMessage("Media file must be a JPG or PNG image".to_string()));
  }
  
  let media_domain = get_media_domain(&http_request);
  
  let bucket_path = MediaFileBucketPath::from_object_hash(
    &media_file.public_bucket_directory_hash,
    media_file.maybe_public_bucket_prefix.as_deref(),
    media_file.maybe_public_bucket_extension.as_deref());
  
  let media_links = MediaLinksBuilder::from_media_path_and_env(
    media_domain, 
    server_state.server_environment, 
    &bucket_path);
  
  info!("Fal webhook URL: {}", server_state.fal.webhook_url);
  
  let args = Hunyuan3d21Args {
    image_url: media_links.cdn_url,
    webhook_url: &server_state.fal.webhook_url,
    api_key: &server_state.fal.api_key,
  };

  let fal_result = enqueue_hunyuan_3d_2_1_image_to_3d_webhook(args)
      .await
      .map_err(|err| {
        warn!("Error calling enqueue_hunyuan_3d_2_1_image_to_3d_webhook: {:?}", err);
        CommonWebError::ServerError
      })?;

  let external_job_id = fal_result.request_id
      .ok_or_else(|| {
        warn!("Fal request_id is None");
        CommonWebError::ServerError
      })?;
  
  info!("Fal request_id: {}", external_job_id);
  
  let ip_address = get_request_ip(&http_request);

  let mut transaction = mysql_connection.begin().await.map_err(|err| {
    error!("Error starting MySQL transaction: {:?}", err);
    CommonWebError::ServerError
  })?;

  // Insert prompt record if we have a prompt
  let prompt_result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: maybe_user_session.as_ref().map(|s| &s.user_token),
    maybe_model_type: Some(CommonModelType::Hunyuan3d2_1),
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: None,
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
  })
      .await;

  let prompt_token = match prompt_result {
    Ok(token) => Some(token),
    Err(err) => {
      warn!("Error inserting prompt: {:?}", err);
      None // Don't fail the job if the prompt insertion fails.
    }
  };

  // Insert context items for any images used
  if let Some(token) = prompt_token.as_ref() {
    let mut context_items = Vec::new();

    context_items.push(PromptContextItem {
      media_token: media_file.token.clone(),
      context_semantic_type: PromptContextSemanticType::Imgref,
    });

    if !context_items.is_empty() {
      let result = insert_batch_prompt_context_items(InsertBatchArgs {
        prompt_token: token.clone(),
        items: context_items,
        transaction: &mut transaction,
      }).await;

      if let Err(err) = result {
        // NB: Fail open.
        warn!("Error inserting batch prompt context items: {:?}", err);
      }
    }
  }

  let db_result = insert_generic_inference_job_for_fal_queue(InsertGenericInferenceForFalArgs {
    uuid_idempotency_token: &request.uuid_idempotency_token,
    maybe_external_third_party_id: &external_job_id,
    fal_category: FalCategory::ObjectGeneration,
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

  let _r = transaction.commit().await.map_err(|err| {
    error!("Error committing MySQL transaction: {:?}", err);
    CommonWebError::ServerError
  })?;

  Ok(Json(GenerateHunyuan21ImageTo3dResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
