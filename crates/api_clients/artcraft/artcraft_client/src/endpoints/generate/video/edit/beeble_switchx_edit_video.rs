use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::video::edit::beeble_switchx_edit_video::{
  BeebleSwitchXEditVideoRequest, BeebleSwitchXEditVideoResponse, BEEBLE_SWITCHX_EDIT_VIDEO_PATH,
};

pub async fn beeble_switchx_edit_video(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: BeebleSwitchXEditVideoRequest,
) -> Result<BeebleSwitchXEditVideoResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    BEEBLE_SWITCHX_EDIT_VIDEO_PATH,
    maybe_creds,
    request,
  ).await?)
}
