use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;

use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::model_categories::create_category::{create_category, CreateCategoryArgs};
use tokens::tokens::model_categories::ModelCategoryToken;

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

const DEFAULT_CAN_DIRECTLY_HAVE_MODELS : bool = true;
const DEFAULT_CAN_HAVE_SUBCATEGORIES : bool = false;
const DEFAULT_CAN_ONLY_MODS_APPLY : bool = false;

// =============== Request ===============

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ModelType {
  /// 'tts' in database
  Tts,
  /// 'w2l' in database
  W2l,
}

#[derive(Deserialize)]
pub struct CreateCategoryRequest {
  // Fields for everyone
  pub name: Option<String>,
  pub model_type: Option<ModelType>,
  pub idempotency_token: Option<String>,

  // Fields for moderators only
  pub can_directly_have_models: Option<bool>,
  pub can_have_subcategories: Option<bool>,
  pub can_only_mods_apply: Option<bool>,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct CreateCategoryResponse {
  pub success: bool,
  pub token: Option<String>,
}

// =============== Error Response ===============
// NB: Not using DeriveMore since Clion doesn't understand it.
// =============== Handler ===============

pub async fn create_category_handler(
  http_request: HttpRequest,
  request: web::Json<CreateCategoryRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  // NB: First permission check.
  // TODO: We don't have a permission for categories, so we use this as a proxy.
  let is_mod = user_session.can_ban_users;

  let model_type = match request.model_type {
    None => {
      return Err(CommonWebError::BadInputWithSimpleMessage("no model type".to_string()));
    }
    Some(ModelType::Tts) => "tts",
    Some(ModelType::W2l) => "w2l",
  };

  let idempotency_token = request.idempotency_token
      .clone()
      .ok_or(CommonWebError::BadInputWithSimpleMessage("no idempotency token provided".to_string()))?;

  let name = request.name
      .clone()
      .ok_or(CommonWebError::BadInputWithSimpleMessage("no name provided".to_string()))?;

  let category_token = ModelCategoryToken::generate().to_string();

  let creator_ip_address = get_request_ip(&http_request);

  let mut is_mod_approved = false;
  let mut maybe_mod_user_token = None;
  let mut can_directly_have_models = DEFAULT_CAN_DIRECTLY_HAVE_MODELS;
  let mut can_have_subcategories = DEFAULT_CAN_HAVE_SUBCATEGORIES;
  let mut can_only_mods_apply = DEFAULT_CAN_ONLY_MODS_APPLY;

  if is_mod {
    // Moderator fields and adjustments
    is_mod_approved = true;
    maybe_mod_user_token = Some(user_session.user_token.as_str().to_string());
    can_directly_have_models = request.can_directly_have_models
        .unwrap_or(DEFAULT_CAN_DIRECTLY_HAVE_MODELS);
    can_have_subcategories = request.can_have_subcategories
        .unwrap_or(DEFAULT_CAN_HAVE_SUBCATEGORIES);
    can_only_mods_apply = request.can_only_mods_apply
        .unwrap_or(DEFAULT_CAN_ONLY_MODS_APPLY);
  }

  let query_result = create_category(CreateCategoryArgs {
    category_token: &category_token,
    idempotency_token: &idempotency_token,
    model_type,
    name: &name,
    creator_user_token: user_session.user_token.as_str(),
    creator_ip_address: &creator_ip_address,
    is_mod_approved,
    maybe_mod_user_token: maybe_mod_user_token.as_deref(),
    can_directly_have_models,
    can_have_subcategories,
    can_only_mods_apply,
    mysql_pool: &server_state.mysql_pool,
  }).await;

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Create category edit DB error: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  let response = CreateCategoryResponse {
    success: true,
    token: Some(category_token.to_string())
  };

  let body = serde_json::to_string(&response)
      ?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
