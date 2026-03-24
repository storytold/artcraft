use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_delete_request::basic_json_delete_request;
use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use artcraft_api_defs::media_file::delete_media_file::DeleteMediaFileRequest;
use artcraft_api_defs::subscriptions::get_session_subscription::GetSessionSubscriptionResponse;
use log::debug;
use tokens::tokens::media_files::MediaFileToken;

pub async fn delete_media_file(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  media_file_token: &MediaFileToken,
) -> Result<SimpleGenericJsonSuccess, StorytellerError> {
  let url_path = get_url_path(media_file_token);

  debug!("Requesting {:?}", &url_path);
  
  // NB: We probably don't need to expose these options from FakeYou anymore.
  let request = DeleteMediaFileRequest {
    set_delete: true,
    as_mod: None,
  };

  Ok(basic_json_delete_request(
    api_host,
    &url_path,
    maybe_creds,
    request,
  ).await?)
}

fn get_url_path(token: &MediaFileToken) -> String {
  format!("/v1/media_files/file/{}", token.as_str())
}
