// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{debug, error, warn};
use sqlx::MySqlPool;

use crate::http_server::common_responses::user_avatars::default_avatar_color_from_username::default_avatar_color_from_username;
use crate::http_server::common_responses::user_avatars::default_avatar_from_username::default_avatar_from_username;
use crate::http_server::common_responses::user_details_lite::{UserDefaultAvatarInfo, UserDetailsLight};
use errors::AnyhowResult;
use mysql_queries::queries::tts::stats::calculate_tts_model_leaderboard::calculate_tts_model_leaderboard;
use tokens::tokens::users::UserToken;

use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;
use crate::state::server_state::ServerState;

#[derive(Serialize)]
pub struct LeaderboardResponse {
  success: bool,
  tts_leaderboard: Vec<LeaderboardRow>,
  w2l_leaderboard: Vec<LeaderboardRow>,
}

#[derive(Clone, Serialize)]
pub struct LeaderboardRow {
  pub user: UserDetailsLight,

  pub uploaded_count: i64,

  #[deprecated(note="switch to the user field (type UserDetailsLight)")]
  pub creator_user_token: String,

  #[deprecated(note="switch to the user field (type UserDetailsLight)")]
  pub username: String,

  #[deprecated(note="switch to the user field (type UserDetailsLight)")]
  pub display_name: String,

  #[deprecated(note="switch to the user field (type UserDetailsLight)")]
  pub gravatar_hash: String,

  #[deprecated(note="switch to the user field (type UserDetailsLight)")]
  pub default_avatar_index: u8,

  #[deprecated(note="switch to the user field (type UserDetailsLight)")]
  pub default_avatar_color_index: u8,
}

#[derive(Serialize, Debug)]
pub struct LeaderboardErrorResponse {
  pub success: bool,
  pub error_type: LeaderboardErrorType,
  pub error_message: String,
}

#[derive(Copy, Clone, Debug, Serialize)]
pub enum LeaderboardErrorType {
  ServerError,
}

impl LeaderboardErrorResponse {
  fn server_error() -> Self {
    Self {
      success: false,
      error_type: LeaderboardErrorType::ServerError,
      error_message: "server error".to_string()
    }
  }
}

impl ResponseError for LeaderboardErrorResponse {
  fn status_code(&self) -> StatusCode {
    match self.error_type {
      LeaderboardErrorType::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for LeaderboardErrorResponse {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self.error_type)
  }
}

pub async fn leaderboard_handler(
  _http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, LeaderboardErrorResponse> {

  let maybe_cached = server_state.caches.ephemeral.leaderboard.grab_copy_without_bump_if_unexpired()
      .map_err(|e| {
        error!("error consulting cache: {:?}", e);
        LeaderboardErrorResponse::server_error()
      })?;


  let leaderboard_info = match maybe_cached {
    Some(leaderboard) => {
      leaderboard
    }
    None => {
      debug!("populating leaderboard from database");

      let leaderboard_query_result = query_leaderboard(
        &server_state.mysql_pool
      ).await;

      match leaderboard_query_result {
        // If the database misbehaves (eg. DDoS), let's stop spamming it.
        // We'll attempt to read the old value from the cache and keep going.
        Err(err) => {
          warn!("error querying database / inserting into cache: {:?}", err);

          let maybe_cached = server_state.caches.ephemeral.leaderboard.grab_even_expired_and_bump()
              .map_err(|err| {
                error!("error consulting cache (even expired): {:?}", err);
                LeaderboardErrorResponse::server_error()
              })?;

          maybe_cached.ok_or_else(|| {
            error!("error querying database and subsequently reading cache: {:?}", err);
            LeaderboardErrorResponse::server_error()
          })?
        }

        // Happy path...
        Ok(leaderboard_info) => {
          server_state.caches.ephemeral.leaderboard.store_copy(&leaderboard_info)
              .map_err(|e| {
                error!("error storing cache: {:?}", e);
                LeaderboardErrorResponse::server_error()
              })?;

          leaderboard_info
        }
      }
    }
  };

  let response = LeaderboardResponse {
    success: true,
    tts_leaderboard: leaderboard_info.tts_leaderboard,
    w2l_leaderboard: vec![],
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| LeaderboardErrorResponse::server_error())?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

#[derive(Clone)]
pub struct LeaderboardInfo {
  tts_leaderboard: Vec<LeaderboardRow>,
}

async fn query_leaderboard(mysql_pool: &MySqlPool) -> AnyhowResult<LeaderboardInfo> {
  let mut mysql_connection = mysql_pool.acquire().await?;

  let tts_results = calculate_tts_model_leaderboard(&mut mysql_connection)
      .await?
      .into_iter()
      .map(|record| LeaderboardRow {
        creator_user_token: record.creator_user_token.clone(),
        username: record.username.to_string(),
        display_name: record.display_name.to_string(),
        gravatar_hash: record.gravatar_hash.to_string(),
        default_avatar_index: default_avatar_from_username(&record.username),
        default_avatar_color_index: default_avatar_color_from_username(&record.username),
        user: UserDetailsLight {
          user_token: UserToken::new_from_str(&record.creator_user_token),
          username: record.username.to_string(),
          display_name: record.display_name,
          gravatar_hash: record.gravatar_hash,
          default_avatar: UserDefaultAvatarInfo::from_username(&record.username),
        },
        uploaded_count: record.uploaded_count,
      })
      .collect();

  Ok(LeaderboardInfo {
    tts_leaderboard: tts_results,
  })
}
