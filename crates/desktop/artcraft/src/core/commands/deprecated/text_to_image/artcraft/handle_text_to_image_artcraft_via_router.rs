use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio as CommonAspectRatio2;
use crate::core::api_adapters::resolution::common_resolution::CommonResolution as CommonResolution2;
use crate::core::commands::enqueue::generate_error::{GenerateError, MissingCredentialsReason};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::deprecated::text_to_image::enqueue_text_to_image_command::{
  EnqueueTextToImageRequest, TextToImageResolution, TextToImageSize,
};
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_router::api::router_aspect_ratio::RouterAspectRatio;
use artcraft_router::api::router_image_model::RouterImageModel;
use artcraft_router::api::router_resolution::RouterResolution;
use artcraft_router::api::router_quality::RouterQuality;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::router_provider::RouterProvider;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::client::router_artcraft_client::RouterArtcraftClient;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use artcraft_router::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info};

pub(super) async fn handle_text_to_image_artcraft_via_router(
  request: &EnqueueTextToImageRequest,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
  model: RouterImageModel,
  generation_model: GenerationModel,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => return Err(GenerateError::MissingCredentials(MissingCredentialsReason::NeedsStorytellerCredentials)),
  };

  let client = RouterClient::Artcraft(RouterArtcraftClient::new(
    app_env_configs.storyteller_host.clone(),
    creds,
  ));

  let image_inputs = request.image_media_tokens.clone().map(ImageListRef::MediaFileTokens);

  let aspect_ratio = get_aspect_ratio_t2i(request);
  let resolution = get_resolution_t2i(request);
  let quality = get_quality_t2i(request);

  let router_request = GenerateImageRequestBuilder {
    model,
    provider: RouterProvider::Artcraft,
    prompt: request.prompt.clone(),
    image_inputs,
    resolution,
    aspect_ratio,
    quality,
    image_batch_count: request.number_images.map(|n| n as u16),
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
  };

  let dor = router_request.build2()?;

  info!("Image Generation Request: {:?}", dor);

  let request = match dor {
    ImageGenerationDraftOrRequest::Request(req) => req,
    // Artcraft never returns a Draft — image-token resolution happens server-side.
    ImageGenerationDraftOrRequest::Draft(d) => match d {},
  };

  let response = match request.send_request(&client).await {
    Ok(resp) => {
      info!("Successfully enqueued.");
      resp
    }
    Err(err) => {
      error!("Failed to enqueue: {:?}", err);
      return Err(GenerateError::from(err));
    }
  };

  let job_id = response
    .get_artcraft_payload()
    .map(|p| p.inference_job_token.to_string())
    .ok_or(GenerateError::ResponseHadNoJobTokens)?;

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::ImageGeneration,
    model: Some(generation_model),
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(job_id),
    maybe_queue_status_url: None,
    maybe_prompt_token: None,
    maybe_queue_response_url: None,
  })
}

fn get_aspect_ratio_t2i(request: &EnqueueTextToImageRequest) -> Option<RouterAspectRatio> {
  if let Some(ar) = request.common_aspect_ratio {
    return Some(convert_desktop_aspect_ratio(ar));
  }
  if let Some(ar) = request.aspect_ratio {
    return Some(match ar {
      TextToImageSize::Auto => RouterAspectRatio::Auto,
      TextToImageSize::Square => RouterAspectRatio::Square,
      TextToImageSize::Wide => RouterAspectRatio::Wide,
      TextToImageSize::Tall => RouterAspectRatio::Tall,
    });
  }
  None
}

fn get_resolution_t2i(request: &EnqueueTextToImageRequest) -> Option<RouterResolution> {
  if let Some(res) = request.common_resolution {
    return Some(convert_desktop_resolution(res));
  }
  if let Some(res) = request.image_resolution {
    return Some(match res {
      TextToImageResolution::OneK => RouterResolution::OneK,
      TextToImageResolution::TwoK => RouterResolution::TwoK,
      TextToImageResolution::FourK => RouterResolution::FourK,
    });
  }
  None
}

fn get_quality_t2i(request: &EnqueueTextToImageRequest) -> Option<RouterQuality> {
  request.quality.map(|quality| quality.to_artcraft_router_type())
}

fn convert_desktop_aspect_ratio(ar: CommonAspectRatio2) -> RouterAspectRatio {
  match ar {
    CommonAspectRatio2::Auto => RouterAspectRatio::Auto,
    CommonAspectRatio2::Square => RouterAspectRatio::Square,
    CommonAspectRatio2::WideThreeByTwo => RouterAspectRatio::WideThreeByTwo,
    CommonAspectRatio2::WideFourByThree => RouterAspectRatio::WideFourByThree,
    CommonAspectRatio2::WideFiveByFour => RouterAspectRatio::WideFiveByFour,
    CommonAspectRatio2::WideSixteenByNine => RouterAspectRatio::WideSixteenByNine,
    CommonAspectRatio2::WideTwentyOneByNine => RouterAspectRatio::WideTwentyOneByNine,
    CommonAspectRatio2::TallTwoByThree => RouterAspectRatio::TallTwoByThree,
    CommonAspectRatio2::TallThreeByFour => RouterAspectRatio::TallThreeByFour,
    CommonAspectRatio2::TallFourByFive => RouterAspectRatio::TallFourByFive,
    CommonAspectRatio2::TallNineBySixteen => RouterAspectRatio::TallNineBySixteen,
    CommonAspectRatio2::TallNineByTwentyOne => RouterAspectRatio::TallNineByTwentyOne,
    CommonAspectRatio2::Wide => RouterAspectRatio::Wide,
    CommonAspectRatio2::Tall => RouterAspectRatio::Tall,
    CommonAspectRatio2::Auto2k => RouterAspectRatio::Auto2k,
    CommonAspectRatio2::Auto4k => RouterAspectRatio::Auto4k,
    CommonAspectRatio2::SquareHd => RouterAspectRatio::SquareHd,
  }
}

fn convert_desktop_resolution(res: CommonResolution2) -> RouterResolution {
  match res {
    CommonResolution2::OneK => RouterResolution::OneK,
    CommonResolution2::TwoK => RouterResolution::TwoK,
    CommonResolution2::ThreeK => RouterResolution::ThreeK,
    CommonResolution2::FourK => RouterResolution::FourK,
    CommonResolution2::HalfK => RouterResolution::HalfK,
    CommonResolution2::FourEightyP => RouterResolution::FourEightyP,
    CommonResolution2::SevenTwentyP => RouterResolution::SevenTwentyP,
    CommonResolution2::TenEightyP => RouterResolution::TenEightyP,
  }
}
