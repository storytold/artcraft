use std::collections::HashMap;
use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_image_urls_as_map::lookup_image_urls_as_map;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::object::multi_function::hunyuan3d_v3_multi_function_object_gen::{
  Hunyuan3dV3GenerateType, Hunyuan3dV3MultiFunctionObjectGenRequest,
  Hunyuan3dV3MultiFunctionObjectGenResponse, Hunyuan3dV3PolygonType,
};
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::visibility::Visibility;
use fal_client::requests::webhook::object::enqueue_hunyuan3d_v3_image_to_3d_webhook::{
  enqueue_hunyuan3d_v3_image_to_3d_webhook, EnqueueHunyuan3dV3ImageTo3dArgs,
  EnqueueHunyuan3dV3ImageTo3dGenerateType, EnqueueHunyuan3dV3ImageTo3dPolygonType,
};
use fal_client::requests::webhook::object::enqueue_hunyuan3d_v3_sketch_to_3d_webhook::{
  enqueue_hunyuan3d_v3_sketch_to_3d_webhook, EnqueueHunyuan3dV3SketchTo3dArgs,
  EnqueueHunyuan3dV3SketchTo3dGenerateType, EnqueueHunyuan3dV3SketchTo3dPolygonType,
};
use fal_client::requests::webhook::object::enqueue_hunyuan3d_v3_text_to_3d_webhook::{
  enqueue_hunyuan3d_v3_text_to_3d_webhook, EnqueueHunyuan3dV3TextTo3dArgs,
  EnqueueHunyuan3dV3TextTo3dGenerateType, EnqueueHunyuan3dV3TextTo3dPolygonType,
};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::{
  insert_generic_inference_job_for_fal_queue, FalCategory, InsertGenericInferenceForFalArgs,
};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{
  insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem,
};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use sqlx::Acquire;
use tokens::tokens::media_files::MediaFileToken;

/// Hunyuan 3D v3 Multi-Function (text-to-3d, image-to-3d, sketch-to-3d)
#[utoipa::path(
  post,
  tag = "Generate Objects (Multi-Function)",
  path = "/v1/generate/object/multi_function/hunyuan3d_v3",
  responses(
    (status = 200, description = "Success", body = Hunyuan3dV3MultiFunctionObjectGenResponse),
  ),
  params(
    ("request" = Hunyuan3dV3MultiFunctionObjectGenRequest, description = "Payload for Request"),
  )
)]
pub async fn generate_hunyuan3d_v3_multi_function_object_handler(
  http_request: HttpRequest,
  request: Json<Hunyuan3dV3MultiFunctionObjectGenRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<Hunyuan3dV3MultiFunctionObjectGenResponse>, CommonWebError> {
  payments_error_test(&request.prompt.as_deref().unwrap_or(""))?;

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

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

  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(CommonWebError::BadInputWithSimpleMessage(reason));
  }

  // Collect all media tokens to look up in a single batch query
  let mut query_media_tokens: Vec<MediaFileToken> = Vec::new();

  if let Some(token) = &request.image_media_token {
    query_media_tokens.push(token.clone());
  }
  if let Some(token) = &request.back_image_media_token {
    query_media_tokens.push(token.clone());
  }
  if let Some(token) = &request.left_image_media_token {
    query_media_tokens.push(token.clone());
  }
  if let Some(token) = &request.right_image_media_token {
    query_media_tokens.push(token.clone());
  }

  // Perform a single batch lookup for all image URLs
  let image_urls_by_token = if query_media_tokens.is_empty() {
    HashMap::new()
  } else {
    info!("Looking up image media tokens: {:?}", query_media_tokens);
    lookup_image_urls_as_map(
      &http_request,
      &mut mysql_connection,
      server_state.server_environment,
      &query_media_tokens,
    )
    .await?
  };

  // Extract individual URLs from the map
  let image_url = request
    .image_media_token
    .as_ref()
    .and_then(|token| image_urls_by_token.get(token))
    .map(|url| url.to_string());

  let back_image_url = request
    .back_image_media_token
    .as_ref()
    .and_then(|token| image_urls_by_token.get(token))
    .map(|url| url.to_string());

  let left_image_url = request
    .left_image_media_token
    .as_ref()
    .and_then(|token| image_urls_by_token.get(token))
    .map(|url| url.to_string());

  let right_image_url = request
    .right_image_media_token
    .as_ref()
    .and_then(|token| image_urls_by_token.get(token))
    .map(|url| url.to_string());

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
    .await
    .map_err(|err| {
      error!("Error inserting idempotency token: {:?}", err);
      CommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
    })?;

  info!("Fal webhook URL: {}", server_state.fal.webhook_url);

  // Determine which mode we're in based on inputs
  let has_prompt = request
    .prompt
    .as_ref()
    .map(|p| !p.trim().is_empty())
    .unwrap_or(false);

  let has_image = image_url.is_some();
  
  // Defaults
  let enable_pbr = request.enable_pbr.unwrap_or(true);

  let fal_result = match (has_prompt, has_image) {
    // Text-to-3D: prompt only, no image
    (true, false) => {
      info!("hunyuan3d v3 text-to-3d mode");

      let generate_type = request.generate_type.map(|t| match t {
        Hunyuan3dV3GenerateType::Normal => EnqueueHunyuan3dV3TextTo3dGenerateType::Normal,
        Hunyuan3dV3GenerateType::LowPoly => EnqueueHunyuan3dV3TextTo3dGenerateType::LowPoly,
        Hunyuan3dV3GenerateType::Geometry => EnqueueHunyuan3dV3TextTo3dGenerateType::Geometry,
      });

      let polygon_type = request.polygon_type.map(|t| match t {
        Hunyuan3dV3PolygonType::Triangle => EnqueueHunyuan3dV3TextTo3dPolygonType::Triangle,
        Hunyuan3dV3PolygonType::Quadrilateral => {
          EnqueueHunyuan3dV3TextTo3dPolygonType::Quadrilateral
        }
      });

      let args = EnqueueHunyuan3dV3TextTo3dArgs {
        prompt: request.prompt.clone().unwrap_or_default(),
        face_count: request.face_count,
        generate_type,
        polygon_type,
        enable_pbr: Some(enable_pbr),
        webhook_url: &server_state.fal.webhook_url,
        api_key: &server_state.fal.api_key,
      };

      enqueue_hunyuan3d_v3_text_to_3d_webhook(args)
        .await
        .map_err(|err| {
          warn!(
            "Error calling enqueue_hunyuan3d_v3_text_to_3d_webhook: {:?}",
            err
          );
          CommonWebError::ServerError
        })?
    }

    // Sketch-to-3D: both prompt and image
    (true, true) => {
      info!("hunyuan3d v3 sketch-to-3d mode");

      let generate_type = request.generate_type.map(|t| match t {
        Hunyuan3dV3GenerateType::Normal => EnqueueHunyuan3dV3SketchTo3dGenerateType::Normal,
        Hunyuan3dV3GenerateType::LowPoly => EnqueueHunyuan3dV3SketchTo3dGenerateType::LowPoly,
        Hunyuan3dV3GenerateType::Geometry => EnqueueHunyuan3dV3SketchTo3dGenerateType::Geometry,
      });

      let polygon_type = request.polygon_type.map(|t| match t {
        Hunyuan3dV3PolygonType::Triangle => EnqueueHunyuan3dV3SketchTo3dPolygonType::Triangle,
        Hunyuan3dV3PolygonType::Quadrilateral => {
          EnqueueHunyuan3dV3SketchTo3dPolygonType::Quadrilateral
        }
      });

      let args = EnqueueHunyuan3dV3SketchTo3dArgs {
        prompt: request.prompt.clone().unwrap_or_default(),
        image_url: image_url.unwrap(),
        face_count: request.face_count,
        generate_type,
        polygon_type,
        enable_pbr: Some(enable_pbr),
        webhook_url: &server_state.fal.webhook_url,
        api_key: &server_state.fal.api_key,
      };

      enqueue_hunyuan3d_v3_sketch_to_3d_webhook(args)
        .await
        .map_err(|err| {
          warn!(
            "Error calling enqueue_hunyuan3d_v3_sketch_to_3d_webhook: {:?}",
            err
          );
          CommonWebError::ServerError
        })?
    }

    // Image-to-3D: image only, no prompt (or empty prompt)
    (false, true) => {
      info!("hunyuan3d v3 image-to-3d mode");

      let generate_type = request.generate_type.map(|t| match t {
        Hunyuan3dV3GenerateType::Normal => EnqueueHunyuan3dV3ImageTo3dGenerateType::Normal,
        Hunyuan3dV3GenerateType::LowPoly => EnqueueHunyuan3dV3ImageTo3dGenerateType::LowPoly,
        Hunyuan3dV3GenerateType::Geometry => EnqueueHunyuan3dV3ImageTo3dGenerateType::Geometry,
      });

      let polygon_type = request.polygon_type.map(|t| match t {
        Hunyuan3dV3PolygonType::Triangle => EnqueueHunyuan3dV3ImageTo3dPolygonType::Triangle,
        Hunyuan3dV3PolygonType::Quadrilateral => {
          EnqueueHunyuan3dV3ImageTo3dPolygonType::Quadrilateral
        }
      });

      let args = EnqueueHunyuan3dV3ImageTo3dArgs {
        image_url: image_url.unwrap(),
        back_image_url,
        left_image_url,
        right_image_url,
        face_count: request.face_count,
        generate_type,
        polygon_type,
        enable_pbr: Some(enable_pbr),
        webhook_url: &server_state.fal.webhook_url,
        api_key: &server_state.fal.api_key,
      };

      enqueue_hunyuan3d_v3_image_to_3d_webhook(args)
        .await
        .map_err(|err| {
          warn!(
            "Error calling enqueue_hunyuan3d_v3_image_to_3d_webhook: {:?}",
            err
          );
          CommonWebError::ServerError
        })?
    }

    // Neither prompt nor image - invalid request
    (false, false) => {
      return Err(CommonWebError::BadInputWithSimpleMessage(
        "Either prompt or image_media_token must be provided".to_string(),
      ));
    }
  };

  let external_job_id = fal_result.request_id.ok_or_else(|| {
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
    maybe_model_type: Some(CommonModelType::Hunyuan3d3),
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

    if let Some(media_token) = &request.image_media_token {
      context_items.push(PromptContextItem {
        media_token: media_token.clone(),
        context_semantic_type: PromptContextSemanticType::Imgref,
      });
    }
    if let Some(media_token) = &request.back_image_media_token {
      context_items.push(PromptContextItem {
        media_token: media_token.clone(),
        context_semantic_type: PromptContextSemanticType::Imgref,
      });
    }
    if let Some(media_token) = &request.left_image_media_token {
      context_items.push(PromptContextItem {
        media_token: media_token.clone(),
        context_semantic_type: PromptContextSemanticType::Imgref,
      });
    }
    if let Some(media_token) = &request.right_image_media_token {
      context_items.push(PromptContextItem {
        media_token: media_token.clone(),
        context_semantic_type: PromptContextSemanticType::Imgref,
      });
    }

    if !context_items.is_empty() {
      let result = insert_batch_prompt_context_items(InsertBatchArgs {
        prompt_token: token.clone(),
        items: context_items,
        transaction: &mut transaction,
      })
      .await;

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
  })
  .await;

  let job_token = match db_result {
    Ok(token) => token,
    Err(err) => {
      warn!(
        "Error inserting generic inference job for FAL queue: {:?}",
        err
      );
      return Err(CommonWebError::ServerError);
    }
  };

  let _r = transaction.commit().await.map_err(|err| {
    error!("Error committing MySQL transaction: {:?}", err);
    CommonWebError::ServerError
  })?;

  Ok(Json(Hunyuan3dV3MultiFunctionObjectGenResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
