use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::object::generate_hunyuan_2_1_image_to_3d::{GenerateHunyuan21ImageTo3dRequest, GenerateHunyuan21ImageTo3dResponse, GENERATE_HUNYUAN_2_1_IMAGE_TO_3D_URL_PATH};

pub async fn generate_hunyuan3d_2_1_image_to_3d(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GenerateHunyuan21ImageTo3dRequest,
) -> Result<GenerateHunyuan21ImageTo3dResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    GENERATE_HUNYUAN_2_1_IMAGE_TO_3D_URL_PATH,
    maybe_creds,
    request,
  ).await?)
}
