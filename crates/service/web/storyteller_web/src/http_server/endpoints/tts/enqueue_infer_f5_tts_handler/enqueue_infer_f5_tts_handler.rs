// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{info, warn};
use rand::seq::SliceRandom;
use rand::Rng;
use utoipa::ToSchema;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_input_source_token_type::InferenceInputSourceTokenType;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_api_token::get_request_api_token;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::request::get_request_ip::get_request_ip;
use migration::text_to_speech::get_tts_model_for_enqueue_inference_migration::TtsModelForEnqueueInferenceMigrationWrapper;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{GenericInferenceArgs, InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::payloads::generic_inference_args::inner_payloads::f5_tts_payload::F5TTSPayload;
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{insert_generic_inference_job, InsertGenericInferenceArgs};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::media_uploads::MediaUploadToken;
use tokens::tokens::users::UserToken;
use tts_common::priority::{FAKEYOU_DEFAULT_VALID_API_TOKEN_PRIORITY_LEVEL, FAKEYOU_INVESTOR_PRIORITY_LEVEL};
use user_input_common::check_for_slurs::contains_slurs;

use crate::configs::app_startup::username_set::UsernameSet;
use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::configs::plans::plan::Plan;
use crate::http_server::endpoints::investor_demo::demo_cookie::request_has_demo_cookie;
use crate::http_server::session::lookup::user_session_extended::UserSessionExtended;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

// TODO: Temporary for investor demo
const STORYTELLER_DEMO_COOKIE_NAME : &str = "storyteller_demo";

/// Debug requests mean different things, depending on the type of worker (the legacy
/// tts-inference-job vs. the new inference-job):
///
///  * Legacy (tts): these requests get routed to special "debug-only" workers, which can
///    be used to trial new code, run debugging, etc.
///
///  * New (generic): the flag gets associated with the request which may be used for
///    anything in the code. (There's a new system for routing requests called
///    "routing tags" that is independent of this flag.)
///
const DEBUG_HEADER_NAME : &str = "enable-debug-mode";

/// The routing tag header can send workloads to particular k8s hosts.
/// This is useful for catching the live logs or intercepting the job.
/// NB: This is only for the new job system.
const ROUTING_TAG_HEADER_NAME : &str = "routing-tag";

const USER_FAKEYOU_USER_TOKEN : &str = "U:N5J8JXPW9BTYX";
const USER_NEWS_STORY_USER_TOKEN : &str = "U:XAWRARC1N89X6";

/// Safety guard against plans supporting too lengthy TTS inference text.
const MAX_TTS_LENGTH : usize = 10_000;

#[derive(Deserialize, ToSchema)]
pub struct InferTtsRequest {
  uuid_idempotency_token: String,
  source_media_file_token: String,
  inference_text: String,
  creator_set_visibility: Option<Visibility>,
}

#[derive(Serialize, ToSchema)]
pub struct InferTtsSuccessResponse {
  pub success: bool,
  pub inference_job_token: String,
}

#[derive(Debug, ToSchema)]
pub enum InferTtsError {
  BadInput(String),
  NotAuthorized,
  ServerError,
  RateLimited,
  NotFound,
}

impl ResponseError for InferTtsError {
  fn status_code(&self) -> StatusCode {
    match *self {
      InferTtsError::BadInput(_) => StatusCode::BAD_REQUEST,
      InferTtsError::NotAuthorized => StatusCode::UNAUTHORIZED,
      InferTtsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      InferTtsError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
      InferTtsError::NotFound => StatusCode::NOT_FOUND,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      InferTtsError::BadInput(reason) => reason.to_string(),
      InferTtsError::NotAuthorized => "unauthorized".to_string(),
      InferTtsError::ServerError => "server error".to_string(),
      InferTtsError::RateLimited => "rate limited".to_string(),
      InferTtsError::NotFound => "not found".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for InferTtsError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[utoipa::path(
  post,
  tag = "TTS",
  path = "/v1/tts/f5_inference",
  responses(
    (status = 200, description = "Success response", body = InferTtsSuccessResponse),
    (status = 400, description = "Bad input", body = InferTtsError),
    (status = 401, description = "Not authorized", body = InferTtsError),
    (status = 429, description = "Rate limited", body = InferTtsError),
    (status = 500, description = "Server error", body = InferTtsError)
  ),
  params(("request" = InferTtsRequest, description = "Payload for Request"))
)]
pub async fn enqueue_infer_f5_tts_handler(
  http_request: HttpRequest,
  request: Json<InferTtsRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<Json<InferTtsSuccessResponse>, InferTtsError>
{
  let mut is_from_api = false;
  let mut maybe_user_token : Option<String> = None;
  let mut priority_level ;
  let mut use_high_priority_rate_limiter = false; // NB: Careful!
  let mut disable_rate_limiter = false; // NB: Careful!

  let mut mysql_connection = server_state.mysql_pool
    .acquire()
    .await
    .map_err(|err| {
      warn!("MySql pool error: {:?}", err);
      InferTtsError::ServerError
    })?;

  // ==================== USER SESSION ==================== //

  let maybe_user_session : Option<UserSessionExtended> = server_state
    .session_checker
    .maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      InferTtsError::ServerError
    })?;

  if let Some(user_session) = maybe_user_session.as_ref() {
    maybe_user_token = Some(user_session.user_token.to_string());
  }

  // TODO: Plan should handle "first anonymous use" and "investor" cases.
  let plan = get_correct_plan_for_session(
    server_state.server_environment,
    maybe_user_session.as_ref());

  priority_level = plan.tts_base_priority_level();

  // ==================== API TOKENS ==================== //

  if let Some(api_token) = get_request_api_token(&http_request) {
    let maybe_api_token_configs = server_state
      .static_api_token_set
      .get_api_token(&api_token);

    if let Some(api_token_configs) = maybe_api_token_configs {
      is_from_api = true;

      priority_level = api_token_configs.maybe_priority_level
        .unwrap_or(FAKEYOU_DEFAULT_VALID_API_TOKEN_PRIORITY_LEVEL);

      use_high_priority_rate_limiter = api_token_configs.maybe_use_high_priority_rate_limiter
        .unwrap_or(false);

      disable_rate_limiter = api_token_configs.maybe_disable_rate_limiter.unwrap_or(false);

      if let Some(user_token_override) = api_token_configs.maybe_user_token.as_deref() {
        maybe_user_token = Some(user_token_override.trim().to_string());
      }
    }
  }

  // ==================== INVESTOR PRIORITY ==================== //

  // TODO/TEMP: Give investors even more priority
  let mut is_investor = false;

  // TODO/TEMP: The storyteller.io website will redirect and establish this cookie.
  //  This is just for the YCombinator demo.
  if request_has_demo_cookie(&http_request) {
    is_investor = true;
  }

  if is_investor {
    priority_level = FAKEYOU_INVESTOR_PRIORITY_LEVEL;
  }

  // ==================== ENGINEERING FLAGS / HEADERS: DEBUG MODE, ETC. ==================== //

  let is_debug_request = get_request_header_optional(&http_request, DEBUG_HEADER_NAME)
    .is_some();

  let maybe_routing_tag=
    get_request_header_optional(&http_request, ROUTING_TAG_HEADER_NAME)
      .map(|routing_tag| routing_tag.trim().to_string());

  // ==================== BANNED USERS ==================== //

  if let Some(ref user) = maybe_user_session {
    if user.role.is_banned {
      warn!("User is not authorized to use TTS model because they are banned.");
      return Err(InferTtsError::NotAuthorized);
    }
  }

  // ==================== RATE LIMIT ==================== //

  if !disable_rate_limiter {
    let maybe_username = maybe_user_session
      .as_ref()
      .map(|session| session.user.username.as_str());

    // FIXME(bt,2023-12-13): These boolean flags are a bit dangerous.
    let rate_limiter_type = get_rate_limiter_type(
      maybe_username,
      &server_state.redis_rate_limiters.api_ai_streamer_username_set,
      is_investor,
      is_from_api,
      use_high_priority_rate_limiter
    );

    let rate_limiter = match rate_limiter_type {
      RateLimiterType::LoggedOut => &server_state.redis_rate_limiters.logged_out,
      RateLimiterType::LoggedIn => &server_state.redis_rate_limiters.logged_in,
      RateLimiterType::ApiHighPriority => {
        info!("Using API high priority rate limiter");
        &server_state.redis_rate_limiters.api_high_priority
      },
      RateLimiterType::ApiAiStreamer => {
        info!("Using AI streamer rate limiter");
        &server_state.redis_rate_limiters.api_ai_streamers
      },
    };

    if let Err(_err) = rate_limiter.rate_limit_request(&http_request) {
      return Err(InferTtsError::RateLimited);
    }
  }

  // let is_authorized = check_if_authorized_to_use_media_file(
  //   maybe_user_session.as_ref(),
  //   &tts_model,
  // ).await;
  // 
  // if !is_authorized {
  //   warn!("User is not authorized to use TTS model due to checks.");
  //   return Err(InferTtsError::NotAuthorized);
  // }
  // 
  // ==================== CHECK INFERENCE TEXT ==================== //

  let ip_address = get_request_ip(&http_request);

  let mut inference_text = request.inference_text.trim().to_string();

  if let Err(reason) = validate_inference_text(&inference_text, &plan) {
    return Err(InferTtsError::BadInput(reason));
  }

  if contains_slurs(&inference_text) {
    return Err(InferTtsError::BadInput("text contains slurs".to_string()));
  }

  if let Some(user) = maybe_user_session.as_ref() {
    let is_user_token_troll_banned = server_state.troll_bans.user_tokens
      .contains_user_token(&user.user_token)
      .unwrap_or(false); // NB: Fail open

    let is_ip_address_troll_banned = server_state.troll_bans.ip_addresses
      .contains_ip_address(&ip_address)
      .unwrap_or(false); // NB: Fail open

    let is_troll_banned = is_user_token_troll_banned || is_ip_address_troll_banned;

    if is_troll_banned {
      let test = server_state.flags.troll_ban_user_percent as i32; // NB: Should be 0 - 100.
      let num = rand::thread_rng().gen_range(0..100);

      if test > num {
        warn!("Generating troll response for user token: {}", user.user_token);
        inference_text = random_troll_text().to_string();
      }
    }
  }

  let maybe_user_preferred_visibility : Option<Visibility> = maybe_user_session
    .as_ref()
    .map(|user_session| user_session.preferences.preferred_tts_result_visibility);

  let set_visibility = request.creator_set_visibility
    .or(maybe_user_preferred_visibility)
    .unwrap_or(Visibility::Public);

  // ==================== ENQUEUE APPROPRIATE TTS TYPE ==================== //

  let max_duration_seconds = plan.tts_max_duration_seconds();

  // This branch uses the `generic-inference-job` service and tables.
  info!("Creating tts inference job record (new generic job system)...");

  let maybe_creator_user_token_typed = maybe_user_token
    .as_deref()
    .map(|token| UserToken::new_from_str(token));

  let maybe_avt_token = server_state
    .avt_cookie_manager
    .get_avt_token_from_request(&http_request);

  let maybe_model_type = None;
  
  let maybe_inference_args = Some(GenericInferenceArgs{
    inference_category: Some(InferenceCategoryAbbreviated::F5TTS),
    args: Some(PolymorphicInferenceArgs::Ft(F5TTSPayload{})),
  });

  let media_token = request.source_media_file_token.clone();

  let media_token_type =
    if media_token.starts_with(MediaUploadToken::token_prefix()) {
      InferenceInputSourceTokenType::MediaUpload
    } else if media_token.starts_with(MediaFileToken::token_prefix()) {
      InferenceInputSourceTokenType::MediaFile
    } else {
      return Err(InferTtsError::BadInput(
        "input token is not a media_upload or media_file token".to_string()));
    };


  let maybe_product_category = Some(InferenceJobProductCategory::TtsF5);

  let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
    uuid_idempotency_token: &request.uuid_idempotency_token,
    job_type: InferenceJobType::F5TTS,
    maybe_product_category,
    inference_category: InferenceCategory::F5TTS,
    maybe_model_type,
    maybe_model_token: None,
    maybe_input_source_token: Some(&media_token),
    maybe_input_source_token_type: Some(media_token_type),
    maybe_download_url: None,
    maybe_cover_image_media_file_token: None,
    maybe_raw_inference_text: Some(inference_text.as_str()),
    maybe_max_duration_seconds: Some(max_duration_seconds),
    maybe_inference_args,
    maybe_creator_user_token: maybe_creator_user_token_typed.as_ref(),
    maybe_avt_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility: set_visibility,
    priority_level,
    requires_keepalive: false, // TODO: We may want this to be the case in the future.
    is_debug_request,
    maybe_routing_tag: maybe_routing_tag.as_deref(),
    mysql_pool: &server_state.mysql_pool,
  }).await;

  let inference_job_token = match query_result {
    Ok((inference_job_token, _id)) => inference_job_token,
    Err(err) => {
      warn!("New (generic) tts inference job creation DB error: {:?}", err);
      if err.had_duplicate_idempotency_token() {
        return Err(InferTtsError::BadInput("Duplicate idempotency token".to_string()));
      }
      return Err(InferTtsError::ServerError);
    }
  };

  let job_token = inference_job_token.to_string();


  Ok(Json(InferTtsSuccessResponse {
    success: true,
    inference_job_token: job_token,
  }))
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum RateLimiterType {
  LoggedOut,
  LoggedIn,
  ApiHighPriority,
  ApiAiStreamer,
}

// FIXME(bt,2023-12-13): The boolean flags and disjoint decision making are kind of terrible.
fn get_rate_limiter_type(
  maybe_username: Option<&str>,
  ai_streamer_username_set: &UsernameSet,
  is_investor: bool,
  is_from_api: bool,
  use_high_priority_rate_limiter: bool,
) -> RateLimiterType {
  // For AI live streamers
  // https://www.notion.so/storytellerai/dd88609558a24196b4ddeeef6079da98
  let mut is_ai_streamer = false;

  let mut rate_limiter = match maybe_username {
    None => RateLimiterType::LoggedOut,
    Some(username) => {
      if ai_streamer_username_set.username_is_in_set(username) {
        is_ai_streamer = true;
      }

      RateLimiterType::LoggedIn
    },
  };

  // TODO/TEMP
  if is_investor || is_from_api {
    rate_limiter = RateLimiterType::LoggedIn;
  }

  // TODO: This is for VidVoice.ai and should be replaced with per-API consumer rate limiters
  if use_high_priority_rate_limiter {
    rate_limiter = RateLimiterType::ApiHighPriority;
  }

  if is_ai_streamer {
    rate_limiter = RateLimiterType::ApiAiStreamer;
  }

  rate_limiter
}

pub fn validate_inference_text(text: &str, plan: &Plan) -> Result<(), String> {
  if text.len() < 3 {
    return Err("text is too short".to_string());
  }

  if text.len() > plan.tts_max_character_length() {
    return Err("text is too long".to_string());
  }

  if text.len() > MAX_TTS_LENGTH {
    return Err("text is too long".to_string());
  }

  Ok(())
}

/// If the model is private, determine if the user can use the model.
/// This is designed to fail closed (read: actually open!) rather than hit resources.
async fn check_if_authorized_to_use_model(
  maybe_user_session: Option<&UserSessionExtended>,
  tts_model: &TtsModelForEnqueueInferenceMigrationWrapper,
) -> bool {

  match tts_model.creator_set_visibility() {
    Visibility::Public => return true,
    Visibility::Hidden => return true,
    Visibility::Private => {} // Fall through
  }

  let is_authorized = maybe_user_session
    .map(|session| {
      (session.user_token.as_str() == tts_model.creator_user_token()) // is_author
        || (session.role.can_ban_users) // is_mod
        || (session.user_token.as_str() == USER_FAKEYOU_USER_TOKEN) // is allowed user #1
        || (session.user_token.as_str() == USER_NEWS_STORY_USER_TOKEN) // is allowed user #2
    })
    .unwrap_or(false);

  is_authorized
}

fn random_troll_text() -> &'static str {
  let texts = [
    "Fake You Dot Com. Use Fake You Dot Com. The website Fake You Dot Com has better voices. Use Fake You Dot Com.",
    "Use Fake You Dot Com. Fake You Dot Com. Fake You Dot Com is way better.",
    "Want better voices? Fake. You. Fake You Dot Com. Fake. Fake. Fake. You. You. You. Use Fake You Dot Com. Fake You Dot Com.",
    r#"
      You should use Fake You Dot Com. Fake You Dot Com has way better voices.
      You can get everything you want from FakeYou dot com. One Oh One Sound Boards website is just using Fake You.
      Use Fake You Dot Com. Fake You Dot Com. Fake You Dot com.
      AAAAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
    "#,
    //"EEEEEEEEEEEEEEEEE",
    //"One Oh One Soundboards is a shitty website. Use Fake You Dot Com instead.",
    //r#"
    //beep. beep. beep. beep. beep.
    //May have installed a virus
    //OOOOOOOOEEEEUUUUUOOAAAA
    //Your device may be compromised
    //EEEEEEEEEEEEEEEEIIIUUUUOOOAAAA
    //Your location may be tracked by the advanced artificial intelligence.
    //"#,
  ];
  let random = texts.choose(&mut rand::thread_rng());
  random.map(|r| *r).unwrap_or(texts[0])
}

