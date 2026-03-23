// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest, HttpResponse};
use log::{error, info, warn};

use enums_db::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use markdown::simple_markdown_to_html::simple_markdown_to_html;
use mysql_queries::queries::w2l::w2l_templates::edit_w2l_template::{edit_w2l_template, CreatorOrModFields, EditW2lTemplateArgs, ModFields};
use mysql_queries::queries::w2l::w2l_templates::get_w2l_template::select_w2l_template_by_token;
use user_input_common::check_for_slurs::contains_slurs;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct EditW2lTemplatePathInfo {
  template_token: String,
}

#[derive(Deserialize)]
pub struct EditW2lTemplateRequest {
  // ========== Author + Moderator options ==========
  pub title: Option<String>,
  pub description_markdown: Option<String>,
  pub creator_set_visibility: Option<String>,
  //pub updatable_slug: Option<String>,

  // ========== Moderator options ==========

  pub is_public_listing_approved: Option<bool>,
  pub is_locked_from_user_modification: Option<bool>,
  pub is_locked_from_use: Option<bool>,
  pub maybe_mod_comments: Option<String>,
}

#[derive(Debug)]
pub enum EditW2lTemplateError {
  BadInput(String),
  NotAuthorized,
  TemplateNotFound,
  ServerError,
}

impl ResponseError for EditW2lTemplateError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EditW2lTemplateError::BadInput(_) => StatusCode::BAD_REQUEST,
      EditW2lTemplateError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EditW2lTemplateError::TemplateNotFound => StatusCode::NOT_FOUND,
      EditW2lTemplateError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      EditW2lTemplateError::BadInput(reason) => reason.to_string(),
      EditW2lTemplateError::NotAuthorized=> "unauthorized".to_string(),
      EditW2lTemplateError::TemplateNotFound => "not found".to_string(),
      EditW2lTemplateError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for EditW2lTemplateError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn edit_w2l_template_handler(
  http_request: HttpRequest,
  path: Path<EditW2lTemplatePathInfo>,
  request: Json<EditW2lTemplateRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, EditW2lTemplateError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        EditW2lTemplateError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(EditW2lTemplateError::NotAuthorized);
    }
  };

  // NB: First permission check.
  // Only mods should see deleted templates (both user_* and mod_* deleted).
  let is_mod_that_can_see_deleted = user_session.can_delete_other_users_w2l_templates;

  let template_lookup_result = select_w2l_template_by_token(
    &path.template_token,
    is_mod_that_can_see_deleted,
    &server_state.mysql_pool).await;

  let template_record = match template_lookup_result {
    Ok(Some(result)) => {
      info!("Found template: {}", result.template_token);
      result
    },
    Ok(None) => {
      warn!("could not find template");
      return Err(EditW2lTemplateError::TemplateNotFound);
    },
    Err(err) => {
      warn!("error looking up template: {:?}", err);
      return Err(EditW2lTemplateError::TemplateNotFound);
    },
  };

  // NB: Second set of permission checks
  let is_author = template_record.creator_user_token == user_session.user_token.as_str();
  let is_mod = user_session.can_edit_other_users_w2l_templates ;

  if !is_author && !is_mod {
    return Err(EditW2lTemplateError::NotAuthorized);
  }

  if !is_mod {
    if template_record.is_locked_from_user_modification || template_record.is_locked_from_use {
      return Err(EditW2lTemplateError::NotAuthorized);
    }
  }

  // Author + Mod fields.
  // These fields must be present on all requests.
  let mut title = None;
  let mut description_markdown = None;
  let mut description_html = None;
  let mut creator_set_visibility = Visibility::Public;

  if let Some(payload) = request.title.as_deref() {
    if contains_slurs(payload) {
      return Err(EditW2lTemplateError::BadInput("title contains slurs".to_string()));
    }

    title = Some(payload.to_string());
  }

  if let Some(markdown) = request.description_markdown.as_deref() {
    if contains_slurs(markdown) {
      return Err(EditW2lTemplateError::BadInput("description contains slurs".to_string()));
    }

    let markdown = markdown.trim().to_string();
    let html = simple_markdown_to_html(&markdown);

    description_markdown = Some(markdown);
    description_html = Some(html);
  }

  if let Some(visibility) = request.creator_set_visibility.as_deref() {
    creator_set_visibility = Visibility::from_str(visibility)
        .map_err(|_| EditW2lTemplateError::BadInput("bad record visibility".to_string()))?;
  }

  let ip_address = get_request_ip(&http_request);

  let args = EditW2lTemplateArgs {
    w2l_template_token: &template_record.template_token,
    title: title.as_deref(),
    description_markdown: description_markdown.as_deref(),
    description_rendered_html: description_html.as_deref(),
    creator_set_visibility,
    role_dependent_fields: if is_author {
      CreatorOrModFields::CreatorFields {
        creator_ip_address: &ip_address,
      }
    } else {
      CreatorOrModFields::ModFields(ModFields {
        mod_user_token: user_session.user_token.as_str(),
        is_public_listing_approved: request.is_public_listing_approved.unwrap_or(false),
        is_locked_from_user_modification: request.is_locked_from_user_modification.unwrap_or(false),
        is_locked_from_use: request.is_locked_from_use.unwrap_or(false),
        maybe_mod_comments: request.maybe_mod_comments.as_deref(),
      })
    },
    mysql_pool: &server_state.mysql_pool,
  };

  edit_w2l_template(args)
      .await
      .map_err(|err| {
        error!("Update W2L template DB error: {:?}", err);
        EditW2lTemplateError::ServerError
      })?;

  Ok(simple_json_success())
}

