use crate::api::common_image_model::CommonImageModel;
use crate::api::common_video_model::CommonVideoModel;
use crate::api::provider::Provider;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::client::router_client::RouterClient;
use crate::client::router_fal_client::RouterFalClient;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::utils::api_host::ApiHost;
use fal_client::creds::fal_api_key::FalApiKey;

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
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn get_fal_client() -> RouterClient {
  let secret = std::fs::read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")
    .expect("Failed to read /Users/bt/Artcraft/credentials/fal_api_key.txt");
  let api_key = FalApiKey::from_str(secret.trim());
  let webhook_url = "https://example.com/fal-webhook-test".to_string();
  RouterClient::Fal(RouterFalClient::new(api_key, webhook_url))
}

pub fn base_fal_image_request() -> GenerateImageRequest<'static> {
  GenerateImageRequest {
    model: CommonImageModel::NanaBananaPro,
    provider: Provider::Fal,
    prompt: Some("a cat in space"),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_seedream_4_image_request() -> GenerateImageRequest<'static> {
  GenerateImageRequest {
    model: CommonImageModel::Seedream4,
    provider: Provider::Artcraft,
    prompt: Some("a cat in space"),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_seedream_4p5_image_request() -> GenerateImageRequest<'static> {
  GenerateImageRequest {
    model: CommonImageModel::Seedream4p5,
    provider: Provider::Artcraft,
    prompt: Some("a cat in space"),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_seedream_5_lite_image_request() -> GenerateImageRequest<'static> {
  GenerateImageRequest {
    model: CommonImageModel::Seedream5Lite,
    provider: Provider::Artcraft,
    prompt: Some("a cat in space"),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_nano_banana_2_image_request() -> GenerateImageRequest<'static> {
  GenerateImageRequest {
    model: CommonImageModel::NanaBanana2,
    provider: Provider::Artcraft,
    prompt: Some("a cat in space"),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_nano_banana_image_request() -> GenerateImageRequest<'static> {
  GenerateImageRequest {
    model: CommonImageModel::NanaBanana,
    provider: Provider::Artcraft,
    prompt: Some("a cat in space"),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_gpt_image_1p5_image_request() -> GenerateImageRequest<'static> {
  GenerateImageRequest {
    model: CommonImageModel::GptImage1p5,
    provider: Provider::Artcraft,
    prompt: Some("a cat in space"),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_flux_1_dev_image_request() -> GenerateImageRequest<'static> {
  GenerateImageRequest {
    model: CommonImageModel::Flux1Dev,
    provider: Provider::Artcraft,
    prompt: Some("a cat in space"),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_flux_1_schnell_image_request() -> GenerateImageRequest<'static> {
  GenerateImageRequest {
    model: CommonImageModel::Flux1Schnell,
    provider: Provider::Artcraft,
    prompt: Some("a cat in space"),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_flux_pro_1p1_image_request() -> GenerateImageRequest<'static> {
  GenerateImageRequest {
    model: CommonImageModel::FluxPro11,
    provider: Provider::Artcraft,
    prompt: Some("a cat in space"),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_qwen_edit_2511_angles_image_request() -> GenerateImageRequest<'static> {
  GenerateImageRequest {
    model: CommonImageModel::QwenEdit2511Angles,
    provider: Provider::Artcraft,
    prompt: None,
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_flux_2_lora_angles_image_request() -> GenerateImageRequest<'static> {
  GenerateImageRequest {
    model: CommonImageModel::Flux2LoraAngles,
    provider: Provider::Artcraft,
    prompt: None,
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_flux_pro_1p1_ultra_image_request() -> GenerateImageRequest<'static> {
  GenerateImageRequest {
    model: CommonImageModel::FluxPro11Ultra,
    provider: Provider::Artcraft,
    prompt: Some("a cat in space"),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_video_request() -> GenerateVideoRequest<'static> {
  GenerateVideoRequest {
    model: CommonVideoModel::Seedance2p0,
    provider: Provider::Artcraft,
    prompt: Some("a cat in space"),
    negative_prompt: None,
    start_frame: None,
    end_frame: None,
    reference_images: None,
    resolution: None,
    aspect_ratio: None,
    duration_seconds: None,
    video_batch_count: None,
    generate_audio: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    idempotency_token: None,
  }
}
