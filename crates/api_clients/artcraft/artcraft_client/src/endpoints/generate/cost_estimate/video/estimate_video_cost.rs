use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::cost_estimate::estimate_video_cost::{
  EstimateVideoCostRequest, EstimateVideoCostResponse, ESTIMATE_VIDEO_COST_PATH,
};

pub async fn estimate_video_cost(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: EstimateVideoCostRequest,
) -> Result<EstimateVideoCostResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    ESTIMATE_VIDEO_COST_PATH,
    maybe_creds,
    request,
  ).await?)
}
