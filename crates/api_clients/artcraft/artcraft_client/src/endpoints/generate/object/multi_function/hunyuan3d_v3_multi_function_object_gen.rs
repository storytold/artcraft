use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::generate::object::multi_function::hunyuan3d_v3_multi_function_object_gen::{Hunyuan3dV3MultiFunctionObjectGenRequest, Hunyuan3dV3MultiFunctionObjectGenResponse, HUNYUAN3D_V3_MULTI_FUNCTION_OBJECT_GEN_PATH};

pub async fn hunyuan3d_v3_multi_function_object_gen(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: Hunyuan3dV3MultiFunctionObjectGenRequest,
) -> Result<Hunyuan3dV3MultiFunctionObjectGenResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    HUNYUAN3D_V3_MULTI_FUNCTION_OBJECT_GEN_PATH,
    maybe_creds,
    request,
  ).await?)
}
