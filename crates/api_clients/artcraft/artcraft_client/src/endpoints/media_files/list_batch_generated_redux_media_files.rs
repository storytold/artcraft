use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_get_request::basic_json_get_request;
use artcraft_api_defs::media_file::list_batch_generated_media_files::{ListBatchGeneratedReduxMediaFilesSuccessResponse, LIST_BATCH_GENERATED_REDUX_MEDIA_FILES_URL_PATH};
use tokens::tokens::batch_generations::BatchGenerationToken;

pub async fn list_batch_generated_redux_media_files(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  batch_token: &BatchGenerationToken,
) -> Result<ListBatchGeneratedReduxMediaFilesSuccessResponse, StorytellerError> {
  let url = format!("{}/{}", LIST_BATCH_GENERATED_REDUX_MEDIA_FILES_URL_PATH, batch_token.to_string());
  Ok(basic_json_get_request(
    api_host,
    &url,
    maybe_creds,
  ).await?)
}
