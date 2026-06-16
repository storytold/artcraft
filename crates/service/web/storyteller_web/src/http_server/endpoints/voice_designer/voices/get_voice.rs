use std::fmt;
use std::sync::Arc;

use actix_web::web::Path;
use actix_web::{web, HttpRequest};
use chrono::{DateTime, Utc};
use log::warn;

use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use enums::common::visibility::Visibility;
use mysql_queries::queries::voice_designer::voices::get_voice::get_voice_by_token;
use tokens::tokens::zs_voices::ZsVoiceToken;

use crate::state::server_state::ServerState;

#[derive(Serialize, Clone)]
pub struct GetVoiceResponse {
    success: bool,

    voice_token: ZsVoiceToken,
    title: String,

    ietf_language_tag: String,
    ietf_primary_language_subtag: String,

    creator: UserDetailsLight,

    creator_set_visibility: Visibility,

    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct GetVoicePathInfo {
    voice_token: String,
}
pub async fn get_voice_handler(
    http_request: HttpRequest,
    path: Path<GetVoicePathInfo>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<web::Json<GetVoiceResponse>, CommonWebError> {

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

    let voice_token = path.voice_token.clone();
    let creator_user_token = user_session.user_token.as_str().to_string();
    let is_mod = user_session.can_ban_users;

    let voice_lookup_result = get_voice_by_token(
        &ZsVoiceToken::new(voice_token.clone()),
        is_mod,
        &server_state.mysql_pool,
    ).await;

    let voice = match voice_lookup_result {
        Ok(Some(voice)) => voice,
        Ok(None) => {
            warn!("Voice not found: {:?}", voice_token);
            return Err(CommonWebError::NotFound);
        },
        Err(err) => {
            warn!("Error looking up voice: {:?}", err);
            return Err(CommonWebError::from_anyhow_error(err));
        }
    };

    let is_creator = voice.maybe_creator_user_token
        .map(|creator_user_token| creator_user_token.as_str() == user_session.user_token.as_str())
        .unwrap_or(false);

    if !is_creator && !is_mod {
        warn!("user is not allowed to view this voice: {:?}", user_session.user_token);
        return Err(CommonWebError::NotAuthorized);
    }

    let response = GetVoiceResponse {
        success: true,
        voice_token: voice.token,
        title: voice.title,
        ietf_language_tag: voice.ietf_language_tag,
        ietf_primary_language_subtag: voice.ietf_primary_language_subtag,
        creator: UserDetailsLight::from_db_fields(
            &user_session.user_token,
            user_session.username.as_ref(),
            user_session.display_name.as_ref(),
            user_session.email_gravatar_hash.as_ref(),
        ),
        creator_set_visibility: voice.creator_set_visibility,
        created_at: voice.created_at,
        updated_at: voice.updated_at,
    };

    Ok(web::Json(response))
}
