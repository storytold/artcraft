use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::object::generate_hunyuan_2_0_image_to_3d::{GenerateHunyuan20ImageTo3dRequest, GenerateHunyuan20ImageTo3dResponse, GENERATE_HUNYUAN_2_0_IMAGE_TO_3D_URL_PATH};

pub async fn generate_hunyuan3d_2_0_image_to_3d(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GenerateHunyuan20ImageTo3dRequest,
) -> Result<GenerateHunyuan20ImageTo3dResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GENERATE_HUNYUAN_2_0_IMAGE_TO_3D_URL_PATH,
    maybe_creds,
    request,
  ).await?)
}
