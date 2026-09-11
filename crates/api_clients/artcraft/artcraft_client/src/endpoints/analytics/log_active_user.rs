use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_query_string_post_request::basic_query_string_post_request;
use artcraft_api_defs::analytics::log_active_user::{LogAppActiveUserRequest, LogAppActiveUserResponse, LOG_ACTIVE_USER_V1_PATH};
use std::collections::HashMap;

pub async fn log_active_user(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: LogAppActiveUserRequest,
) -> Result<LogAppActiveUserResponse, StorytellerError> {

  // TODO(bt): This is gross and doesn't automatically handle field changes.
  
  let mut query = HashMap::new();

  if let Some(token) = request.maybe_app_session_token {
    query.insert("maybe_app_session_token".to_string(), token.to_string());
  }

  if let Some(os_platform) = request.maybe_os_platform {
    query.insert("maybe_os_platform".to_string(), os_platform);
  }
  
  if let Some(os_version) = request.maybe_os_version {
    query.insert("maybe_os_version".to_string(), os_version);
  }
  
  if let Some(app_name) = request.maybe_app_name {
    query.insert("maybe_app_name".to_string(), app_name);
  }
  
  if let Some(app_version) = request.maybe_app_version {
    query.insert("maybe_app_version".to_string(), app_version);
  }
  
  if let Some(maybe_session_duration_seconds) = request.maybe_session_duration_seconds {
    query.insert("maybe_session_duration_seconds".to_string(), maybe_session_duration_seconds.to_string());
  }

  Ok(basic_query_string_post_request(
    api_host,
    LOG_ACTIVE_USER_V1_PATH,
    maybe_creds,
    &query,
  ).await?)
}
