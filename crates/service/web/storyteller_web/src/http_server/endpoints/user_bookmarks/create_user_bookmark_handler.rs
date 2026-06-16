// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{error, warn};
use sqlx::Acquire;
use utoipa::ToSchema;

use enums::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use mysql_queries::queries::entity_stats::stats_entity_token::StatsEntityToken;
use mysql_queries::queries::entity_stats::upsert_entity_stats_on_bookmark_event::{upsert_entity_stats_on_bookmark_event, BookmarkAction, UpsertEntityStatsArgs};
use mysql_queries::queries::users::user_bookmarks::get_total_bookmark_count_for_entity::get_total_bookmark_count_for_entity;
use mysql_queries::queries::users::user_bookmarks::get_user_bookmark_transactional_locking::{get_user_bookmark_transactional_locking, BookmarkIdentifier};
use mysql_queries::queries::users::user_bookmarks::upsert_user_bookmark::{upsert_user_bookmark, CreateUserBookmarkArgs};
use mysql_queries::queries::users::user_bookmarks::user_bookmark_entity_token::UserBookmarkEntityToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::tts_results::TtsResultToken;
use tokens::tokens::user_bookmarks::UserBookmarkToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::voice_conversion_models::VoiceConversionModelToken;
use tokens::tokens::w2l_results::W2lResultToken;
use tokens::tokens::w2l_templates::W2lTemplateToken;
use tokens::tokens::zs_voices::ZsVoiceToken;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct CreateUserBookmarkRequest {
  entity_token: String,
  entity_type: UserBookmarkEntityType,
}

#[derive(Serialize, ToSchema)]
pub struct CreateUserBookmarkSuccessResponse {
  pub success: bool,
  pub user_bookmark_token: UserBookmarkToken,

  /// This is the new bookmark count (across all users) for the entity in question.
  pub new_bookmark_count_for_entity: usize,
}

#[derive(Debug, ToSchema)]
pub enum CreateUserBookmarkError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for CreateUserBookmarkError {
  fn status_code(&self) -> StatusCode {
    match *self {
      CreateUserBookmarkError::BadInput(_) => StatusCode::BAD_REQUEST,
      CreateUserBookmarkError::NotAuthorized => StatusCode::UNAUTHORIZED,
      CreateUserBookmarkError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      CreateUserBookmarkError::BadInput(reason) => reason.to_string(),
      CreateUserBookmarkError::NotAuthorized => "unauthorized".to_string(),
      CreateUserBookmarkError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for CreateUserBookmarkError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[utoipa::path(
  post,
  tag = "User Bookmarks",
  path = "/v1/user_bookmarks/create",
  request_body = CreateUserBookmarkRequest,
  responses(
    (status = 200, body = CreateUserBookmarkSuccessResponse),
    (status = 400, body = CreateUserBookmarkError),
  )
)]
pub async fn create_user_bookmark_handler(
  http_request: HttpRequest,
  request: web::Json<CreateUserBookmarkRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<web::Json<CreateUserBookmarkSuccessResponse>, CreateUserBookmarkError>
{
  // NB(bt,2023-12-14): Kasisnu found that we're getting entity type mismatches in production. Apart from
  // querying the database for entity existence, this is the next best way to prevent incorrect comment
  // attachment. This is a bit of a bad process, though, since the token types are supposed to be opaque.
  let token = request.entity_token.as_str();
  let token_prefix_matches = match request.entity_type {
    // NB: Users had an older prefix (U:) that got replaced with the new prefix (user_)
    UserBookmarkEntityType::User => token.starts_with(UserToken::token_prefix()) || token.starts_with("U:"),
    UserBookmarkEntityType::MediaFile => token.starts_with(MediaFileToken::token_prefix()),
    UserBookmarkEntityType::ModelWeight => token.starts_with(ModelWeightToken::token_prefix()),
    UserBookmarkEntityType::TtsModel => token.starts_with(TtsModelToken::token_prefix()),
    UserBookmarkEntityType::TtsResult => token.starts_with(TtsResultToken::token_prefix()),
    UserBookmarkEntityType::W2lTemplate => token.starts_with(W2lTemplateToken::token_prefix()),
    UserBookmarkEntityType::W2lResult => token.starts_with(W2lResultToken::token_prefix()),
    UserBookmarkEntityType::VoiceConversionModel => token.starts_with(VoiceConversionModelToken::token_prefix()),
    UserBookmarkEntityType::ZsVoice => token.starts_with(ZsVoiceToken::token_prefix()),
  };

  if !token_prefix_matches {
    warn!("invalid token prefix: {:?} for {:?}", request.entity_token, request.entity_type);
    return Err(CreateUserBookmarkError::BadInput("invalid token prefix".to_string()));
  }

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        CreateUserBookmarkError::ServerError
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CreateUserBookmarkError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CreateUserBookmarkError::NotAuthorized);
    }
  };

  let entity_token = UserBookmarkEntityToken::from_entity_type_and_token(
    request.entity_type, &request.entity_token);

  let mut transaction = mysql_connection.begin().await
      .map_err(|err| {
        error!("error creating transaction: {:?}", err);
        CreateUserBookmarkError::ServerError
      })?;

  let maybe_existing_user_bookmark = get_user_bookmark_transactional_locking(
    BookmarkIdentifier::EntityTypeAndToken(&entity_token),
    &mut *transaction
  ).await
      .map_err(|err| {
        error!("error getting user bookmark: {:?}", err);
        CreateUserBookmarkError::ServerError
      })?;

  let upsert_result = upsert_user_bookmark(CreateUserBookmarkArgs {
    entity_token: &entity_token,
    user_token: &user_session.user_token,
    mysql_executor: &mut *transaction,
    phantom: Default::default(),
  }).await;

  let user_bookmark_token = match upsert_result {
    Ok(token) => token,
    Err(err) => {
      warn!("error upserting user_bookmark: {:?}", err);
      return Err(CreateUserBookmarkError::ServerError);
    }
  };

  // Increment only if we're creating or undeleting a bookmark
  let increment_bookmark_count =
      maybe_existing_user_bookmark.is_none() ||
          maybe_existing_user_bookmark.map(|bookmark| bookmark.maybe_deleted_at.is_some())
              .unwrap_or(false);

  if increment_bookmark_count {
    // NB: Not all bookmarkable things have stats (eg. deprecated record types don't have stats).
    let maybe_stats_entity_token =
        StatsEntityToken::from_bookmark_entity_type_and_token(request.entity_type, &request.entity_token);

    if let Some(stats_entity_token) = maybe_stats_entity_token {
      upsert_entity_stats_on_bookmark_event(UpsertEntityStatsArgs {
        stats_entity_token: &stats_entity_token,
        action: BookmarkAction::Add,
        mysql_executor: &mut *transaction,
        phantom: Default::default(),

      }).await.map_err(|err| {
        error!("error recording stats: {:?}", err);
        CreateUserBookmarkError::ServerError
      })?;
    }
  }

  transaction.commit().await
      .map_err(|err| {
        error!("error committing transaction: {:?}", err);
        CreateUserBookmarkError::ServerError
      })?;

  // TODO(bt,2024-01-04): The methods of stats collection here differs.
  //  Update this to return directly from the stats table instead of doing a COUNT(*).

  let count = get_total_bookmark_count_for_entity(&entity_token, &mut mysql_connection)
      .await
      .map_err(|err| {
        warn!("error getting updated bookmark count: {:?}", err);
        CreateUserBookmarkError::ServerError
      })?;

  let response = CreateUserBookmarkSuccessResponse {
    success: true,
    user_bookmark_token,
    new_bookmark_count_for_entity: count.total_count,
  };

  Ok(web::Json(response))
}
