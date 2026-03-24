use std::fmt;
use std::sync::Arc;

use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use artcraft_api_defs::prompts::get_prompt::{
  GetPromptImageContextItem, GetPromptPathInfo, GetPromptSuccessResponse,
  PromptInfo, PromptInfoModeratorFields,
};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use log::{error, warn};
use mysql_queries::queries::prompt_context_items::list_prompt_context_items::list_prompt_context_items;
use mysql_queries::queries::prompts::get_prompt::get_prompt_from_connection;
use utoipa::ToSchema;

#[derive(Debug, ToSchema)]
pub enum GetPromptError {
  ServerError,
  NotFound,
}

impl ResponseError for GetPromptError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetPromptError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      GetPromptError::NotFound => StatusCode::NOT_FOUND,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      GetPromptError::ServerError => "server error".to_string(),
      GetPromptError::NotFound => "not found".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for GetPromptError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Get details on a prompt.
#[utoipa::path(
  get,
  tag = "Prompts",
  path = "/v1/prompts/{token}",
  responses(
    (status = 200, description = "Found", body = GetPromptSuccessResponse),
    (status = 404, description = "Not found", body = GetPromptError),
    (status = 500, description = "Server error", body = GetPromptError),
  ),
  params(
    ("path" = GetPromptPathInfo, description = "Path for Request")
  )
)]
pub async fn get_prompt_handler(
  http_request: HttpRequest,
  path: Path<GetPromptPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, GetPromptError>
{
  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("Error acquiring MySQL connection: {:?}", err);
        GetPromptError::ServerError
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        GetPromptError::ServerError
      })?;

  let is_moderator = maybe_user_session
      .map(|session| session.can_ban_users)
      .unwrap_or(false);

  let prompt_token = path.into_inner().token;

  let result = get_prompt_from_connection(
    &prompt_token,
    &mut mysql_connection
  ).await;

  let result = match result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(GetPromptError::ServerError);
    }
    Ok(None) => return Err(GetPromptError::NotFound),
    Ok(Some(result)) => result,
  };

  let mut maybe_style_name = None;
  let mut maybe_strength = None;
  let mut maybe_inference_duration_millis = None;
  let mut maybe_global_ipa_image_token = None;
  let mut maybe_travel_prompt = None;
  let mut maybe_frame_skip = None;

  // Flags
  let mut used_face_detailer = false;
  let mut used_upscaler = false;
  let mut lipsync_enabled = false;
  let mut lcm_disabled = false;
  let mut use_cinematic = false;

  // Moderator fields
  let mut main_ipa_workflow = None;
  let mut face_detailer_workflow = None;
  let mut upscaler_workflow = None;

  if let Some(inner_payload) = &result.maybe_other_args {
    if let Some(encoded_style_name) = &inner_payload.style_name {
      maybe_style_name = encoded_style_name.to_style_name();
    }
    maybe_strength = inner_payload.strength;
    maybe_inference_duration_millis = inner_payload.inference_duration_millis;
    maybe_global_ipa_image_token = inner_payload.global_ipa_token.clone();
    maybe_travel_prompt = inner_payload.travel_prompt.clone();
    maybe_frame_skip = inner_payload.frame_skip;

    // Flags
    used_face_detailer = inner_payload.used_face_detailer.unwrap_or(false);
    used_upscaler = inner_payload.used_upscaler.unwrap_or(false);
    lipsync_enabled = inner_payload.lipsync_enabled.unwrap_or(false);
    lcm_disabled = inner_payload.disable_lcm.unwrap_or(false);
    use_cinematic = inner_payload.use_cinematic.unwrap_or(false);

    // Moderator fields
    main_ipa_workflow = inner_payload.main_ipa_workflow.clone();
    face_detailer_workflow = inner_payload.face_detailer_workflow.clone();
    upscaler_workflow = inner_payload.upscaler_workflow.clone();
  }

  let mut maybe_moderator_fields = None;

  if is_moderator {
    maybe_moderator_fields = Some(PromptInfoModeratorFields {
      maybe_inference_duration_millis,
      main_ipa_workflow,
      face_detailer_workflow,
      upscaler_workflow,
    });
  }

  let media_domain = get_media_domain(&http_request);

  let items_result = list_prompt_context_items(
    &result.token,
    &mut mysql_connection
  ).await;

  let items = items_result.unwrap_or_else(|e| {
    warn!("Error listing prompt context items: {:?}", e);
    Vec::new()
  });

  let items = items.iter().filter_map(|item| {
    match item.context_semantic_type {
      PromptContextSemanticType::VidStartFrame => {},
      PromptContextSemanticType::VidEndFrame => {},
      PromptContextSemanticType::Imgref => {},
      PromptContextSemanticType::ImgrefCharacter => {},
      PromptContextSemanticType::ImgrefStyle => {},
      PromptContextSemanticType::ImgrefBg => {},
      _ => {
        // NB: Only return images. In the future we may add context items for stages, persisted data, etc.
        return None
      },
    }

    let bucket_path = MediaFileBucketPath::from_object_hash(
      &item.public_bucket_directory_hash,
      item.maybe_public_bucket_prefix.as_deref(),
      item.maybe_public_bucket_extension.as_deref());

    Some(GetPromptImageContextItem {
      media_token: item.media_token.clone(),
      semantic: item.context_semantic_type,
      media_links: MediaLinksBuilder::from_media_path_and_env(
        media_domain,
        server_state.server_environment,
        &bucket_path,
      ),
    })
  }).collect::<Vec<GetPromptImageContextItem>>();

  let maybe_context_images = if items.is_empty() {
    None
  } else {
    Some(items)
  };

  let response = GetPromptSuccessResponse {
    success: true,
    prompt: PromptInfo {
      token: result.token,
      maybe_strength,
      maybe_model_type: result.maybe_model_type,
      maybe_model_class: result.maybe_model_type.map(|ty| ty.get_model_class()),
      maybe_generation_provider: result.maybe_generation_provider,
      maybe_positive_prompt: result.maybe_positive_prompt,
      maybe_negative_prompt: result.maybe_negative_prompt,
      maybe_generation_mode: result.maybe_generation_mode,
      maybe_aspect_ratio: result.maybe_aspect_ratio,
      maybe_resolution: result.maybe_resolution,
      maybe_batch_count: result.maybe_batch_count,
      maybe_generate_audio: result.maybe_generate_audio,
      maybe_duration_seconds: result.maybe_duration_seconds,
      maybe_context_images,
      maybe_travel_prompt,
      maybe_style_name,
      maybe_inference_duration_millis,
      used_face_detailer,
      used_upscaler,
      lipsync_enabled,
      lcm_disabled,
      use_cinematic,
      prompt_type: result.prompt_type,
      created_at: result.created_at,
      maybe_moderator_fields,
      maybe_global_ipa_image_token,
      maybe_frame_skip,
    },
  };

  let body = serde_json::to_string(&response)
    .map_err(|e| GetPromptError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}
