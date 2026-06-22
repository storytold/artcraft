use crate::api::router_image_model::RouterImageModel;
use crate::api::router_video_model::RouterVideoModel;
use crate::api::router_provider::RouterProvider;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::client::router_client::RouterClient;
use crate::client::router_fal_client::RouterFalClient;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::utils::api_host::ApiHost;
use fal_client::creds::fal_api_key::FalApiKey;

pub fn get_artcraft_client_for_env(host: ApiHost) -> RouterClient {
  let cookies = std::fs::read_to_string("/Users/bt/Artcraft/credentials/artcraft_cookies.txt")
    .expect("Failed to read /Users/bt/Artcraft/credentials/artcraft_cookies.txt");
  let cookies = cookies.trim().to_string();
  let credentials = StorytellerCredentialSet::parse_multi_cookie_header(&cookies)
      .expect("Failed to parse cookies")
      .expect("No credentials found");
  RouterClient::Artcraft(RouterArtcraftClient::new(host, credentials))
}

pub fn get_artcraft_client() -> RouterClient {
  get_artcraft_client_for_env(ApiHost::Storyteller)
}

pub fn base_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::NanoBananaPro,
    provider: RouterProvider::Artcraft,
    prompt: Some("a cat in space".to_string()),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
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
  RouterClient::Fal(RouterFalClient::new_with_webhook(api_key, webhook_url))
}

pub fn base_fal_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::NanoBananaPro,
    provider: RouterProvider::Fal,
    prompt: Some("a cat in space".to_string()),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_seedream_4_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::Seedream4,
    provider: RouterProvider::Artcraft,
    prompt: Some("a cat in space".to_string()),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_seedream_4p5_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::Seedream4p5,
    provider: RouterProvider::Artcraft,
    prompt: Some("a cat in space".to_string()),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_seedream_5_lite_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::Seedream5Lite,
    provider: RouterProvider::Artcraft,
    prompt: Some("a cat in space".to_string()),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_nano_banana_2_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::NanoBanana2,
    provider: RouterProvider::Artcraft,
    prompt: Some("a cat in space".to_string()),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_nano_banana_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::NanoBanana,
    provider: RouterProvider::Artcraft,
    prompt: Some("a cat in space".to_string()),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_gpt_image_1_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::GptImage1,
    provider: RouterProvider::Artcraft,
    prompt: Some("a cat in space".to_string()),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_gpt_image_2_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::GptImage2,
    provider: RouterProvider::Artcraft,
    prompt: Some("a cat in space".to_string()),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_gpt_image_1p5_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::GptImage1p5,
    provider: RouterProvider::Artcraft,
    prompt: Some("a cat in space".to_string()),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_flux_1_dev_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::Flux1Dev,
    provider: RouterProvider::Artcraft,
    prompt: Some("a cat in space".to_string()),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_flux_1_schnell_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::Flux1Schnell,
    provider: RouterProvider::Artcraft,
    prompt: Some("a cat in space".to_string()),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_flux_pro_1p1_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::FluxPro11,
    provider: RouterProvider::Artcraft,
    prompt: Some("a cat in space".to_string()),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_qwen_edit_2511_angles_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::QwenEdit2511Angles,
    provider: RouterProvider::Artcraft,
    prompt: None,
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_flux_2_lora_angles_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::Flux2LoraAngles,
    provider: RouterProvider::Artcraft,
    prompt: None,
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_flux_pro_1p1_ultra_image_request() -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model: RouterImageModel::FluxPro11Ultra,
    provider: RouterProvider::Artcraft,
    prompt: Some("a cat in space".to_string()),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  }
}

pub fn base_video_request() -> GenerateVideoRequestBuilder {
  GenerateVideoRequestBuilder {
    model: RouterVideoModel::Seedance2p0,
    provider: RouterProvider::Artcraft,
    prompt: Some("a cat in space".to_string()),
    negative_prompt: None,
    start_frame: None,
    end_frame: None,
    reference_images: None,
    reference_videos: None,
    reference_audio: None,
    reference_character_tokens: None,
    resolution: None,
    aspect_ratio: None,
    bitrate: None,
    duration_seconds: None,
    video_batch_count: None,
    generate_audio: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    idempotency_token: None,
  }
}
