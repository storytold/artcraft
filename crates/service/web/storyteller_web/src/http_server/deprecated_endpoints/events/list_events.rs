use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use derive_more::Display;
use log::error;

use crate::http_server::common_responses::user_avatars::default_avatar_color_from_username::default_avatar_color_from_username;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::user_avatars::default_avatar_from_username::default_avatar_from_username;
use mysql_queries::queries::public_event_feed::list_public_event_feed_items::list_public_event_feed_items;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

#[derive(Serialize)]
pub struct EventRecord {
  pub event_token: String,
  pub event_type: String,

  // User information (new)
  pub maybe_target_user_info: Option<TargetUserInfo>,

  // User information (deprecated)
  #[deprecated(note="don't remove until frontend removes")]
  pub maybe_target_user_token: Option<String>,
  #[deprecated(note="don't remove until frontend removes")]
  pub maybe_target_username: Option<String>,
  #[deprecated(note="don't remove until frontend removes")]
  pub maybe_target_display_name: Option<String>,
  #[deprecated(note="don't remove until frontend removes")]
  pub maybe_target_user_gravatar_hash: Option<String>,

  // Link to created entity
  pub maybe_target_entity_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct TargetUserInfo {
  pub user_token: String,
  pub username: String,
  pub display_name: String,
  pub gravatar_hash: String,
  pub default_avatar_index: u8,
  pub default_avatar_color_index: u8,
}

#[derive(Serialize)]
pub struct ListEventsSuccessResponse {
  pub success: bool,
  pub events: Vec<EventRecord>,
}
pub async fn list_events_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, CommonWebError> {

  // NB: Since this is publicly exposed, we don't query sensitive data.
  let events = list_public_event_feed_items(&server_state.mysql_pool)
      .await
      .map_err(|err| {
        error!("error querying for event feed events: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?
      .into_iter()
      .map(|event| {
        let mut maybe_target_user_info = None;

        // TODO/FIXME: Flock of seagulls + danger of a thing being null
        if let Some(user_token) = event.maybe_target_user_token.as_deref() {
          if let Some(username) = event.maybe_target_username.as_deref() {
            if let Some(display_name) = event.maybe_target_display_name.as_deref() {
              if let Some(gravatar_hash) = event.maybe_target_user_gravatar_hash.as_deref() {
                maybe_target_user_info = Some(TargetUserInfo {
                  user_token: user_token.to_string(),
                  username: username.to_string(),
                  display_name: display_name.to_string(),
                  gravatar_hash: gravatar_hash.to_string(),
                  default_avatar_index: default_avatar_from_username(&username),
                  default_avatar_color_index: default_avatar_color_from_username(&username),
                })
              }
            }
          }
        }

        EventRecord {
          event_token: event.event_token,
          event_type: event.event_type,
          maybe_target_user_info,
          maybe_target_user_token: event.maybe_target_user_token,
          maybe_target_username: event.maybe_target_username,
          maybe_target_display_name: event.maybe_target_display_name,
          maybe_target_user_gravatar_hash: event.maybe_target_user_gravatar_hash,
          maybe_target_entity_token: event.maybe_target_entity_token,
          created_at: event.created_at,
          updated_at: event.updated_at,
        }
      })
      .collect();

  let response = ListEventsSuccessResponse {
    success: true,
    events,
  };

  let body = serde_json::to_string(&response)
    .map_err(CommonWebError::from_error)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}
