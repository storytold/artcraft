use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_get_request::basic_json_get_request;
use artcraft_api_defs::credits::get_session_credits::GetSessionCreditsResponse;
use enums::common::payments_namespace::PaymentsNamespace;

pub async fn get_session_credits(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  payments_namespace: PaymentsNamespace
) -> Result<GetSessionCreditsResponse, StorytellerError> {
  let url_path = get_url_path(payments_namespace);

  Ok(basic_json_get_request(
    api_host,
    &url_path,
    maybe_creds,
  ).await?)
}


fn get_url_path(payments_namespace: PaymentsNamespace) -> String {
  let payments_namespace = payments_namespace.to_str();
  format!("/v1/credits/namespace/{}", payments_namespace)
}

