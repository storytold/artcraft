// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use enums::by_table::comments::comment_entity_type::CommentEntityType;
use http_server_common::request::get_request_ip::get_request_ip;
use markdown::simple_markdown_to_html::simple_markdown_to_html;
use mysql_queries::queries::comments::comment_entity_token::CommentEntityToken;
use mysql_queries::queries::comments::insert_comment::{insert_comment, InsertCommentArgs};
use tokens::tokens::comments::CommentToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::tts_results::TtsResultToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::w2l_results::W2lResultToken;
use tokens::tokens::w2l_templates::W2lTemplateToken;
use user_input_common::check_for_slurs::contains_slurs;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct CreateCommentRequest {
  uuid_idempotency_token: String,
  entity_token: String,
  entity_type: CommentEntityType,
  comment_markdown: String,
}

#[derive(Serialize, ToSchema)]
pub struct CreateCommentSuccessResponse {
  pub success: bool,
  pub comment_token: CommentToken,
}

#[derive(Debug, ToSchema)]
pub enum CreateCommentError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for CreateCommentError {
  fn status_code(&self) -> StatusCode {
    match *self {
      CreateCommentError::BadInput(_) => StatusCode::BAD_REQUEST,
      CreateCommentError::NotAuthorized => StatusCode::UNAUTHORIZED,
      CreateCommentError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      CreateCommentError::BadInput(reason) => reason.to_string(),
      CreateCommentError::NotAuthorized => "unauthorized".to_string(),
      CreateCommentError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for CreateCommentError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Add a comment to an entity (file, model, user, etc.)
#[utoipa::path(
  post,
  tag = "Comments",
  path = "/v1/comments/new",
  responses(
    (status = 200, description = "Success", body = CreateCommentSuccessResponse),
    (status = 400, description = "Bad input", body = CreateCommentError),
    (status = 401, description = "Not authorized", body = CreateCommentError),
    (status = 500, description = "Server error", body = CreateCommentError),
  ),
  params(
    ("request" = CreateCommentRequest, description = "Payload for Request"),
  )
)]
pub async fn create_comment_handler(
  http_request: HttpRequest,
  request: web::Json<CreateCommentRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<web::Json<CreateCommentSuccessResponse>, CreateCommentError>
{
  // NB(bt,2023-12-14): Kasisnu found that we're getting entity type mismatches in production. Apart from
  // querying the database for entity existence, this is the next best way to prevent incorrect comment
  // attachment. This is a bit of a bad process, though, since the token types are supposed to be opaque.
  let token = request.entity_token.as_str();
  let token_prefix_matches = match request.entity_type {
    // NB: Users had an older prefix (U:) that got replaced with the new prefix (user_)
    CommentEntityType::User => token.starts_with(UserToken::token_prefix()) || token.starts_with("U:"),
    CommentEntityType::MediaFile => token.starts_with(MediaFileToken::token_prefix()),
    CommentEntityType::ModelWeight => token.starts_with(ModelWeightToken::token_prefix()),
    CommentEntityType::TtsModel => token.starts_with(TtsModelToken::token_prefix()),
    CommentEntityType::TtsResult => token.starts_with(TtsResultToken::token_prefix()),
    CommentEntityType::W2lTemplate => token.starts_with(W2lTemplateToken::token_prefix()),
    CommentEntityType::W2lResult => token.starts_with(W2lResultToken::token_prefix()),
  };

  if !token_prefix_matches {
    warn!("invalid token prefix: {:?} for {:?}", request.entity_token, request.entity_type);
    return Err(CreateCommentError::BadInput("invalid token prefix".to_string()));
  }

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        CreateCommentError::ServerError
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CreateCommentError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CreateCommentError::NotAuthorized);
    }
  };

  let ip_address = get_request_ip(&http_request);

  let entity_token = CommentEntityToken::from_entity_type_and_token(
    request.entity_type, &request.entity_token);

  if contains_slurs(&request.comment_markdown) {
    return Err(CreateCommentError::BadInput("comment contains slurs".to_string()));
  }

  let markdown = request.comment_markdown.trim().to_string();
  let html = simple_markdown_to_html(&markdown);

  let query_result = insert_comment(InsertCommentArgs {
    entity_token: &entity_token,
    uuid_idempotency_token: &request.uuid_idempotency_token,
    user_token: &user_session.user_token,
    comment_markdown: &markdown,
    comment_rendered_html: &html,
    creator_ip_address: &ip_address,
    mysql_executor: &mut *mysql_connection,
    phantom: Default::default(),
  }).await;

  let comment_token = match query_result {
    Ok(token) => token,
    Err(err) => {
      warn!("error inserting comment: {:?}", err);
      return Err(CreateCommentError::ServerError);
    }
  };

  server_state.firehose_publisher.publish_comment_created(
    &user_session.user_token, &comment_token)
      .await
      .map_err(|e| {
        warn!("error publishing event: {:?}", e);
        CreateCommentError::ServerError
      })?;

  let response = CreateCommentSuccessResponse {
    success: true,
    comment_token,
  };

  Ok(web::Json(response))
}
