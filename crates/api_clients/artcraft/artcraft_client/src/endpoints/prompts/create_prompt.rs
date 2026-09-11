use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::prompts::create_prompt::{CreatePromptRequest, CreatePromptResponse, CREATE_PROMPT_PATH};

pub async fn create_prompt(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: CreatePromptRequest,
) -> Result<CreatePromptResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    CREATE_PROMPT_PATH,
    maybe_creds,
    request,
  ).await?)
}
