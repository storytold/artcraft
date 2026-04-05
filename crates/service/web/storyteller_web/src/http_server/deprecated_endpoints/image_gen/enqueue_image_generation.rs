#![forbid(unused_mut)]

use std::fmt::Debug;
use std::fmt::{Display, Formatter};
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use log::error;
use log::warn;
use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;
use web::Data;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{
  GenericInferenceArgs,
  InferenceCategoryAbbreviated,
  PolymorphicInferenceArgs,
};
use mysql_queries::payloads::generic_inference_args::inner_payloads::image_generation_payload::StableDiffusionArgs;
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{
  insert_generic_inference_job,
  InsertGenericInferenceArgs,
};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// This is the number of images (batch size) to generate for each request.
/// We should allow all users to have multiple images generated at once as this
/// is what other providers do.
const MINIMUM_IMAGE_COUNT : u32 = 4;

/// The maximum number of images (batch size) to generate for each request.
const MAXIMUM_IMAGE_COUNT : u32 = 8;

/// Debug requests can get routed to special "debug-only" workers, which can
/// be used to trial new code, run debugging, etc.
const DEBUG_HEADER_NAME: &str = "enable-debug-mode";

/// The routing tag header can send workloads to particular k8s hosts.
/// This is useful for catching the live logs or intercepting the job.
const ROUTING_TAG_HEADER_NAME: &str = "routing-tag";

#[derive(Debug, Deserialize, Clone, Copy, Eq, PartialEq)]
pub enum TypeOfInference {
    #[serde(rename = "lora")]
    Lora,
    #[serde(rename = "model")]
    Model,
    #[serde(rename = "inference")]
    Inference
}
impl Display for TypeOfInference {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        match self {
            TypeOfInference::Lora => write!(f, "lora"),
            TypeOfInference::Model => write!(f, "model"),
            TypeOfInference::Inference => write!(f, "inference"),
        }
    }
}

pub fn is_valid_string(input: &str) -> bool {
    let valid_strings = [
        "DPM++ 2M Karras",
        "DPM++ SDE Karras",
        "DPM++ 2M SDE Exponential",
        "DPM++ 2M SDE Karras",
        "Euler a",
        "Euler",
        "LMS",
        "Heun",
        "DPM2",
        "DPM2 a",
        "DPM++ 2S a",
        "DPM++ 2M",
        "DPM++ SDE",
        "DPM++ 2M SDE",
        "DPM++ 2M SDE Heun",
        "DPM++ 2M SDE Heun Karras",
        "DPM++ 2M SDE Heun Exponential",
        "DPM++ 3M SDE",
        "DPM++ 3M SDE Karras",
        "DPM++ 3M SDE Exponential",
        "DPM fast",
        "DPM adaptive",
        "LMS Karras",
        "DPM2 Karras",
        "DPM2 a Karras",
        "DPM++ 2S a Karras",
    ];
    valid_strings.contains(&input)
}

#[derive(Deserialize, Default, ToSchema)]
pub struct EnqueueImageGenRequest {
    pub uuid_idempotency_token: String,
    pub maybe_image_source: Option<String>,
    pub maybe_sd_model_token: Option<String>,
    pub maybe_lora_model_token: Option<String>,
    pub maybe_prompt: Option<String>,
    pub maybe_n_prompt: Option<String>,
    pub maybe_seed: Option<i64>,
    pub maybe_width: Option<u32>,
    pub maybe_height: Option<u32>,
    pub maybe_sampler: Option<String>,
    pub maybe_upload_path: Option<String>,
    pub maybe_lora_upload_path: Option<String>,
    pub maybe_cfg_scale: Option<u32>,
    pub maybe_number_of_samples: Option<u32>,
    pub maybe_batch_count: Option<u32>,
    pub maybe_name: Option<String>,
    pub maybe_description: Option<String>,
    pub maybe_version: Option<u32>,

    // Optional cover image on LoRA or SD upload
    pub maybe_cover_image_media_file_token: Option<MediaFileToken>,
}

#[derive(Serialize, ToSchema)]
pub struct EnqueueImageGenRequestSuccessResponse {
    pub success: bool,
    pub inference_job_token: InferenceJobToken,
}

#[derive(Debug, ToSchema)]
pub enum EnqueueImageGenRequestError {
    BadInput(String),
    NotAuthorized,
    ServerError,
    RateLimited,
}

impl ResponseError for EnqueueImageGenRequestError {
    fn status_code(&self) -> StatusCode {
        match *self {
            EnqueueImageGenRequestError::BadInput(_) => StatusCode::BAD_REQUEST,
            EnqueueImageGenRequestError::NotAuthorized => StatusCode::UNAUTHORIZED,
            EnqueueImageGenRequestError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
            EnqueueImageGenRequestError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
        }
    }

    fn error_response(&self) -> HttpResponse {
        let error_reason = match self {
            EnqueueImageGenRequestError::BadInput(reason) => reason.to_string(),
            EnqueueImageGenRequestError::NotAuthorized => "unauthorized".to_string(),
            EnqueueImageGenRequestError::ServerError => "server error".to_string(),
            EnqueueImageGenRequestError::RateLimited => "rate limited".to_string(),
        };

        to_simple_json_error(&error_reason, self.status_code())
    }
}

impl Display for EnqueueImageGenRequestError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

// Implementation for enqueuing a TTS request
// Reference enqueue_infer_tts_handler.rs for checks: rate limiting / user sessions
// insert generic inference job.rs
// Need to convert it to generic inference job.
#[utoipa::path(
    post,
    path = "/inference/enqueue_image_gen/",
    responses(
        (
            status = 200,
            description = "Enqueue TTS generically",
            body = EnqueueImageGenRequestSuccessResponse,
        ),
        (status = 400, description = "Bad input", body = EnqueueImageGenRequestError),
        (status = 401, description = "Not authorized", body = EnqueueImageGenRequestError),
        (status = 429, description = "Rate limited", body = EnqueueImageGenRequestError),
        (status = 500, description = "Server error", body = EnqueueImageGenRequestError)
    ),
    params(("request" = EnqueueImageGenRequest, description = "Payload for TTS Request"))
)]
pub async fn enqueue_image_generation_request(
    http_request: HttpRequest,
    request: Json<EnqueueImageGenRequest>,
    server_state: Data<Arc<ServerState>>
) -> Result<HttpResponse, EnqueueImageGenRequestError> {

    let inference_mode = inference_mode_from_http_request(&http_request)
        .ok_or(EnqueueImageGenRequestError::BadInput("Invalid request".to_string()))?;

    validate_request(&request, inference_mode)?;

    // TODO: Brandon need to figure out premium vs not premium

    let mut maybe_user_token: Option<UserToken> = None;
    let visbility = enums::common::visibility::Visibility::Public;

    let mut mysql_connection = server_state.mysql_pool.acquire().await.map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        EnqueueImageGenRequestError::ServerError
    })?;

    // ==================== USER SESSION ==================== //

    let maybe_user_session = server_state.session_checker
        .maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection).await
        .map_err(|e| {
            warn!("Session checker error: {:?}", e);
            EnqueueImageGenRequestError::ServerError
        })?;
    

    if let Some(user_session) = maybe_user_session.as_ref() {
        maybe_user_token = Some(UserToken::new_from_str(&user_session.user_token));
    }

    // ==================== PLANS ==================== //

    // Plan should handle "first anonymous use" and "investor" cases.
    let plan = get_correct_plan_for_session(
      server_state.server_environment_old,
      maybe_user_session.as_ref()
    );

    // Separate priority for animation.
    let priority_level = plan.web_vc_base_priority_level();

    // ==================== DEBUG MODE + ROUTING TAG ==================== //

    let is_debug_request = get_request_header_optional(&http_request, DEBUG_HEADER_NAME).is_some();

    let maybe_routing_tag = get_request_header_optional(&http_request, ROUTING_TAG_HEADER_NAME).map(
        |routing_tag| routing_tag.trim().to_string()
    );


    // ==================== BANNED USERS ==================== //

    if let Some(ref user) = maybe_user_session {
        if user.role.is_banned {
            return Err(EnqueueImageGenRequestError::NotAuthorized);
        }
    }

    // DETECT premium user and queue

    // ==================== RATE LIMIT ==================== //

    let rate_limiter = match maybe_user_session {
        None => &server_state.redis_rate_limiters.logged_out,
        Some(ref _user) => &server_state.redis_rate_limiters.logged_in,
    };

    if let Err(_err) = rate_limiter.rate_limit_request(&http_request).await {
        return Err(EnqueueImageGenRequestError::RateLimited);
    }

    // Get up IP address
    let ip_address = get_request_ip(&http_request);

    // Check the inference args to make sure everything is all there for upload loRA / model or standard inference

    // ==================== HANDLE IDEMPOTENCY ==================== //

    if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
        return Err(EnqueueImageGenRequestError::BadInput(reason));
    }

    insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
        .await
        .map_err(|err| {
            error!("Error inserting idempotency token: {:?}", err);
            EnqueueImageGenRequestError::BadInput("invalid idempotency token".to_string())
        })?;

    // ==================== INFERENCE ARGS ==================== //

    let width = request.maybe_width.unwrap_or(512);
    let height = request.maybe_height.unwrap_or(512);

    let width = match width {
        0..=512 => 512,
        513..=768 => 768,
        769..=1024 => 1024,
        _ => 1024,
    };

    let height = match height {
        0..=512 => 512,
        513..=768 => 768,
        769..=1024 => 1024,
        _ => 1024,
    };

    let cfg_scale = match request.maybe_cfg_scale {
        Some(val) => if val > 32 { 32 } else { val }
        None => 7,
    };

    let number_of_samples = match request.maybe_number_of_samples {
        Some(val) => if val > 128 { 128 } else { val }
        None => 20,
    };

    let batch_count = match request.maybe_batch_count {
        None => MINIMUM_IMAGE_COUNT, // NB: Default to "3" images for everyone
        Some(0...MINIMUM_IMAGE_COUNT) => MINIMUM_IMAGE_COUNT,
        Some(val) => if val > MAXIMUM_IMAGE_COUNT { MAXIMUM_IMAGE_COUNT } else { val }
    };

    let sampler = match request.maybe_sampler.clone() {
        Some(val) => if is_valid_string(&val) { val.clone() } else { String::from("Euler a") }
        None => String::from("Euler a"),
    };

    let sd_weight_token = ModelWeightToken(
        request.maybe_sd_model_token.clone().unwrap_or_default()
    );

    let lora_token = ModelWeightToken(request.maybe_lora_model_token.clone().unwrap_or_default());

    let n_prompt = request.maybe_n_prompt.clone().unwrap_or_default();

    // we can only do 1 upload type at a time.
    // if we are uploading a model.
    let mut maybe_sd_upload_url = None;
    let mut maybe_lora_upload_url = None;

    let both_fields = (
        request.maybe_upload_path.as_deref(),
        request.maybe_lora_upload_path.as_deref()
    );

    match both_fields {
        (Some(_), Some(_)) => {
            return Err(EnqueueImageGenRequestError::BadInput("Can't upload both lora and model".to_string()));
        }
        (Some(sd_url), None) => {
            maybe_sd_upload_url = Some(sd_url.to_string());
        }
        (None, Some(lora_url)) => {
            maybe_lora_upload_url = Some(lora_url.to_string());
        }
        _ => {}, // No-op for inference
    }

    // NB: This is done to populate the new top-level field in the jobs table.
    // We won't read this yet, but in the meantime it can serve as analytics, and in the future
    // we can switch to it.
    let maybe_either_download_url = maybe_sd_upload_url.as_deref()
        .or(maybe_lora_upload_url.as_deref())
        .map(|s| s.to_string());

    let seed = request.maybe_seed.unwrap_or(-1);

    let mut version : u32 = 0;

    let type_of_inference = match inference_mode {
        TypeOfInference::Lora => "lora",
        TypeOfInference::Model => "model",
        TypeOfInference::Inference => "inference",
    };

    if let Some(s) = request.maybe_version {
        version = s;
    }

    let inference_args = StableDiffusionArgs {
        maybe_sd_model_token: Some(sd_weight_token),
        maybe_lora_model_token: Some(lora_token),
        maybe_prompt: request.maybe_prompt.clone(),
        maybe_n_prompt: request.maybe_n_prompt.clone(),
        maybe_seed: Some(seed),
        maybe_upload_path: maybe_sd_upload_url,
        maybe_lora_upload_path: maybe_lora_upload_url,
        type_of_inference: type_of_inference.to_string(),
        maybe_cfg_scale: Some(cfg_scale),
        maybe_number_of_samples: Some(number_of_samples),
        maybe_batch_count: Some(batch_count),
        maybe_width: Some(width),
        maybe_height: Some(height),
        maybe_sampler: Some(sampler),
        maybe_description: request.maybe_description.clone(),
        maybe_name: request.maybe_name.clone(),
        maybe_version: Some(version),
    };

    // create the inference args here
    let maybe_avt_token = server_state.avt_cookie_manager.get_avt_token_from_request(&http_request);

    // create the job record here!
    let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
        uuid_idempotency_token: &request.uuid_idempotency_token,
        job_type: InferenceJobType::StableDiffusion,
        maybe_product_category: None, // This is not a product anymore
        inference_category: InferenceCategory::ImageGeneration,
        maybe_model_type: Some(InferenceModelType::StableDiffusion), // NB: Model is static during inference
        maybe_model_token: None, // NB: Model is static during inference
        maybe_input_source_token: None,
        maybe_input_source_token_type: None,
        maybe_download_url: maybe_either_download_url.as_deref(),
        maybe_cover_image_media_file_token: request.maybe_cover_image_media_file_token.as_ref(),
        maybe_raw_inference_text: None,
        maybe_max_duration_seconds: None,
        maybe_inference_args: Some(GenericInferenceArgs {
            inference_category: Some(InferenceCategoryAbbreviated::ImageGeneration),
            args: Some(PolymorphicInferenceArgs::Ig(inference_args)),
        }),
        maybe_creator_user_token: maybe_user_token.as_ref(),
        maybe_avt_token: maybe_avt_token.as_ref(),
        creator_ip_address: &ip_address,
        creator_set_visibility: visbility,
        priority_level,
        requires_keepalive: false, //reverse ...  TODO fix this. we set it base on account is premium or not ... 
        is_debug_request,
        maybe_routing_tag: maybe_routing_tag.as_deref(),
        mysql_pool: &server_state.mysql_pool,
    }).await;

    let job_token = match query_result {
        Ok((job_token, _id)) => job_token,
        Err(err) => {
            warn!("New generic inference job creation DB error: {:?}", err);
            if err.had_duplicate_idempotency_token() {
                return Err(EnqueueImageGenRequestError::BadInput("Duplicate idempotency token".to_string()));
            }
            return Err(EnqueueImageGenRequestError::ServerError);
        }
    };

    let response: EnqueueImageGenRequestSuccessResponse = EnqueueImageGenRequestSuccessResponse {
        success: true,
        inference_job_token: job_token,
    };

    let body = serde_json
        ::to_string(&response)
        .map_err(|_e| EnqueueImageGenRequestError::ServerError)?;

    // Error handling 101 rust result type returned like so.
    Ok(HttpResponse::Ok().content_type("application/json").body(body))
}

fn validate_request(
    request: &Json<EnqueueImageGenRequest>,
    inference_mode: TypeOfInference
) -> Result<(), EnqueueImageGenRequestError> {

    let mut requires_name = false;
    let mut requires_description = false;
    let mut requires_sd_model_token = false;
    let mut requires_lora_upload_path = false;
    let mut requires_upload_path = false;

    match inference_mode {
        TypeOfInference::Lora => {
            requires_name = true;
            requires_description = true;
            requires_lora_upload_path = true;
        }
        TypeOfInference::Model => {
            requires_name = true;
            requires_description = true;
            requires_upload_path = true;
        }
        TypeOfInference::Inference => {
            requires_sd_model_token = true;
        }
    }

    if requires_name && request.maybe_name.is_none() {
        return Err(EnqueueImageGenRequestError::BadInput("Missing Model / Lora Name".to_string()));
    }
    if requires_description && request.maybe_description.is_none() {
        return Err(EnqueueImageGenRequestError::BadInput("Missing Model / Lora Description".to_string()));
    }
    if requires_sd_model_token && request.maybe_sd_model_token.is_none() {
        return Err(EnqueueImageGenRequestError::BadInput("Missing Model Token".to_string()));
    }
    if requires_lora_upload_path && request.maybe_lora_upload_path.is_none() {
        return Err(EnqueueImageGenRequestError::BadInput("Missing Lora Upload Path".to_string()));
    }
    if requires_upload_path && request.maybe_upload_path.is_none() {
        return Err(EnqueueImageGenRequestError::BadInput("Missing Model Upload Path".to_string()));
    }

    Ok(())
}




fn inference_mode_from_http_request(http_request: &HttpRequest) -> Option<TypeOfInference> {
    inference_mode_from_url_path(http_request.path())
}

fn inference_mode_from_url_path(url_path: &str) -> Option<TypeOfInference> {
    let last_segment = url_path.split("/").last();
    match last_segment {
        Some("lora") => Some(TypeOfInference::Lora),
        Some("model") => Some(TypeOfInference::Model),
        Some("inference") => Some(TypeOfInference::Inference),
        _ => None
    }
}

#[cfg(test)]
mod tests {
  use crate::http_server::deprecated_endpoints::image_gen::enqueue_image_generation::{inference_mode_from_url_path, TypeOfInference};

  #[test]
    fn test_url_paths() {
        // Valid routes
        assert_eq!(inference_mode_from_url_path("/v1/image_gen/enqueue/inference"), Some(TypeOfInference::Inference));
        assert_eq!(inference_mode_from_url_path("/v1/image_gen/upload/model"), Some(TypeOfInference::Model));
        assert_eq!(inference_mode_from_url_path("/v1/image_gen/upload/lora"), Some(TypeOfInference::Lora));

        // Non-routes
        assert_eq!(inference_mode_from_url_path(""), None);
        assert_eq!(inference_mode_from_url_path("/v1/image_gen/enqueue/foo"), None);
        assert_eq!(inference_mode_from_url_path("/v1/image_gen/upload/foo"), None);
    }
}

// with LoRA
// http://127.0.0.1:12345/v1/image_gen/inference/enqueue_image_gen
// {
//     "uuid_idempotency_token": "12",
//     "maybe_sd_model_token": "weight_dmmthavhawqc2hj7yqyemcbf8",
//     "maybe_lora_model_token": "weight_t7gz78fjg27m0wtw6r33gafxs",
//     "maybe_prompt": "raiden mei a very well drawn, anime girl, with pink and purple hair sitting down on a chair relaxed, highest quality, semi nude, masterpiece, painted",
//     "maybe_a_prompt": "a anime girl, with pink and purple hair sitting down on a chair relaxed.",
//     "maybe_n_prompt": "nsfw, black and white, low quality, pixelated",
//     "maybe_seed": -1,
//     "maybe_width": 1024,
//     "maybe_height": 1024,
//     "maybe_sampler": "DPM++ 2M SDE Heun",
//     "maybe_cfg_scale": 7,
//     "maybe_number_of_samples": 64,
//     "maybe_batch_count": 4,
//   }

// without LoRA
// {
//     "uuid_idempotency_token": "132141",
//     "maybe_sd_model_token": "weight_dmmthavhawqc2hj7yqyemcbf8",
//     "maybe_prompt": "raiden mei a very well drawn, anime girl, with pink and purple hair sitting down on a chair relaxed, highest quality, semi nude, masterpiece, painted",
//     "maybe_a_prompt": "a anime girl, with pink and purple hair sitting down on a chair relaxed.",
//     "maybe_n_prompt": "nsfw, black and white, low quality, pixelated",
//     "maybe_seed": -1,
//     "maybe_width": 512,
//     "maybe_height": 512,
//     "maybe_sampler": "DPM++ 2M SDE Heun",
//     "maybe_cfg_scale": 8,
//     "maybe_number_of_samples": 64,
//     "maybe_batch_count": 4
// }

// http://127.0.0.1:12345/v1/image_gen/upload/lora
// {
//     "uuid_idempotency_token": "12",
//     "maybe_lora_upload_path": "https://drive.google.com/file/d/1WRgR2pn0Ky8ls5_9Zq6tQlHTBvyWeach/view?usp=sharing",
//     "maybe_name":"some_name",
//     "maybe_description":"some_description"
// }

// http://127.0.0.1:12345/v1/image_gen/upload/model
// {
//     "uuid_idempotency_token": "13",
//     "maybe_upload_path": "https://drive.google.com/file/d/1WRgR2pn0Ky8ls5_9Zq6tQlHTBvyWeach/view?usp=sharing",
//     "maybe_name":"some_name",
//     "maybe_description":"some_description"
// }

// {
//     "uuid_idempotency_token": "123",
//     "maybe_lora_upload_path": "https://drive.google.com/file/d/1WRgR2pn0Ky8ls5_9Zq6tQlHTBvyWeach/view?usp=sharing",
//     "maybe_name":"some_name",
//     "maybe_description":"some_description"
// }