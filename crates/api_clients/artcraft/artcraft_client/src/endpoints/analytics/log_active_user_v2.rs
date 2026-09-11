use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::analytics::log_active_user::{LogAppActiveUserRequest, LogAppActiveUserResponse, LOG_ACTIVE_USER_V2_PATH};

pub async fn log_active_user_v2(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: LogAppActiveUserRequest,
) -> Result<LogAppActiveUserResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    LOG_ACTIVE_USER_V2_PATH,
    maybe_creds,
    &request,
  ).await?)
}
