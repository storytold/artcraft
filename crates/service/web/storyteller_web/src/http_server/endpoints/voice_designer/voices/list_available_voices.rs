use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::{info, warn};

use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use enums::common::visibility::Visibility;
use mysql_queries::queries::voice_designer::voices::list_voices_query_builder::ListVoicesQueryBuilder;
use tokens::tokens::zs_voices::ZsVoiceToken;

use crate::state::server_state::ServerState;

#[derive(Deserialize)]
pub struct ListZsVoicesQuery {
  pub sort_ascending: Option<bool>,
  pub limit: Option<u16>,
  pub cursor: Option<String>,
  pub cursor_is_reversed: Option<bool>,
}

#[derive(Serialize)]
pub struct ListZsVoicesSuccessResponse {
  pub success: bool,
  pub voices: Vec<ZsVoiceForList>,
  pub cursor_next: Option<String>,
  pub cursor_previous: Option<String>
}

#[derive(Serialize)]
pub struct ZsVoiceForList {
  pub voice_token: ZsVoiceToken,
  pub title: String,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub creator: UserDetailsLight,
  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
pub async fn list_available_voices_handler(
    http_request: HttpRequest,
    query: web::Query<ListZsVoicesQuery>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, CommonWebError> {

      let maybe_user_session = server_state.session_checker.maybe_get_user_session(
          &http_request,
          &server_state.mysql_pool
      ).await.map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

      let mut is_mod = false;
      let user_session = match maybe_user_session {
          Some(session) => {
              is_mod = session.can_ban_users;
              session
          }
          None => {
            info!("not logged in");
            return Err(CommonWebError::NotAuthorized);
          }
      };


      let limit = query.limit.unwrap_or(25);

      let sort_ascending = query.sort_ascending.unwrap_or(false);
      let cursor_is_reversed = query.cursor_is_reversed.unwrap_or(false);

      let cursor = if let Some(cursor) = query.cursor.as_deref() {
        let cursor = server_state.sort_key_crypto.decrypt_id(cursor)
            .map_err(|e| {
              warn!("crypto error: {:?}", e);
              CommonWebError::from_anyhow_error(e)
            })?;
        Some(cursor)
      } else {
        None
      };

    let include_user_hidden = is_mod;

    // NB(bt,2024-01-18): Showing mods deleted files is actually kind of annoying!
    const CAN_SEE_DELETED : bool = false;

    let mut query_builder = ListVoicesQueryBuilder::new()
        .sort_ascending(sort_ascending)
        .scope_creator_username(None)
        .include_user_hidden(include_user_hidden)
        .include_user_deleted_results(CAN_SEE_DELETED)
        .include_mod_deleted_results(CAN_SEE_DELETED)
        .limit(limit)
        .cursor_is_reversed(cursor_is_reversed)
        .offset(cursor);

    let query_results = query_builder.perform_query_for_page(&server_state.mysql_pool).await;


    let voices_page = match query_results {
        Ok(results) => results,
        Err(e) => {
            warn!("Query error: {:?}", e);
            return Err(CommonWebError::from_anyhow_error(e));
        }
    };

    let cursor_next = if let Some(id) = voices_page.last_id {
        let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
            .map_err(|e| {
                warn!("crypto error: {:?}", e);
                CommonWebError::from_anyhow_error(e)
            })?;
        Some(cursor)
    } else {
        None
    };

    let cursor_previous = if let Some(id) = voices_page.first_id {
        let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
            .map_err(|e| {
                warn!("crypto error: {:?}", e);
                CommonWebError::from_anyhow_error(e)
            })?;
        Some(cursor)
    } else {
        None
    };

    let response = ListZsVoicesSuccessResponse {
        success: true,
        voices: voices_page.voices.into_iter()
            .map(|voice| ZsVoiceForList {
              voice_token: voice.voice_token,
              title: voice.title,
              ietf_language_tag: voice.ietf_language_tag,
              ietf_primary_language_subtag: voice.ietf_primary_language_subtag,
              creator: UserDetailsLight::from_db_fields(
                &voice.creator_user_token,
                &voice.creator_username,
                &voice.creator_display_name,
                &voice.creator_email_gravatar_hash,
              ),
              creator_set_visibility: voice.creator_set_visibility,
              created_at: voice.created_at,
              updated_at: voice.updated_at,
            })
            .collect::<Vec<_>>(),
        cursor_next,
        cursor_previous,
    };

    let body = serde_json::to_string(&response)
        .map_err(CommonWebError::from_error)?;

    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .body(body))
}



