use std::fmt;
use std::sync::Arc;

use actix_web::web::Path;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use chrono::{DateTime, Utc};
use log::warn;

use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use enums::common::visibility::Visibility;
use mysql_queries::queries::voice_designer::datasets::get_dataset::get_dataset_by_token;
use tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken;

use crate::state::server_state::ServerState;

#[derive(Serialize, Clone)]
pub struct GetDatasetResponse {
    success: bool,

    dataset_token: ZsVoiceDatasetToken,
    title: String,

    ietf_language_tag: String,
    ietf_primary_language_subtag: String,

    creator: UserDetailsLight,

    creator_set_visibility: Visibility,

    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct GetDatasetPathInfo {
    dataset_token: String,
}
pub async fn get_dataset_handler(
    http_request: HttpRequest,
    path: Path<GetDatasetPathInfo>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GetDatasetResponse>, CommonWebError> {

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

    let dataset_token = path.dataset_token.clone();
    let creator_user_token = user_session.user_token.as_str().to_string();
    let is_mod = user_session.can_ban_users;

    let dataset_lookup_result = get_dataset_by_token(
        &ZsVoiceDatasetToken::new(dataset_token.clone()),
        is_mod,
        &server_state.mysql_pool,
    ).await;

    let dataset = match dataset_lookup_result {
        Ok(Some(dataset)) => dataset,
        Ok(None) => {
            warn!("Dataset not found: {:?}", dataset_token);
            return Err(CommonWebError::NotFound);
        },
        Err(err) => {
            warn!("Error looking up dataset: {:?}", err);
            return Err(CommonWebError::from_anyhow_error(err));
        }
    };

    let is_creator = dataset.maybe_creator_user_token.as_deref()
        .map(|creator_user_token| creator_user_token == user_session.user_token.as_str())
        .unwrap_or(false);

    if !is_creator && !is_mod {
        warn!("user is not allowed to view this dataset: {:?}", user_session.user_token);
        return Err(CommonWebError::NotAuthorized);
    }

    let response = GetDatasetResponse {
        success: true,
        dataset_token: dataset.token,
        title: dataset.title,
        ietf_language_tag: dataset.ietf_language_tag,
        ietf_primary_language_subtag: dataset.ietf_primary_language_subtag,
        creator: UserDetailsLight::from_db_fields(
            &user_session.user_token,
            user_session.username.as_ref(),
            user_session.display_name.as_ref(),
            user_session.email_gravatar_hash.as_ref(),
        ),
        creator_set_visibility: dataset.creator_set_visibility,
        created_at: dataset.created_at,
        updated_at: dataset.updated_at,
    };

    Ok(Json(response))
}
