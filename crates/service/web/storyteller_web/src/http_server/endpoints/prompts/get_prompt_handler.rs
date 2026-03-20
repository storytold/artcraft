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
use artcraft_api_defs::common::responses::media_links::MediaLinks;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use chrono::{DateTime, Utc};
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums_api::common::generation::generation_provider::GenerationProvider;
use enums_convert::common::generation::generation_provider::generation_provider_to_api;
use enums::common::model_type::ModelType;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use log::{error, warn};
use mysql_queries::queries::prompt_context_items::list_prompt_context_items::list_prompt_context_items;
use mysql_queries::queries::prompts::get_prompt::{get_prompt, get_prompt_from_connection};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use utoipa::ToSchema;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct GetPromptPathInfo {
  token: PromptToken,
}

#[derive(Serialize, ToSchema)]
pub struct GetPromptSuccessResponse {
  pub success: bool,
  pub prompt: PromptInfo,
}

#[derive(Serialize, ToSchema)]
pub struct GetPromptImageContextItem {
  pub media_token: MediaFileToken,
  pub semantic: PromptContextSemanticType,
  pub media_links: MediaLinks,
}

#[derive(Serialize, ToSchema)]
pub struct PromptInfo {
  pub token: PromptToken,

  /// The type of prompt.
  /// Note: Prompts may or may not be compatible across systems.
  pub prompt_type: PromptType,

  /// The type of model used
  pub maybe_model_type: Option<ModelType>,

  /// The service provider used
  pub maybe_generation_provider: Option<GenerationProvider>,
  
  /// Positive prompt (technically optional, but usually present)
  pub maybe_positive_prompt: Option<String>,

  /// Negative prompt (optional)
  pub maybe_negative_prompt: Option<String>,

  /// Context images (optional)
  pub maybe_context_images: Option<Vec<GetPromptImageContextItem>>,

  /// Scheduled / travel prompt (optional)
  pub maybe_travel_prompt: Option<String>,

  /// If a "style" was used, this is the name of it.
  /// This might not be present for all types of inference
  /// and typically only applies to video style transfer.
  pub maybe_style_name: Option<StyleTransferName>,

  /// How many milliseconds it took to run generation.
  pub maybe_inference_duration_millis: Option<u64>,

  /// If a "strength" was used.
  /// Typically only for video style transfer.
  pub maybe_strength: Option<f32>,

  /// If a frame skip setting was used.
  pub maybe_frame_skip: Option<u8>,

  /// If a face detailer was used.
  /// This might not be present for all types of inference
  /// and typically only applies to video style transfer.
  pub used_face_detailer: bool,

  /// If an upscaling pass was used.
  /// This might not be present for all types of inference
  /// and typically only applies to video style transfer.
  pub used_upscaler: bool,

  /// If lipsync was enabled.
  /// This might not be present for all types of inference
  /// and typically only applies to video style transfer.
  pub lipsync_enabled: bool,

  /// If LCM was disabled.
  /// Only staff can do this for now.
  pub lcm_disabled: bool,

  /// If the cinematic workflow was used.
  /// Only staff can do this for now.
  pub use_cinematic: bool,

  /// If a global IP Adapter Image was used, this is the details.
  /// NB: We can't easily query for this without another DB round trip,
  /// so the frontend should query for it instead.
  pub maybe_global_ipa_image_token: Option<MediaFileToken>,

  // TODO: Author of prompt info

  /// Fields that only moderators should see.
  pub maybe_moderator_fields: Option<PromptInfoModeratorFields>,

  pub created_at: DateTime<Utc>,
}

#[derive(Serialize, ToSchema)]
pub struct PromptInfoModeratorFields {
  /// How many milliseconds it took to run generation.
  pub maybe_inference_duration_millis: Option<u64>,

  /// Version of Yae's workflow
  /// Used for logging and debugging by the art team.
  pub main_ipa_workflow: Option<String>,

  /// Version of Yae's face detailer workflow
  /// Used for logging and debugging by the art team.
  pub face_detailer_workflow: Option<String>,

  /// Version of Yae's upscaler workflow
  /// Used for logging and debugging by the art team.
  pub upscaler_workflow: Option<String>,
}

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
      maybe_generation_provider: result.maybe_generation_provider.map(generation_provider_to_api),
      maybe_positive_prompt: result.maybe_positive_prompt,
      maybe_negative_prompt: result.maybe_negative_prompt,
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
