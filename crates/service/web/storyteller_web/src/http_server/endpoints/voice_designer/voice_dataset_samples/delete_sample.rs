use std::sync::Arc;

use actix_web::web::Path;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use mysql_queries::queries::voice_designer::voice_samples::delete_sample::{delete_sample_as_mod, delete_sample_as_user, undelete_sample_as_mod, undelete_sample_as_user};
use mysql_queries::queries::voice_designer::voice_samples::get_dataset_sample::get_dataset_sample_by_token;
use tokens::tokens::zs_voice_dataset_samples::ZsVoiceDatasetSampleToken;

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::util::delete_role_disambiguation::{delete_role_disambiguation, DeleteRole};

// TODO(bt,2023-10-10): This is way too much boilerplate.

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct DeleteSamplePathInfo {
  sample_token: ZsVoiceDatasetSampleToken,
}

#[derive(Deserialize)]
pub struct DeleteSampleRequest {
  set_delete: bool,
  /// NB: this is only to disambiguate when a user is both a mod and an author.
  as_mod: Option<bool>,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn delete_sample_handler(
  http_request: HttpRequest,
  path: Path<DeleteSamplePathInfo>,
  request: web::Json<DeleteSampleRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<web::Json<SimpleGenericJsonSuccess>, CommonWebError> {

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
  // Only mods should see deleted models (both user_* and mod_* deleted).
  let is_mod_that_can_see_deleted = user_session.can_delete_other_users_tts_results;

  let inference_result_query_result = get_dataset_sample_by_token(
    &path.sample_token,
    is_mod_that_can_see_deleted,
    &server_state.mysql_pool,
  ).await;

  let dataset_sample = match inference_result_query_result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(CommonWebError::from_anyhow_error(e));
    }
    Ok(None) => return Err(CommonWebError::NotFound),
    Ok(Some(sample)) => sample,
  };

  // NB: Second set of permission checks
  let is_author = dataset_sample.maybe_creator_user_token
      .as_ref()
      .map(|creator_token| creator_token == &user_session.user_token)
      .unwrap_or(false);

  let is_mod = user_session.can_delete_other_users_tts_results;

  if !is_author && !is_mod {
    warn!("user is not allowed to delete samples: {:?}", user_session.user_token);
    return Err(CommonWebError::NotAuthorized);
  }

  let delete_role = delete_role_disambiguation(is_mod, is_author, request.as_mod);

  let query_result = if request.set_delete {
    match delete_role  {
      DeleteRole::ErrorDoNotDelete => {
        return Err(CommonWebError::NotAuthorized);
      }
      DeleteRole::AsUser => {
        delete_sample_as_user(&path.sample_token, &server_state.mysql_pool).await
      }
      DeleteRole::AsMod => {
        delete_sample_as_mod(&path.sample_token, &user_session.user_token, &server_state.mysql_pool).await
      }
    }
  } else {
    match delete_role  {
      DeleteRole::ErrorDoNotDelete => {
        return Err(CommonWebError::NotAuthorized);
      }
      DeleteRole::AsUser => {
        undelete_sample_as_user(&path.sample_token, &server_state.mysql_pool).await
      }
      DeleteRole::AsMod => {
        undelete_sample_as_mod(&path.sample_token, &user_session.user_token, &server_state.mysql_pool).await
      }
    }
  };

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Delete DB error: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  Ok(web::Json(SimpleGenericJsonSuccess { success: true }))
}
