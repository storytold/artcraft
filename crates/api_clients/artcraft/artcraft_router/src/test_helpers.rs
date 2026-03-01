use crate::api::common_image_model::CommonImageModel;
use crate::api::common_video_model::CommonVideoModel;
use crate::api::provider::Provider;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::client::router_client::RouterClient;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::utils::api_host::ApiHost;

pub fn get_artcraft_client() -> RouterClient {
  let cookies = std::fs::read_to_string("/Users/bt/Artcraft/credentials/artcraft_cookies.txt")
    .expect("Failed to read /Users/bt/Artcraft/credentials/artcraft_cookies.txt");
  let cookies = cookies.trim().to_string();
  let credentials = StorytellerCredentialSet::parse_multi_cookie_header(&cookies)
      .expect("Failed to parse cookies")
      .expect("No credentials found");
  RouterClient::Artcraft(RouterArtcraftClient::new(ApiHost::Storyteller, credentials))
}

pub fn base_image_request() -> GenerateImageRequest<'static> {
  GenerateImageRequest {
    model: CommonImageModel::NanaBananaPro,
    provider: Provider::Artcraft,
    prompt: Some("a cat in space"),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    idempotency_token: None,
  }
}

pub fn base_video_request() -> GenerateVideoRequest<'static> {
  GenerateVideoRequest {
    model: CommonVideoModel::Seedance2p0,
    provider: Provider::Artcraft,
    prompt: Some("a cat in space"),
    start_frame: None,
    end_frame: None,
    reference_images: None,
    resolution: None,
    aspect_ratio: None,
    duration_seconds: None,
    video_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    idempotency_token: None,
  }
}
